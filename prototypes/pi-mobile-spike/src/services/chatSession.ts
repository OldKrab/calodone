import type { Agent, AgentMessage } from '@earendil-works/pi-agent-core';
import type { AssistantMessage } from '@earendil-works/pi-ai';
import { File } from 'expo-file-system';

import { createChatAgent, getThinkingLevel, getWebSearchEnabled } from '../ai/piClient';
import type { ProviderToolActivity } from '../ai/providerActivity';
import { createCaloDoneTools } from '../ai/chatTools';
import { buildChatPrompt, CHAT_PROMPT_VERSION } from '../ai/chatPrompt';
import {
  getChatAction,
  listChatActions,
  loadChatMessages,
  markChatActionUndone,
  renameChatThread,
  sanitizeChatMessage,
  saveChatMessages,
} from '../data/chatRepository';
import { appendDiagnosticEvent, deleteMeal, getDailyGoals, getGoalProfile, getMeal, getPreference, removePreference, replaceMeal, saveDailyGoals, saveGoalProfile } from '../data/mealRepository';
import type { ChatAction, ChatAttachment, ChatThread, ChatUserMessage } from '../domain/chat';
import { locale } from '../i18n';
import { acquireChatSessionLease, subscribeToChatAgent } from './chatAgentEvents';

export type ChatSessionSnapshot = {
  messages: AgentMessage[];
  streamingMessage?: AgentMessage;
  actions: ChatAction[];
  providerActivities: ProviderToolActivity[];
  busy: boolean;
  error?: string;
};

export type ChatSession = {
  send(text: string, attachments: ChatAttachment[]): Promise<void>;
  abort(): void;
  close(): Promise<void>;
};

type OpenChatSessionInput = {
  thread: ChatThread;
  selectedMealId?: string;
  selectedMealQuestions?: string[];
  onChanged: (snapshot: ChatSessionSnapshot) => void;
  onDataChanged: () => Promise<void>;
};

export async function openChatSession(input: OpenChatSessionInput): Promise<ChatSession> {
  const releaseLease = await acquireChatSessionLease(input.thread.id);
  try {
    return await createOpenChatSession(input, releaseLease);
  } catch (error) {
    releaseLease();
    throw error;
  }
}

async function createOpenChatSession(input: OpenChatSessionInput, releaseLease: () => void): Promise<ChatSession> {
  const [messages, customInstructions] = await Promise.all([
    loadChatMessages(input.thread.id),
    getPreference('assistant_custom_instructions'),
  ]);
  const attachmentMap = collectAttachments(messages);
  let actions = await listChatActions(input.thread.id);
  let threadTitle = input.thread.title;
  let turnStartedAt = Date.now();
  let agent: Agent;
  let closed = false;
  const providerActivities = new Map<string, ProviderToolActivity>();
  let persistTask: Promise<void> = Promise.resolve();

  const emit = () => input.onChanged({
    messages: agent.state.messages,
    streamingMessage: agent.state.streamingMessage,
    actions,
    providerActivities: [...providerActivities.values()],
    busy: agent.state.isStreaming,
    error: agent.state.errorMessage,
  });

  agent = await createChatAgent({
    systemPrompt: buildChatPrompt({
      language: locale === 'ru' ? 'Russian' : 'English',
      selectedMealId: input.selectedMealId,
      selectedMealQuestions: input.selectedMealQuestions,
      customInstructions,
      now: Date.now(),
    }),
    messages,
    sessionId: input.thread.id,
    onProviderActivity: (activity) => {
      if (closed) return;
      providerActivities.set(activity.id, activity);
      emit();
    },
    tools: createCaloDoneTools({
      threadId: input.thread.id,
      attachments: attachmentMap,
      onDataChanged: input.onDataChanged,
    }),
  });

  const persist = () => {
    const snapshot = agent.state.messages.map(sanitizeChatMessage);
    persistTask = persistTask.catch(() => undefined).then(() => saveChatMessages(input.thread.id, snapshot));
    return persistTask;
  };

  const unsubscribe = subscribeToChatAgent(agent, (event) => {
    if (event.type === 'tool_execution_end') {
      void listChatActions(input.thread.id).then((next) => {
        actions = next;
        emit();
      }).catch(() => undefined);
    }
    if (event.type === 'message_end' && event.message.role === 'assistant') {
      void recordChatDiagnostic(input.thread.id, turnStartedAt, event.message);
    }
    if (event.type === 'message_end' || event.type === 'agent_end') {
      agent.state.messages = agent.state.messages.map(sanitizeChatMessage);
      void persist().catch(() => undefined);
    }
    if (event.type === 'agent_end') {
      for (const [id, activity] of providerActivities) {
        if (activity.status === 'active') {
          providerActivities.set(id, { ...activity, status: agent.state.errorMessage ? 'error' : 'complete' });
        }
      }
    }
    emit();
  });
  emit();

  const session: ChatSession = {
    send: async (text, attachments) => {
      const cleanText = text.trim();
      if (!cleanText && attachments.length === 0) return;
      providerActivities.clear();
      emit();
      attachments.forEach((attachment) => attachmentMap.set(attachment.id, attachment));
      if (!threadTitle) {
        const title = cleanText || (locale === 'ru' ? 'Разговор о фото' : 'Photo conversation');
        threadTitle = title.slice(0, 44);
        await renameChatThread(input.thread.id, threadTitle);
      }
      const message: ChatUserMessage = {
        role: 'chatUser',
        text: cleanText || (locale === 'ru' ? 'Посмотри на прикреплённое фото.' : 'Look at the attached photo.'),
        attachments,
        timestamp: Date.now(),
      };
      turnStartedAt = Date.now();
      try {
        await agent.prompt(message);
      } finally {
        emit();
      }
    },
    abort: () => agent.abort(),
    close: async () => {
      if (closed) return;
      closed = true;
      agent.abort();
      await agent.waitForIdle().catch(() => undefined);
      agent.state.messages = agent.state.messages.map(sanitizeChatMessage);
      await persist().catch(() => undefined);
      unsubscribe();
      releaseLease();
    },
  };
  return session;
}

