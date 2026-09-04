import { Ionicons } from '@expo/vector-icons';
import type { AgentMessage } from '@earendil-works/pi-agent-core';
import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '../../components/controls';
import { AnchoredMenu, type MenuAnchor } from '../../components/AnchoredMenu';
import { useAppDialog } from '../../components/AppDialog';
import { ScreenReveal } from '../../components/ScreenReveal';
import { appendDiagnosticEvent, getPreference, savePreference } from '../../data/mealRepository';
import { color, radius, space, type } from '../../design/tokens';
import type { ChatAction, ChatAttachment, ChatMealQuestionMessage, ChatThread } from '../../domain/chat';
import { mealQuestions, type Meal } from '../../domain/meal';
import { formatTime, t } from '../../i18n';
import { openChatSession, type ChatSession, type ChatSessionSnapshot } from '../../services/chatSession';
import type { ProviderToolActivity } from '../../ai/providerActivity';
import { userFacingToolActivity } from '../../ai/toolActivity';
import { AssistantMarkdown } from './AssistantMarkdown';
import { composerBottomSpace, keyboardAvoidingBehavior, keyboardAvoidingOffset, keyboardOccupiesWindow } from './composerPlacement';

type FeedItem =
  | { kind: 'message'; key: string; timestamp: number; message: AgentMessage }
  | { kind: 'action'; key: string; timestamp: number; action: ChatAction };

