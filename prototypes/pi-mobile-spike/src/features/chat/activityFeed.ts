import type { AgentMessage } from '@earendil-works/pi-agent-core';
import type { ChatAction } from '../../domain/chat';

type ToolCall = Extract<Extract<AgentMessage, { role: 'assistant' }>['content'][number], { type: 'toolCall' }>;
export type ToolStatus = 'preparing' | 'running' | 'completed' | 'failed' | 'cancelled';
export type ToolExecution = { status: ToolStatus; arguments: Record<string, unknown> };
export type ActivityTool = { call: ToolCall; status: ToolStatus };
export type ActivityFeedItem =
  | { kind: 'message'; key: string; message: AgentMessage }
  | { kind: 'activity'; key: string; tools: ActivityTool[] }
  | { kind: 'action'; key: string; action: ChatAction };

/** Tool-result boundaries are invisible. User messages and assistant prose break
 * activity groups so joining internal agent steps never reorders conversation text.
 * Receipts follow their activity section and remain outside its disclosure. */
export function buildActivityFeed(input: {
  messages: AgentMessage[];
  streamingMessage?: AgentMessage;
  actions: ChatAction[];
  busy: boolean;
  toolExecutions?: Record<string, ToolExecution>;
  /** Current meal state controls actionable cards; durable history is not a pending queue. */
  pendingMealQuestions?: Record<string, string[]>;
  answeringMealIds?: ReadonlySet<string>;
}): ActivityFeedItem[] {
  const messages = [...input.messages];
  if (input.streamingMessage && !messages.includes(input.streamingMessage)) messages.push(input.streamingMessage);
  const results = new Map(messages.flatMap(message => message.role === 'toolResult' ? [[message.toolCallId, message] as const] : []));
  const lastUser = messages.findLastIndex(message => message.role === 'chatUser' || message.role === 'user');
  const feed: ActivityFeedItem[] = [];
  let group: Extract<ActivityFeedItem, { kind: 'activity' }> | undefined;
  const receipts = [...input.actions].sort((a, b) => a.createdAt - b.createdAt);
  const flushReceipts = (before: number) => {
    while (receipts.length && receipts[0].createdAt <= before) {
      const action = receipts.shift()!;
      feed.push({ kind: 'action', key: `action-${action.id}`, action });
    }
  };
  for (const [index, message] of messages.entries()) {
    if (message.role === 'toolResult') continue;
    const key = `message-${index}`;
    if (message.role !== 'assistant') {
      group = undefined;
      flushReceipts(message.timestamp);
      if (message.role === 'mealQuestion' && input.answeringMealIds?.has(message.mealId)) continue;
      if (message.role === 'mealQuestion' && input.pendingMealQuestions) {
        const pending = input.pendingMealQuestions[message.mealId] ?? [];
        const questions = message.questions.filter(question => pending.includes(question));
        if (questions.length) feed.push({ kind: 'message', key, message: { ...message, questions } });
      } else if (message.role === 'chatUser' || message.role === 'mealQuestion') {
        feed.push({ kind: 'message', key, message });
      }
      continue;
    }
    for (const [blockIndex, block] of message.content.entries()) {
      if (block.type === 'text' && block.text) {
        group = undefined;
        flushReceipts(message.timestamp);
        feed.push({ kind: 'message', key: `${key}-${blockIndex}`, message: { ...message, content: [block] } });
      } else if (block.type === 'toolCall') {
        if (!group) {
          group = { kind: 'activity', key: `activity-${block.id}`, tools: [] };
          feed.push(group);
        }
        const result = results.get(block.id);
        const execution = input.toolExecutions?.[block.id];
        const status = execution?.status === 'cancelled' ? 'cancelled' : result ? (result.isError ? 'failed' : 'completed') : execution?.status ?? (input.busy && index > lastUser ? 'preparing' : 'cancelled');
        group.tools.push({ call: { ...block, arguments: execution?.arguments ?? (status === 'preparing' ? {} : block.arguments) }, status });
      }
    }
  }
  flushReceipts(Infinity);
  return feed;
}