async function recordChatDiagnostic(threadId: string, startedAt: number, response: AssistantMessage): Promise<void> {
  const [thinkingLevel, webSearchEnabled] = await Promise.all([
    getThinkingLevel(response.provider, response.model),
    getWebSearchEnabled(response.provider),
  ]);
  await appendDiagnosticEvent({
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
    operation: 'chat',
    threadId,
    provider: response.provider,
    model: response.model,
    api: response.api,
    promptVersion: CHAT_PROMPT_VERSION,
    thinkingLevel,
    webSearchEnabled,
    durationMs: Date.now() - startedAt,
    responseId: response.responseId,
    stopReason: response.stopReason,
    usage: response.usage,
    contentTypes: response.content.map((block) => block.type),
    toolNames: response.content.flatMap((block) => block.type === 'toolCall' ? [block.name] : []),
    outputText: response.content.flatMap((block) => block.type === 'text' ? [block.text] : []).join('\n'),
    error: response.errorMessage,
  }).catch(() => undefined);
}

export async function undoAssistantAction(actionId: string): Promise<void> {
  const action = await getChatAction(actionId);
  if (!action || action.undone || action.canUndo === false || action.undo.kind === 'imported') return;
  if (action.undo.kind === 'restore_meal') {
    const current = await getMeal(action.undo.meal.id);
    if (action.undo.expectedMeal && !sameValue(current, action.undo.expectedMeal)) throw new Error('Meal changed after this action');
    await replaceMeal(action.undo.meal);
    const restoredUris = new Set(action.undo.meal.photos.map((photo) => photo.uri));
    for (const photo of current?.photos ?? []) {
      if (restoredUris.has(photo.uri)) continue;
      try { new File(photo.uri).delete(); } catch { /* Best-effort cleanup. */ }
    }
  } else if (action.undo.kind === 'delete_meal') {
    const meal = await getMeal(action.undo.mealId);
    if (action.undo.expectedMeal && !sameValue(meal, action.undo.expectedMeal)) throw new Error('Meal changed after this action');
    await deleteMeal(action.undo.mealId);
    for (const photo of meal?.photos ?? []) {
      try { new File(photo.uri).delete(); } catch { /* Best-effort cleanup of assistant-created photos. */ }
    }
  } else if (action.undo.kind === 'restore_goals') {
    const current = await getDailyGoals();
    if (action.undo.expectedGoals && !sameValue(current, action.undo.expectedGoals)) throw new Error('Goals changed after this action');
    await saveDailyGoals(action.undo.goals);
  } else if (action.undo.kind === 'restore_goal_profile') {
    const current = await getGoalProfile();
    if (action.undo.expectedProfile && !sameValue(current, action.undo.expectedProfile)) throw new Error('Goal profile changed after this action');
    if (action.undo.profile) await saveGoalProfile(action.undo.profile);
    else await removePreference('goal_profile');
  }
  await markChatActionUndone(action.id);
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function collectAttachments(messages: AgentMessage[]): Map<string, ChatAttachment> {
  const attachments = new Map<string, ChatAttachment>();
  for (const message of messages) {
    if (message.role !== 'chatUser') continue;
    message.attachments.forEach((attachment) => attachments.set(attachment.id, attachment));
  }
  return attachments;
}
