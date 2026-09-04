import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
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

import { ScreenReveal } from '../../components/ScreenReveal';
import { keyboardOccupiesWindow, overlayKeyboardBehavior, overlayKeyboardOffset } from '../../components/adaptiveScreen';
import { color, radius, space, type } from '../../design/tokens';
import type { DailyGoals, Meal } from '../../domain/meal';
import { mealQuestions, totalsFor } from '../../domain/meal';
import { displayEnergy, displayWeight, type NutritionUnits } from '../../domain/preferences';
import { formatDay, formatNumber, formatTime, t, type CopyKey } from '../../i18n';
import type { MealActivityStage } from '../../services/mealActivity';
import { macroGoalRows } from './homeSummary';

export function HomeScreen(props: {
  meals: Meal[];
  activities: ReadonlyMap<string, MealActivityStage>;
  goals: DailyGoals;
  units: NutritionUnits;
  day: number;
  canGoNext: boolean;
  bottomInset?: number;
  onCapture: () => void;
  onOpen: (meal: Meal) => void;
  onMealLongPress: (meal: Meal) => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onRetry: (meal: Meal) => void;
  onAnswer: (meal: Meal, answer: string) => void;
  onAskAssistant: (meal: Meal) => void;
  onSettings: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const restingWindowHeight = useRef(windowHeight);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  restingWindowHeight.current = Math.max(restingWindowHeight.current, windowHeight);
  const keyboardOpen = keyboardOccupiesWindow(keyboardVisible, windowHeight, restingWindowHeight.current);
  const totals = totalsFor(props.meals);
  const newestFirst = [...props.meals].sort((left, right) => right.capturedAt - left.capturedAt);
  const attentionMeals = newestFirst.filter((meal) => meal.status === 'needs_input' || meal.status === 'failed');
  const processingMeals = newestFirst.filter((meal) => meal.status === 'queued' || meal.status === 'analyzing');
  const loggedMeals = newestFirst.filter((meal) => meal.status === 'complete' || meal.status === 'estimated');
  const macros = macroGoalRows(totals, props.goals);

  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hidden = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { shown.remove(); hidden.remove(); };
  }, []);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={overlayKeyboardBehavior(Platform.OS)}
        keyboardVerticalOffset={overlayKeyboardOffset(Platform.OS, insets.bottom)}
        style={styles.screen}
      >
        <ScreenReveal>
        <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: keyboardOpen ? space.lg : 132 + (props.bottomInset ?? insets.bottom) }]}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.rail}>
            <View style={styles.railHeader}>
              <HeaderButton icon="chevron-back" label={t('previousDay')} onPress={props.onPreviousDay} />
              <View pointerEvents="none" style={styles.dayBlock}>
                <Text maxFontSizeMultiplier={1.2} numberOfLines={1} style={styles.day}>
                  {formatDay(props.day)}
                </Text>
              </View>
              <View style={styles.railActions}>
                <HeaderButton
                  disabled={!props.canGoNext}
                  icon="chevron-forward"
                  label={t('nextDay')}
                  onPress={props.onNextDay}
                />
                <HeaderButton icon="settings-outline" label={t('settings')} onPress={props.onSettings} />
              </View>
            </View>
          </View>

          {attentionMeals.length > 0 && (
            <View style={styles.attentionSection}>
              <SectionHeading label={t('needsAttention')} count={attentionMeals.length} />
              <View style={styles.ticketStack}>
                {attentionMeals.map((meal, index) => (
                  <MealTicket
                    key={meal.id}
                    index={index}
                    compact={index > 0}
                    meal={meal}
                    activity={props.activities.get(meal.id)}
                    units={props.units}
                    onAnswer={(answer) => props.onAnswer(meal, answer)}
                    onAskAssistant={() => props.onAskAssistant(meal)}
                    onOpen={() => props.onOpen(meal)}
                    onLongPress={() => props.onMealLongPress(meal)}
                    onRetry={() => props.onRetry(meal)}
                  />
                ))}
              </View>
            </View>
          )}

          <View style={styles.summaryStrip}>
            <View style={styles.totalRow}>
              <Text style={styles.totalValue}>{formatNumber(displayEnergy(totals.calories, props.units))}</Text>
              <View style={styles.totalCopy}>
                <Text style={styles.totalUnit}>{energyUnit(props.units)}</Text>
                <Text style={styles.totalGoal}>
                  {props.goals.calories ? `/ ${formatNumber(displayEnergy(props.goals.calories, props.units))} ${t('goal')}` : t('noGoal')}
                </Text>
              </View>
            </View>
            <View style={styles.summaryMacros}>
              {macros.map((macro) => (
                <View key={macro.key} style={styles.macroMetric}>
                  <Text style={styles.macroLabel}>{t(macro.key)}</Text>
                  <Text style={styles.macroValue}>{formatMacroGoal(macro.current, macro.goal, props.units)}</Text>
                </View>
              ))}
            </View>
          </View>

          {props.meals.length === 0 ? (
            <View style={styles.emptyTicket}>
              <Text style={styles.emptyTitle}>{t(props.canGoNext ? 'emptyPastTitle' : 'emptyTitle')}</Text>
              <Text style={styles.emptyBody}>{t(props.canGoNext ? 'emptyPastBody' : 'emptyBody')}</Text>
            </View>
          ) : loggedMeals.length > 0 ? (
            <View style={styles.loggedSection}>
              <SectionHeading label={t('loggedMeals')} count={loggedMeals.length} />
              {loggedMeals.map((meal, index) => (
                <MealTicket
                  key={meal.id}
                  index={index}
                  compact
                  meal={meal}
                  activity={props.activities.get(meal.id)}
                  units={props.units}
                  onAnswer={(answer) => props.onAnswer(meal, answer)}
                  onAskAssistant={() => props.onAskAssistant(meal)}
                  onOpen={() => props.onOpen(meal)}
                  onLongPress={() => props.onMealLongPress(meal)}
                  onRetry={() => props.onRetry(meal)}
                />
              ))}
            </View>
          ) : null}

          {processingMeals.length > 0 && (
            <View style={styles.processingSection}>
              <SectionHeading label={t('inProgress')} count={processingMeals.length} />
              <View style={styles.processingList}>
                {processingMeals.map((meal, index) => (
                  <MealTicket
                    key={meal.id}
                    compact
                    index={index}
                    meal={meal}
                    activity={props.activities.get(meal.id)}
                    units={props.units}
                    onAnswer={(answer) => props.onAnswer(meal, answer)}
                    onAskAssistant={() => props.onAskAssistant(meal)}
                    onOpen={() => props.onOpen(meal)}
                    onLongPress={() => props.onMealLongPress(meal)}
                    onRetry={() => props.onRetry(meal)}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {!keyboardOpen && <View style={[styles.captureDock, { bottom: props.bottomInset ?? 0, paddingBottom: space.md + (props.bottomInset ? 0 : insets.bottom) }]} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('addMeal')}
            onPress={props.onCapture}
            style={({ pressed }) => [styles.blankTicket, pressed && styles.blankTicketPressed]}
          >
            <View style={styles.captureMark}>
              <Ionicons name="camera" size={22} color={color.surface} />
            </View>
            <View style={styles.captureCopy}>
              <Text style={styles.captureTitle}>{t('addMeal')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={color.action} />
          </Pressable>
        </View>}
        </View>
        </ScreenReveal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function HeaderButton(props: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.label}
      accessibilityState={{ disabled: props.disabled }}
      disabled={props.disabled}
      hitSlop={6}
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.headerButton,
        props.disabled && styles.headerButtonDisabled,
        pressed && styles.headerButtonPressed,
      ]}
    >
      <Ionicons name={props.icon} size={22} color={color.cameraText} />
    </Pressable>
  );
}

function SectionHeading(props: { label: string; count: number }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{props.label}</Text>
      <Text style={styles.count}>{props.count}</Text>
    </View>
  );
}