export function AssistantScreen(props: {
  thread: ChatThread;
  selectedMeal?: Meal;
  bottomInset: number;
  onDataChanged: () => Promise<void>;
  onHistory: () => void;
  onNewChat: () => void;
  onModelSettings: () => void;
  onClearMealContext: () => void;
  onUndo: (actionId: string) => Promise<void>;
}) {
  const [snapshot, setSnapshot] = useState<ChatSessionSnapshot>({ messages: [], actions: [], providerActivities: [], busy: false });
  const [session, setSession] = useState<ChatSession>();
  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const [undoing, setUndoing] = useState<string>();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [instructionsSaving, setInstructionsSaving] = useState(false);
  const [sessionRevision, setSessionRevision] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor>();
  const dialog = useAppDialog();
  const safeAreaInsets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const restingWindowHeight = useRef(windowHeight);
  restingWindowHeight.current = Math.max(restingWindowHeight.current, windowHeight);
  const effectiveKeyboardVisible = Platform.OS === 'android'
    ? keyboardOccupiesWindow(keyboardVisible, windowHeight, restingWindowHeight.current)
    : keyboardVisible;
  const menuButton = useRef<View>(null);
  const screenRoot = useRef<View>(null);
  const composerRoot = useRef<View>(null);
  const diagnosticTimers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const scroll = useRef<ScrollView>(null);
  const unsentAttachments = useRef<ChatAttachment[]>([]);

  useEffect(() => () => {
    for (const timer of diagnosticTimers.current) clearTimeout(timer);
    for (const attachment of unsentAttachments.current) {
      try { new File(attachment.uri).delete(); } catch { /* Best-effort cleanup. */ }
    }
  }, []);

  const recordLayoutDiagnostic = (
    phase: 'input_focus' | 'keyboard_show' | 'keyboard_hide',
    eventVisible: boolean,
    eventKeyboard?: { height: number; screenY: number },
  ) => {
    const timer = setTimeout(() => {
      diagnosticTimers.current.delete(timer);
      void Promise.all([measureInWindow(screenRoot.current), measureInWindow(composerRoot.current)]).then(([screen, composer]) => {
        const window = Dimensions.get('window');
        const keyboardMetrics = Keyboard.metrics();
        const keyboard = eventKeyboard ?? (keyboardMetrics ? {
          height: keyboardMetrics.height,
          screenY: keyboardMetrics.screenY,
        } : undefined);
        return appendDiagnosticEvent({
          id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
          createdAt: Date.now(),
          operation: 'layout',
          traceVersion: 'assistant-layout-v1',
          phase,
          platform: Platform.OS,
          platformVersion: Platform.Version,
          window,
          screen,
          composer,
          keyboard,
          keyboardEventVisible: eventVisible,
          effectiveKeyboardVisible: keyboardOccupiesWindow(eventVisible, window.height, restingWindowHeight.current),
          restingWindowHeight: restingWindowHeight.current,
          navigationInset: props.bottomInset,
          safeAreaBottom: safeAreaInsets.bottom,
        });
      }).catch(() => undefined);
    }, 220);
    diagnosticTimers.current.add(timer);
  };

  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardVisible(true);
      recordLayoutDiagnostic('keyboard_show', true, {
        height: event.endCoordinates.height,
        screenY: event.endCoordinates.screenY,
      });
    });
    const hidden = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      recordLayoutDiagnostic('keyboard_hide', false);
    });
    return () => { shown.remove(); hidden.remove(); };
  }, [props.bottomInset, safeAreaInsets.bottom]);

  useEffect(() => {
    let active = true;
    let opened: ChatSession | undefined;
    setSnapshot({ messages: [], actions: [], providerActivities: [], busy: false });
    void openChatSession({
      thread: props.thread,
      selectedMealId: props.selectedMeal?.id,
      selectedMealQuestions: mealQuestions(props.selectedMeal?.analysis?.clarification),
      onChanged: (next) => active && setSnapshot({ ...next }),
      onDataChanged: props.onDataChanged,
    }).then((next) => {
      if (!active) return void next.close();
      opened = next;
      setSession(next);
    }).catch(() => active && setSnapshot((current) => ({ ...current, error: t('assistantUnavailable') })));
    return () => {
      active = false;
      void opened?.close();
    };
  }, [props.thread.id, props.selectedMeal?.id, sessionRevision]);

  const feed = useMemo(() => buildFeed(snapshot), [snapshot]);
  const toolResults = useMemo(() => {
    const results = new Map<string, Extract<AgentMessage, { role: 'toolResult' }>>();
    for (const message of snapshot.messages) {
      if (message.role === 'toolResult') results.set(message.toolCallId, message);
    }
    return results;
  }, [snapshot.messages]);
  const streamingHasText = snapshot.streamingMessage?.role === 'assistant' && snapshot.streamingMessage.content.some((block) => block.type === 'text' && block.text.length > 0);
  const streamingHasActivity = snapshot.streamingMessage?.role === 'assistant' && snapshot.streamingMessage.content.some((block) => block.type === 'thinking' || block.type === 'toolCall');
  const hasPendingTool = snapshot.messages.some((message) => message.role === 'assistant' && message.content.some((block) => block.type === 'toolCall' && !toolResults.has(block.id)));
  const showWorking = snapshot.busy && !streamingHasText && !streamingHasActivity && !hasPendingTool && snapshot.providerActivities.length === 0;
  useEffect(() => {
    const timeout = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 40);
    return () => clearTimeout(timeout);
  }, [effectiveKeyboardVisible, feed.length, snapshot.streamingMessage, windowHeight]);

  const send = async (suggestion?: string) => {
    const text = suggestion ?? draft;
    if (!session || snapshot.busy || (!text.trim() && attachments.length === 0)) return;
    const sentAttachments = attachments;
    setDraft('');
    setAttachments([]);
    unsentAttachments.current = [];
    try {
      await session.send(text, sentAttachments);
    } catch {
      setDraft(text);
      setAttachments(sentAttachments);
      unsentAttachments.current = sentAttachments;
    }
  };

  const addImages = async (source: 'camera' | 'library') => {
    if (attachmentBusy) return;
    setAttachmentBusy(true);
    try {
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.72 })
        : await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, mediaTypes: ['images'], orderedSelection: true, quality: 0.72, selectionLimit: 0 });
      if (!result.canceled) {
        const stored = await Promise.all(result.assets.map(storeAttachment));
        setAttachments((current) => {
          const next = [...current, ...stored];
          unsentAttachments.current = next;
          return next;
        });
      }
    } catch {
      dialog.show({ title: t('assistantPhotoError'), actions: [{ label: t('close'), role: 'cancel' }] });
    } finally {
      setAttachmentBusy(false);
    }
  };

  const chooseAttachment = () => dialog.show({ title: t('attachPhoto'), actions: [
    { label: t('takePhoto'), onPress: () => void addImages('camera') },
    { label: t('chooseExistingPhoto'), onPress: () => void addImages('library') },
    { label: t('cancel'), role: 'cancel' },
  ] });

  const removeAttachment = (attachment: ChatAttachment) => {
    setAttachments((current) => {
      const next = current.filter((item) => item.id !== attachment.id);
      unsentAttachments.current = next;
      return next;
    });
    try { new File(attachment.uri).delete(); } catch { /* A picker cache may already be gone. */ }
  };

  const undo = async (actionId: string) => {
    setUndoing(actionId);
    try {
      await props.onUndo(actionId);
      await props.onDataChanged();
      setSnapshot((current) => ({
        ...current,
        actions: current.actions.map((action) => action.id === actionId ? { ...action, undone: true } : action),
      }));
    } catch {
      dialog.show({ title: t('undoUnavailable'), actions: [{ label: t('close'), role: 'cancel' }] });
    } finally {
      setUndoing(undefined);
    }
  };

  const openInstructions = async () => {
    setInstructions((await getPreference('assistant_custom_instructions')) ?? '');
    setInstructionsOpen(true);
  };

  const saveInstructions = async () => {
    setInstructionsSaving(true);
    try {
      await savePreference('assistant_custom_instructions', instructions.trim());
      setInstructionsOpen(false);
      setSessionRevision((value) => value + 1);
    } finally {
      setInstructionsSaving(false);
    }
  };

  const showHeaderMenu = () => menuButton.current?.measureInWindow((x, y, width, height) => {
    setMenuAnchor({ x, y, width, height });
  });

  return (
    <SafeAreaView ref={screenRoot} edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScreenReveal>
        <KeyboardAvoidingView
          behavior={keyboardAvoidingBehavior(Platform.OS)}
          keyboardVerticalOffset={keyboardAvoidingOffset(Platform.OS, safeAreaInsets.bottom)}
          style={styles.screen}
        >
          <View style={styles.header}>
            <IconButton icon="time-outline" label={t('chatHistory')} onPress={props.onHistory} />
            <Text adjustsFontSizeToFit minimumFontScale={0.86} numberOfLines={1} style={styles.headerTitle}>{t('assistant')}</Text>
            <IconButton ref={menuButton} icon="ellipsis-horizontal" label={t('assistantOptions')} onPress={showHeaderMenu} />
          </View>
          {props.selectedMeal && (
            <View style={styles.mealContext}>
              {props.selectedMeal.photos[0] && <Image source={{ uri: props.selectedMeal.photos[0].uri }} style={styles.mealContextPhoto} />}
              <View style={styles.mealContextCopy}>
                <Text style={styles.mealContextLabel}>{t('mealContext')}</Text>
                <Text numberOfLines={1} style={styles.mealContextTitle}>{props.selectedMeal.analysis?.title ?? t('meal')}</Text>
              </View>
              <IconButton icon="close" label={t('clearMealContext')} onPress={props.onClearMealContext} />
            </View>
          )}
          <ScrollView
            ref={scroll}
            contentContainerStyle={styles.feed}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.feedScroll}
          >
            {feed.length === 0 && !snapshot.busy ? (
              <EmptyAssistant selectedMeal={Boolean(props.selectedMeal)} onSuggestion={(value) => void send(value)} />
            ) : (
              feed.map((item) => item.kind === 'message'
                ? <MessageRow key={item.key} busy={snapshot.busy} message={item.message} toolResults={toolResults} />
                : <ActionRow key={item.key} action={item.action} busy={undoing === item.action.id} onUndo={() => void undo(item.action.id)} />)
            )}
            {snapshot.streamingMessage && <MessageRow busy={snapshot.busy} message={snapshot.streamingMessage} toolResults={toolResults} />}
            {snapshot.providerActivities.map((activity) => <ProviderActivityRow key={activity.id} activity={activity} />)}
            {showWorking && (
              <View style={styles.working}><ActivityIndicator color={color.action} size="small" /><Text style={styles.workingText}>{t('assistantWorking')}</Text></View>
            )}
            {snapshot.error && <Text accessibilityRole="alert" style={styles.error}>{snapshot.error}</Text>}
          </ScrollView>

          <View ref={composerRoot} style={[styles.composerDock, { paddingBottom: space.sm + composerBottomSpace(effectiveKeyboardVisible, props.bottomInset) }]}>
            {attachments.length > 0 && (
              <ScrollView horizontal contentContainerStyle={styles.attachments} showsHorizontalScrollIndicator={false}>
                {attachments.map((attachment) => (
                  <Pressable key={attachment.id} accessibilityLabel={t('removePhoto')} onPress={() => removeAttachment(attachment)}>
                    <Image source={{ uri: attachment.uri }} style={styles.attachment} />
                    <View style={styles.removeAttachment}><Ionicons name="close" size={12} color={color.surface} /></View>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            <View style={styles.composer}>
              <Pressable accessibilityRole="button" accessibilityLabel={t('attachPhoto')} disabled={snapshot.busy || attachmentBusy} onPress={chooseAttachment} style={({ pressed }) => [styles.attachButton, pressed && styles.pressed]}>
                {attachmentBusy ? <ActivityIndicator color={color.action} size="small" /> : <Ionicons name="add" size={24} color={color.action} />}
              </Pressable>
              <TextInput
                accessibilityLabel={t('messageAssistant')}
                editable={!snapshot.busy}
                multiline
                onChangeText={setDraft}
                onFocus={() => recordLayoutDiagnostic('input_focus', Keyboard.isVisible())}
                onSubmitEditing={() => void send()}
                placeholder={t('messageAssistant')}
                placeholderTextColor={color.muted}
                style={styles.input}
                value={draft}
              />
              <Pressable accessibilityRole="button" accessibilityLabel={snapshot.busy ? t('stop') : t('send')} disabled={!snapshot.busy && !draft.trim() && attachments.length === 0} onPress={() => snapshot.busy ? session?.abort() : void send()} style={({ pressed }) => [styles.sendButton, !snapshot.busy && !draft.trim() && attachments.length === 0 && styles.disabled, pressed && styles.sendPressed]}>
                <Ionicons name={snapshot.busy ? 'stop' : 'arrow-up'} size={20} color={color.surface} />
              </Pressable>
            </View>
          </View>
          <AssistantInstructionsModal
            busy={instructionsSaving}
            onCancel={() => setInstructionsOpen(false)}
            onChange={setInstructions}
            onSave={() => void saveInstructions()}
            value={instructions}
            visible={instructionsOpen}
          />
          <AnchoredMenu
            anchor={menuAnchor}
            items={[
              { label: t('assistantInstructions'), icon: 'options-outline', onPress: () => void openInstructions() },
              { label: t('modelSettings'), icon: 'hardware-chip-outline', onPress: props.onModelSettings },
              { label: t('newChat'), icon: 'create-outline', onPress: props.onNewChat },
            ]}
            onClose={() => setMenuAnchor(undefined)}
          />
        </KeyboardAvoidingView>
      </ScreenReveal>
    </SafeAreaView>
  );
}

export function ChatHistoryScreen(props: {
  threads: ChatThread[];
  onBack: () => void;
  onNewChat: () => void;
  onOpen: (thread: ChatThread) => void;
  onDelete: (thread: ChatThread) => void;
}) {
  const dialog = useAppDialog();
  const confirmDelete = (thread: ChatThread) => dialog.show({ title: t('deleteConversationTitle'), actions: [
    { label: t('delete'), role: 'destructive', onPress: () => props.onDelete(thread) },
    { label: t('cancel'), role: 'cancel' },
  ] });
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenReveal>
        <View style={styles.historyHeader}>
          <IconButton icon="arrow-back" label={t('back')} onPress={props.onBack} />
          <Text adjustsFontSizeToFit minimumFontScale={0.86} numberOfLines={1} style={styles.headerTitle}>{t('chatHistory')}</Text>
          <IconButton icon="add" label={t('newChat')} onPress={props.onNewChat} />
        </View>
        <ScrollView contentContainerStyle={styles.historyList}>
          {props.threads.map((thread) => (
            <View key={thread.id} style={styles.threadRow}>
              <Pressable accessibilityRole="button" onPress={() => props.onOpen(thread)} style={({ pressed }) => [styles.threadOpen, pressed && styles.threadPressed]}>
                <View style={styles.threadCopy}>
                  <Text numberOfLines={1} style={styles.threadTitle}>{thread.title || t('newConversation')}</Text>
                  <Text style={styles.threadTime}>{new Date(thread.updatedAt).toLocaleString()}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={color.muted} />
              </Pressable>
              <IconButton icon="ellipsis-horizontal" label={t('deleteConversation')} onPress={() => confirmDelete(thread)} />
            </View>
          ))}
        </ScrollView>
      </ScreenReveal>
    </SafeAreaView>
  );
}

function AssistantInstructionsModal(props: {
  visible: boolean;
  value: string;
  busy: boolean;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <Modal animationType="fade" onRequestClose={props.onCancel} transparent visible={props.visible}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' || Platform.OS === 'android' ? 'padding' : undefined} style={styles.instructionsBackdrop}>
        <Pressable accessibilityLabel={t('close')} accessibilityRole="button" onPress={props.onCancel} style={StyleSheet.absoluteFill} />
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.instructionsSafeArea}>
          <View accessibilityViewIsModal style={styles.instructionsSheet}>
            <Text accessibilityRole="header" style={styles.instructionsTitle}>{t('assistantInstructions')}</Text>
            <Text style={styles.instructionsHelp}>{t('assistantInstructionsHelp')}</Text>
            <TextInput
              autoFocus
              maxLength={4000}
              multiline
              onChangeText={props.onChange}
              placeholder={t('assistantInstructionsPlaceholder')}
              placeholderTextColor={color.muted}
              style={styles.instructionsInput}
              textAlignVertical="top"
              value={props.value}
            />
            <View style={styles.instructionsActions}>
              <Pressable accessibilityRole="button" disabled={props.busy} onPress={props.onCancel} style={({ pressed }) => [styles.instructionsSecondary, pressed && styles.threadPressed]}>
                <Text style={styles.instructionsSecondaryText}>{t('cancel')}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={props.busy} onPress={props.onSave} style={({ pressed }) => [styles.instructionsPrimary, pressed && styles.sendPressed]}>
                {props.busy ? <ActivityIndicator color={color.surface} size="small" /> : <Text style={styles.instructionsPrimaryText}>{t('save')}</Text>}
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function EmptyAssistant(props: { selectedMeal: boolean; onSuggestion: (value: string) => void }) {
  const suggestions = props.selectedMeal
    ? [t('suggestExplainMeal'), t('suggestCorrectMeal')]
    : [t('suggestYesterday'), t('suggestGoals')];
  return (
    <View style={styles.empty}>
      <View style={styles.emptyMark}><Ionicons name="chatbox-ellipses-outline" size={27} color={color.action} /></View>
      <Text style={styles.emptyTitle}>{props.selectedMeal ? t('askAboutMeal') : t('assistantReady')}</Text>
      <View style={styles.suggestions}>
        {suggestions.map((suggestion) => (
          <Pressable key={suggestion} accessibilityRole="button" onPress={() => props.onSuggestion(suggestion)} style={({ pressed }) => [styles.suggestion, pressed && styles.threadPressed]}>
            <Text style={styles.suggestionText}>{suggestion}</Text>
            <Ionicons name="arrow-forward" size={16} color={color.action} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function MessageRow(props: {
  message: AgentMessage;
  busy: boolean;
  toolResults: ReadonlyMap<string, Extract<AgentMessage, { role: 'toolResult' }>>;
}) {
  if (props.message.role === 'toolResult' || props.message.role === 'user') return null;
  if (props.message.role === 'mealQuestion') {
    const questionMessage = props.message as ChatMealQuestionMessage;
    return (
      <View style={styles.questionMessage}>
        <Text style={styles.questionMessageLabel}>{t('clarificationTitle')}</Text>
        {questionMessage.questions.map((question, index) => (
          <Text key={`${question}-${index}`} style={styles.questionMessageText}>
            {questionMessage.questions.length > 1 ? `${index + 1}. ` : ''}{question}
          </Text>
        ))}
      </View>
    );
  }
  if (props.message.role === 'chatUser') {
    return (
      <View style={styles.userWrap}>
        {props.message.attachments.length > 0 && (
          <ScrollView horizontal contentContainerStyle={styles.messagePhotos} showsHorizontalScrollIndicator={false}>
            {props.message.attachments.map((photo) => <Image key={photo.id} source={{ uri: photo.uri }} style={styles.messagePhoto} />)}
          </ScrollView>
        )}
        <View style={styles.userMessage}><Text style={styles.userText}>{props.message.text}</Text></View>
      </View>
    );
  }
  if (props.message.role !== 'assistant') return null;
  const hasVisibleContent = props.message.content.some((block) => block.type === 'toolCall' || (block.type === 'text' && Boolean(block.text)));
  const isThinking = props.busy && props.message.content.some((block) => block.type === 'thinking');
  if (!hasVisibleContent && !isThinking) return null;
  return (
    <View style={styles.assistantMessage}>
      {props.message.content.map((block, index) => block.type === 'text'
        ? (block.text ? <AssistantMarkdown key={`text-${index}`}>{block.text}</AssistantMarkdown> : null)
        : block.type === 'toolCall'
          ? <ToolActivityRow key={block.id} call={block} result={props.toolResults.get(block.id)} busy={props.busy} />
          : null)}
      {!hasVisibleContent && isThinking && <WorkingRow label={t('assistantWorking')} />}
    </View>
  );
}

function ToolActivityRow(props: {
  call: Extract<Extract<AgentMessage, { role: 'assistant' }>['content'][number], { type: 'toolCall' }>;
  result?: Extract<AgentMessage, { role: 'toolResult' }>;
  busy: boolean;
}) {
  const active = !props.result && props.busy;
  const failed = props.result?.isError;
  return (
    <View accessibilityLabel={toolActivityLabel(props.call.name, props.call.arguments)} style={styles.toolActivity}>
      {active
        ? <ActivityIndicator color={color.action} size="small" />
        : <Ionicons name={failed ? 'alert-circle-outline' : 'checkmark'} size={16} color={failed ? color.error : color.muted} />}
      <Text numberOfLines={2} style={[styles.toolActivityText, failed && styles.toolActivityError]}>
        {toolActivityLabel(props.call.name, props.call.arguments)}
      </Text>
    </View>
  );
}

function ProviderActivityRow(props: { activity: ProviderToolActivity }) {
  const failed = props.activity.status === 'error';
  return (
    <View accessibilityLabel={toolActivityLabel(props.activity.name, {})} style={styles.toolActivity}>
      {props.activity.status === 'active'
        ? <ActivityIndicator color={color.action} size="small" />
        : <Ionicons name={failed ? 'alert-circle-outline' : 'checkmark'} size={16} color={failed ? color.error : color.muted} />}
      <Text numberOfLines={2} style={[styles.toolActivityText, failed && styles.toolActivityError]}>
        {toolActivityLabel(props.activity.name, {})}
      </Text>
    </View>
  );
}

function WorkingRow(props: { label: string }) {
  return (
    <View style={styles.working}>
      <ActivityIndicator color={color.action} size="small" />
      <Text style={styles.workingText}>{props.label}</Text>
    </View>
  );
}

function toolActivityLabel(name: string, args: Record<string, unknown>): string {
  const generated = userFacingToolActivity(args.statusText);
  if (generated) return generated;
  if (name === 'search_meals' || name === 'list_meals') return t('toolListMeals');
  if (name === 'get_meal') return t('toolGetMeal');
  if (name === 'view_meal_photos') return t('toolViewMealPhotos');
  if (name === 'summarize_nutrition') return t('toolSummarizeNutrition');
  if (name === 'get_goals') return t('toolGetGoals');
  if (name === 'get_goal_profile') return t('toolGetGoalProfile');
  if (name === 'create_meal') return t('toolCreateMeal');
  if (name === 'edit_meal' || name === 'update_meal') return t('toolUpdateMeal');
  if (name === 'reanalyze_meal') return t('toolReanalyzeMeal');
  if (name === 'delete_meal') return t('toolDeleteMeal');
  if (name === 'answer_meal_question' || name === 'answer_meal_clarification') return t('toolAnswerClarification');
  if (name === 'update_goals') return t('toolUpdateGoals');
  if (name === 'update_goal_profile') return t('toolUpdateGoalProfile');
  if (name === 'recalculate_goals_from_profile') return t('toolRecalculateGoals');
  if (name === 'web_search') return t('toolWebSearch');
  return t('toolFallback', { tool: name.replaceAll('_', ' ') });
}

function ActionRow(props: { action: ChatAction; busy: boolean; onUndo: () => void }) {
  return (
    <View style={styles.actionRow}>
      <Ionicons name={props.action.undone ? 'arrow-undo-outline' : 'checkmark'} size={17} color={props.action.undone ? color.muted : color.action} />
      <Text style={[styles.actionLabel, props.action.undone && styles.actionUndone]}>{props.action.label}</Text>
      {!props.action.undone && props.action.canUndo !== false && (
        <Pressable accessibilityRole="button" disabled={props.busy} hitSlop={8} onPress={props.onUndo}>
          <Text style={styles.undo}>{props.busy ? t('undoing') : t('undo')}</Text>
        </Pressable>
      )}
    </View>
  );
}

function buildFeed(snapshot: ChatSessionSnapshot): FeedItem[] {
  const messages = snapshot.messages.flatMap((message, index): FeedItem[] => {
    if (message.role !== 'assistant' && message.role !== 'chatUser' && message.role !== 'mealQuestion') return [];
    const timestamp = 'timestamp' in message ? message.timestamp : Date.now();
    return [{ kind: 'message', key: `message-${index}-${timestamp}`, timestamp, message }];
  });
  const actions = snapshot.actions.map((action): FeedItem => ({ kind: 'action', key: `action-${action.id}`, timestamp: action.createdAt, action }));
  return [...messages, ...actions].sort((left, right) => left.timestamp - right.timestamp);
}

function measureInWindow(view: { measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => void } | null): Promise<{ x: number; y: number; width: number; height: number } | undefined> {
  if (!view) return Promise.resolve(undefined);
  return new Promise((resolve) => view.measureInWindow((x, y, width, height) => resolve({ x, y, width, height })));
}

async function storeAttachment(asset: ImagePicker.ImagePickerAsset): Promise<ChatAttachment> {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  const mimeType = asset.mimeType ?? 'image/jpeg';
  const extension = mimeType.includes('png') ? 'png' : 'jpg';
  const directory = new Directory(Paths.document, 'chat-attachments');
  directory.create({ idempotent: true, intermediates: true });
  const destination = new File(directory, `${id}.${extension}`);
  await new File(asset.uri).copy(destination);
  return { id, uri: destination.uri, mimeType, createdAt: Date.now() };
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: color.canvas, flex: 1 },
  screen: { flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', height: 60, justifyContent: 'space-between', paddingHorizontal: space.sm },
  historyHeader: { alignItems: 'center', flexDirection: 'row', height: 60, justifyContent: 'space-between', paddingHorizontal: space.sm },
  headerTitle: { color: color.ink, flex: 1, fontFamily: type.ticketBold, fontSize: 25, textAlign: 'center' },
  mealContext: { alignItems: 'center', borderBottomColor: color.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', marginHorizontal: space.md, minHeight: 58, paddingBottom: space.sm },
  mealContextPhoto: { borderRadius: radius.image, height: 42, width: 42 },
  mealContextCopy: { flex: 1, marginLeft: space.sm, minWidth: 0 },
  mealContextLabel: { color: color.muted, fontFamily: type.ticket, fontSize: 11, letterSpacing: 0.5 },
  mealContextTitle: { color: color.ink, fontFamily: type.ticketBold, fontSize: 17, marginTop: 2 },
  feedScroll: { flex: 1 },
  feed: { flexGrow: 1, gap: space.md, paddingBottom: space.md, paddingHorizontal: space.md, paddingTop: space.sm },
  empty: { flex: 1, justifyContent: 'center', minHeight: 420, paddingHorizontal: space.sm },
  emptyMark: { alignItems: 'center', borderColor: color.line, borderRadius: radius.control, borderWidth: StyleSheet.hairlineWidth, height: 52, justifyContent: 'center', width: 52 },
  emptyTitle: { color: color.ink, fontFamily: type.ticketBold, fontSize: 28, lineHeight: 31, marginTop: space.md },
  suggestions: { borderTopColor: color.line, borderTopWidth: StyleSheet.hairlineWidth, marginTop: space.lg },
  suggestion: { alignItems: 'center', borderBottomColor: color.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 56, paddingHorizontal: space.xs },
  suggestionText: { color: color.ink, flex: 1, fontSize: 15, lineHeight: 21, marginRight: space.md },
  userWrap: { alignItems: 'flex-end' },
  userMessage: { backgroundColor: color.surfacePressed, borderRadius: radius.surface, maxWidth: '86%', paddingHorizontal: 14, paddingVertical: 11 },
  userText: { color: color.ink, fontSize: 15, lineHeight: 21 },
  messagePhotos: { gap: space.sm, marginBottom: space.sm },
  messagePhoto: { borderRadius: radius.image, height: 104, width: 104 },
  assistantMessage: { maxWidth: '94%', paddingHorizontal: 2 },
  questionMessage: { backgroundColor: color.surface, borderColor: color.line, borderRadius: radius.surface, borderWidth: StyleSheet.hairlineWidth, maxWidth: '94%', padding: space.md },
  questionMessageLabel: { color: color.pending, fontFamily: type.ticketBold, fontSize: 13, letterSpacing: 0.35, marginBottom: 3 },
  questionMessageText: { color: color.ink, fontSize: 16, fontWeight: '600', lineHeight: 22, marginTop: 5 },
  working: { alignItems: 'center', flexDirection: 'row', gap: space.sm, paddingVertical: space.sm },
  workingText: { color: color.muted, fontSize: 13 },
  toolActivity: { alignItems: 'center', flexDirection: 'row', gap: space.sm, minHeight: 34, paddingVertical: 6 },
  toolActivityText: { color: color.muted, flexShrink: 1, fontSize: 13 },
  toolActivityError: { color: color.error },
  error: { color: color.error, fontSize: 13, lineHeight: 18 },
  actionRow: { alignItems: 'flex-start', flexDirection: 'row', minHeight: 34, paddingHorizontal: 2, paddingVertical: 7 },
  actionLabel: { color: color.ink, flex: 1, fontSize: 13, lineHeight: 18, marginHorizontal: space.sm },
  actionUndone: { color: color.muted },
  undo: { color: color.action, fontFamily: type.ticketBold, fontSize: 13, lineHeight: 18 },
  composerDock: { backgroundColor: color.canvas, paddingHorizontal: space.md, paddingTop: space.sm },
  composer: { alignItems: 'flex-end', backgroundColor: color.surface, borderColor: color.line, borderRadius: radius.surface, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 58, padding: 5 },
  attachButton: { alignItems: 'center', borderRadius: radius.control, height: 48, justifyContent: 'center', width: 44 },
  input: { color: color.ink, flex: 1, fontSize: 15, lineHeight: 20, maxHeight: 112, minHeight: 48, paddingHorizontal: space.sm, paddingVertical: 13 },
  sendButton: { alignItems: 'center', backgroundColor: color.action, borderRadius: radius.control, height: 48, justifyContent: 'center', width: 48 },
  sendPressed: { backgroundColor: color.actionPressed },
  disabled: { opacity: 0.4 },
  pressed: { backgroundColor: color.surfacePressed },
  attachments: { gap: space.sm, paddingBottom: space.sm },
  attachment: { borderRadius: radius.image, height: 58, width: 58 },
  removeAttachment: { alignItems: 'center', backgroundColor: color.cameraChrome, borderRadius: radius.round, height: 20, justifyContent: 'center', position: 'absolute', right: -4, top: -4, width: 20 },
  historyList: { paddingHorizontal: space.md },
  threadRow: { alignItems: 'center', borderBottomColor: color.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 70, paddingVertical: space.xs },
  threadOpen: { alignItems: 'center', flex: 1, flexDirection: 'row', minHeight: 62, paddingHorizontal: space.xs },
  threadPressed: { backgroundColor: color.surfacePressed },
  threadCopy: { flex: 1, minWidth: 0 },
  threadTitle: { color: color.ink, fontFamily: type.ticketBold, fontSize: 19 },
  threadTime: { color: color.muted, fontSize: 12, marginTop: 4 },
  instructionsBackdrop: { backgroundColor: 'rgba(30, 33, 38, 0.58)', flex: 1, justifyContent: 'flex-end' },
  instructionsSafeArea: { padding: space.md },
  instructionsSheet: { backgroundColor: color.surface, borderRadius: radius.surface, padding: space.md },
  instructionsTitle: { color: color.ink, fontFamily: type.ticketBold, fontSize: 25, lineHeight: 29 },
  instructionsHelp: { color: color.muted, fontSize: 14, lineHeight: 20, marginTop: space.xs },
  instructionsInput: { backgroundColor: color.canvas, borderColor: color.line, borderRadius: radius.control, borderWidth: StyleSheet.hairlineWidth, color: color.ink, fontSize: 15, lineHeight: 21, marginTop: space.md, minHeight: 136, padding: 13 },
  instructionsActions: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  instructionsSecondary: { alignItems: 'center', borderColor: color.line, borderRadius: radius.control, borderWidth: StyleSheet.hairlineWidth, flex: 1, justifyContent: 'center', minHeight: 50 },
  instructionsSecondaryText: { color: color.muted, fontFamily: type.ticketBold, fontSize: 16 },
  instructionsPrimary: { alignItems: 'center', backgroundColor: color.action, borderRadius: radius.control, flex: 1, justifyContent: 'center', minHeight: 50 },
  instructionsPrimaryText: { color: color.surface, fontFamily: type.ticketBold, fontSize: 16 },
});