function MealTicket(props: {
  meal: Meal;
  activity?: MealActivityStage;
  units: NutritionUnits;
  index: number;
  compact?: boolean;
  onOpen: () => void;
  onLongPress: () => void;
  onRetry: () => void;
  onAnswer: (answer: string) => void | Promise<void>;
  onAskAssistant: () => void;
}) {
  const pulse = useRef(new Animated.Value(0.35)).current;
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [answerError, setAnswerError] = useState(false);
  const isWorking = props.meal.status === 'queued' || props.meal.status === 'analyzing';

  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!isWorking || reduced) return;
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 850, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0.35, duration: 850, useNativeDriver: true }),
        ]),
      );
      animation.start();
    });
    return () => animation?.stop();
  }, [isWorking, pulse]);

  const analysis = props.meal.analysis;
  const title = analysis?.title ?? t('meal');
  const statusKey: CopyKey | undefined =
    props.meal.status === 'needs_input' ? 'needsInput'
      : props.meal.status === 'estimated' ? 'estimated'
        : props.meal.status === 'failed' ? 'failed'
          : props.meal.status === 'queued' ? 'queued'
            : props.meal.status === 'analyzing' ? 'analyzing'
              : undefined;

  const submit = async () => {
    if (!answer.trim() || busy) return;
    setBusy(true);
    setAnswerError(false);
    try {
      await props.onAnswer(answer.trim());
      setAnswer('');
    } catch {
      setAnswerError(true);
    } finally {
      setBusy(false);
    }
  };

  if (props.compact) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={t('mealOptionsHint')}
        delayLongPress={350}
        onLongPress={props.onLongPress}
        onPress={props.onOpen}
        style={({ pressed }) => [styles.compactMeal, isWorking && styles.processingMeal, pressed && styles.ticketPressed]}
      >
        {props.meal.photos[0] ? <Image source={{ uri: props.meal.photos[0].uri }} style={styles.compactPhoto} /> : null}
        <View style={styles.compactCopy}>
          <Text numberOfLines={1} style={styles.compactTitle}>{title}</Text>
          <View style={styles.compactMeta}>
            <Text style={styles.compactMetaText}>{formatTime(props.meal.capturedAt)}</Text>
            {isWorking ? (
              <View style={styles.compactStatus}>
                <Animated.View style={[styles.statusDot, { opacity: pulse }]} />
                <Text style={styles.processingText}>{activityLabel(props.activity)}</Text>
              </View>
            ) : statusKey ? (
              <Text style={[styles.compactStatusText, props.meal.status === 'failed' && styles.statusErrorText]}>{t(statusKey)}</Text>
            ) : analysis ? (
              <Text style={styles.compactMetaText}>{formatNumber(displayEnergy(analysis.totals.calories, props.units))} {energyUnit(props.units)}</Text>
            ) : null}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={color.muted} />
      </Pressable>
    );
  }

  return (
    <View style={styles.ticket}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={t('mealOptionsHint')}
        delayLongPress={350}
        onLongPress={props.onLongPress}
        onPress={props.onOpen}
        style={({ pressed }) => [styles.ticketPressable, pressed && styles.ticketPressed]}
      >
        <View style={styles.attentionMeal}>
          {props.meal.photos[0] ? <Image source={{ uri: props.meal.photos[0].uri }} style={styles.attentionPhoto} /> : null}
          <View style={styles.ticketTitleCopy}>
            <Text style={styles.mealType}>{analysis ? t(analysis.mealType) : t('meal')} · {formatTime(props.meal.capturedAt)}</Text>
            <Text numberOfLines={1} style={styles.mealTitle}>{title}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={color.muted} />
        </View>
      </Pressable>

      {props.meal.status === 'failed' && (
        <Pressable accessibilityRole="button" onPress={props.onRetry} style={styles.failedAction}>
          <Text style={styles.failedCopy}>{t('failed')}</Text>
          <Text style={styles.ticketActionText}>{t('retry')}</Text>
        </Pressable>
      )}

      {mealQuestions(analysis?.clarification).length > 0 && (
        <View style={styles.clarification}>
          <Text style={styles.clarificationLabel}>{t('clarificationTitle')}</Text>
          {mealQuestions(analysis?.clarification).map((question, index, questions) => (
            <Text key={`${question}-${index}`} style={styles.question}>
              {questions.length > 1 ? `${index + 1}. ` : ''}{question}
            </Text>
          ))}
          <View style={styles.answerRow}>
            <TextInput
              accessibilityLabel={t('answerPlaceholder')}
              editable={!busy}
              onChangeText={setAnswer}
              onSubmitEditing={submit}
              placeholder={t('answerPlaceholder')}
              placeholderTextColor={color.muted}
              returnKeyType="send"
              style={styles.answerInput}
              value={answer}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('answer')}
              disabled={!answer.trim() || busy}
              onPress={submit}
              style={({ pressed }) => [styles.answerButton, (!answer.trim() || busy) && styles.answerDisabled, pressed && styles.answerPressed]}
            >
              <Ionicons name={busy ? 'hourglass-outline' : 'checkmark'} size={21} color={color.surface} />
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" onPress={props.onAskAssistant} style={styles.answerInChat}>
            <Ionicons name="chatbox-ellipses-outline" size={17} color={color.action} />
            <Text style={styles.answerInChatText}>{t('answerInChat')}</Text>
            <Ionicons name="chevron-forward" size={16} color={color.muted} />
          </Pressable>
          {answerError && <Text accessibilityRole="alert" style={styles.answerError}>{t('correctionError')}</Text>}
        </View>
      )}
    </View>
  );
}

function activityLabel(stage?: MealActivityStage): string {
  if (stage === 'reading_photos') return t('readingMealPhotos');
  if (stage === 'reviewing_meal') return t('reviewingMeal');
  if (stage === 'thinking') return t('assistantWorking');
  if (stage === 'web_search') return t('toolWebSearch');
  if (stage === 'writing_result') return t('writingMealResult');
  if (stage === 'saving_result') return t('savingMealResult');
  return t('analyzing');
}

function energyUnit(units: NutritionUnits): string {
  return units.energy === 'kj' ? t('kilojoules') : t('kcal');
}

function formatMacroGoal(grams: number, goal: number | undefined, units: NutritionUnits): string {
  const decimals = units.weight === 'oz' ? 1 : 0;
  const current = formatNumber(displayWeight(grams, units), decimals);
  const unit = units.weight === 'oz' ? t('ounces') : t('grams');
  if (!goal) return `${current} ${unit}`;
  return `${current} / ${formatNumber(displayWeight(goal, units), decimals)} ${unit}`;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: color.canvas, flex: 1 },
  screen: { flex: 1 },
  content: { paddingHorizontal: space.md, paddingTop: space.sm },
  rail: { backgroundColor: color.rail, borderRadius: radius.surface, paddingHorizontal: 6, paddingVertical: 4 },
  railHeader: { alignItems: 'center', flexDirection: 'row', height: 48 },
  dayBlock: { alignItems: 'center', bottom: 0, justifyContent: 'center', left: 0, position: 'absolute', right: 0, top: 0 },
  railActions: { flexDirection: 'row', marginLeft: 'auto' },
  headerButton: { alignItems: 'center', borderRadius: radius.round, height: 40, justifyContent: 'center', width: 40 },
  headerButtonDisabled: { opacity: 0.3 },
  headerButtonPressed: { backgroundColor: color.cameraChrome },
  day: { color: color.surface, fontFamily: type.ticketBold, fontSize: 24, lineHeight: 28, marginHorizontal: 2, textAlign: 'center' },
  summaryStrip: { backgroundColor: color.surface, borderColor: color.line, borderRadius: radius.surface, borderWidth: StyleSheet.hairlineWidth, marginTop: space.md, padding: 14 },
  totalRow: { alignItems: 'flex-end', flexDirection: 'row' },
  totalValue: { color: color.ink, fontFamily: type.ticketBold, fontSize: 34, letterSpacing: -0.6, lineHeight: 36 },
  totalCopy: { marginBottom: 4, marginLeft: space.sm },
  totalUnit: { color: color.ink, fontFamily: type.ticket, fontSize: 16 },
  totalGoal: { color: color.muted, fontSize: 11, marginTop: 1 },
  summaryMacros: { borderTopColor: color.line, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', marginTop: 12, paddingTop: 10 },
  macroMetric: { flex: 1, minWidth: 0 },
  macroLabel: { color: color.muted, fontSize: 11 },
  macroValue: { color: color.ink, fontFamily: type.ticketBold, fontSize: 14, marginTop: 2 },
  attentionSection: { marginTop: space.sm },
  processingSection: { marginTop: space.sm },
  loggedSection: { marginTop: space.sm },
  processingList: { backgroundColor: color.surface, borderColor: color.line, borderRadius: radius.surface, borderStyle: 'dashed', borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', paddingHorizontal: 10 },
  sectionHeading: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, marginTop: space.sm, paddingHorizontal: 2 },
  sectionTitle: { color: color.ink, fontFamily: type.ticketBold, fontSize: 18 },
  count: { color: color.muted, fontFamily: type.ticket, fontSize: 14 },
  ticketStack: { gap: space.md },
  compactMeal: { alignItems: 'center', borderBottomColor: color.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12, minHeight: 70, paddingHorizontal: 2, paddingVertical: 9 },
  processingMeal: { minHeight: 76 },
  compactPhoto: { borderRadius: radius.image, height: 52, width: 52 },
  compactCopy: { flex: 1, minWidth: 0 },
  compactTitle: { color: color.ink, fontFamily: type.ticketBold, fontSize: 19 },
  compactMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  compactMetaText: { color: color.muted, fontSize: 12 },
  compactStatus: { alignItems: 'center', flexDirection: 'row' },
  compactStatusText: { color: color.pending, fontFamily: type.ticketBold, fontSize: 12 },
  statusErrorText: { color: color.error },
  processingText: { color: color.pending, fontFamily: type.ticketBold, fontSize: 12 },
  ticket: { backgroundColor: color.surface, borderColor: color.line, borderRadius: radius.surface, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  ticketPressable: { padding: space.md },
  attentionMeal: { alignItems: 'center', flexDirection: 'row', gap: 11 },
  attentionPhoto: { borderRadius: radius.image, height: 46, width: 46 },
  ticketPressed: { backgroundColor: color.surfacePressed },
  ticketTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  orderNumber: { color: color.action, fontFamily: type.ticketBold, fontSize: 13, letterSpacing: 0.8 },
  ticketTime: { color: color.muted, fontFamily: type.ticket, fontSize: 14 },
  perforation: { borderBottomColor: color.line, borderBottomWidth: 1, borderStyle: 'dashed', marginVertical: 11 },
  ticketTitleRow: { alignItems: 'flex-start', flexDirection: 'row', gap: space.md },
  ticketTitleCopy: { flex: 1, minWidth: 0 },
  mealType: { color: color.muted, fontFamily: type.ticket, fontSize: 13 },
  mealTitle: { color: color.ink, fontFamily: type.ticketBold, fontSize: 24, lineHeight: 25, marginTop: 2 },
  energyBlock: { alignItems: 'flex-end' },
  energyValue: { color: color.ink, fontFamily: type.ticketBold, fontSize: 25, lineHeight: 26 },
  energyUnit: { color: color.muted, fontFamily: type.ticket, fontSize: 12 },
  mealItems: { color: color.muted, fontSize: 12, lineHeight: 18, marginTop: 11 },
  statusRow: { alignItems: 'center', flexDirection: 'row', marginTop: 13 },
  statusDot: { backgroundColor: color.pending, borderRadius: 3, height: 6, marginRight: 7, width: 6 },
  statusStamp: { borderColor: color.success, borderRadius: radius.sm, borderWidth: 1, color: color.success, fontFamily: type.ticketBold, fontSize: 12, letterSpacing: 0.7, paddingHorizontal: 7, paddingVertical: 3, transform: [{ rotate: '-1deg' }] },
  statusNeedsInput: { borderColor: color.pending, color: color.pending },
  statusError: { borderColor: color.error, color: color.error },
  ticketAction: { borderTopColor: color.line, borderTopWidth: StyleSheet.hairlineWidth, minHeight: 48, justifyContent: 'center', paddingHorizontal: space.md },
  ticketActionText: { color: color.error, fontFamily: type.ticketBold, fontSize: 16 },
  failedAction: { alignItems: 'center', borderTopColor: color.line, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 52, paddingHorizontal: space.md },
  failedCopy: { color: color.muted, fontSize: 13 },
  clarification: { borderTopColor: color.line, borderTopWidth: 1, borderStyle: 'dashed', padding: space.md },
  clarificationLabel: { color: color.pending, fontFamily: type.ticketBold, fontSize: 14, letterSpacing: 0.4 },
  question: { color: color.ink, fontSize: 16, fontWeight: '600', lineHeight: 22, marginTop: 6 },
  answerInChat: { alignItems: 'center', borderTopColor: color.line, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: space.sm, marginTop: space.md, minHeight: 42, paddingTop: space.sm },
  answerInChatText: { color: color.action, flex: 1, fontFamily: type.ticketBold, fontSize: 14 },
  answerRow: { alignItems: 'center', flexDirection: 'row', gap: space.sm, marginTop: space.md },
  answerInput: { backgroundColor: color.canvas, borderRadius: radius.control, color: color.ink, flex: 1, fontSize: 15, height: 50, paddingHorizontal: 14 },
  answerButton: { alignItems: 'center', backgroundColor: color.action, borderRadius: radius.control, height: 48, justifyContent: 'center', width: 48 },
  answerDisabled: { opacity: 0.42 },
  answerPressed: { backgroundColor: color.actionPressed },
  answerError: { color: color.error, fontSize: 12, marginTop: space.sm },
  emptyTicket: { borderColor: color.line, borderRadius: radius.surface, borderStyle: 'dashed', borderWidth: 1, padding: space.lg },
  emptyTitle: { color: color.ink, fontFamily: type.ticketBold, fontSize: 24 },
  emptyBody: { color: color.muted, fontSize: 14, lineHeight: 20, marginTop: space.xs },
  captureDock: { bottom: 0, left: 0, paddingHorizontal: space.md, position: 'absolute', right: 0 },
  blankTicket: { alignItems: 'center', backgroundColor: color.surface, borderColor: color.action, borderRadius: radius.surface, borderStyle: 'dashed', borderWidth: 1, flexDirection: 'row', minHeight: 76, padding: 11, shadowColor: color.ink, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 5, elevation: 4 },
  blankTicketPressed: { backgroundColor: color.surfacePressed, transform: [{ translateY: 1 }] },
  captureMark: { alignItems: 'center', backgroundColor: color.action, borderRadius: radius.control, height: 48, justifyContent: 'center', width: 48 },
  captureCopy: { flex: 1, marginLeft: 12 },
  captureTitle: { color: color.ink, fontFamily: type.ticketBold, fontSize: 21, lineHeight: 23 },
});
