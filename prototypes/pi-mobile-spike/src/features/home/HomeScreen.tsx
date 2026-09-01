import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { IconButton, PrimaryButton } from '../../components/controls';
import { color, radius, space } from '../../design/tokens';
import type { Meal, MealType } from '../../domain/meal';
import { totalsFor } from '../../domain/meal';
import { formatNumber, formatTime, t, type CopyKey } from '../../i18n';

const typeIcon: Record<MealType, keyof typeof Ionicons.glyphMap> = {
  breakfast: 'sunny-outline',
  lunch: 'restaurant-outline',
  dinner: 'moon-outline',
  snack: 'cafe-outline',
};

export function HomeScreen(props: {
  meals: Meal[];
  onCapture: () => void;
  onRetry: (meal: Meal) => void;
  onAnswer: (meal: Meal, answer: string) => void;
  onSettings: () => void;
}) {
  const totals = totalsFor(props.meals);
  const clarification = props.meals.find((meal) => meal.status === 'needs_input');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>{t('appName')}</Text>
              <Text style={styles.heading}>{t('today')}</Text>
            </View>
            <IconButton icon="settings-outline" label={t('settings')} onPress={props.onSettings} />
          </View>

          <View style={styles.summary} accessibilityLabel={t('calories')}>
            <Text style={styles.calorieLine}>
              {formatNumber(totals.calories)} <Text style={styles.unit}>{t('kcal')}</Text>
            </Text>
            <View style={styles.macros}>
              <Macro name={t('protein')} value={totals.protein} />
              <Macro name={t('carbs')} value={totals.carbs} />
              <Macro name={t('fat')} value={totals.fat} />
            </View>
          </View>

          {clarification?.analysis?.clarification && (
            <Clarification
              meal={clarification}
              onAnswer={(answer) => props.onAnswer(clarification, answer)}
            />
          )}

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>{t('meals')}</Text>
            {props.meals.length > 0 && <Text style={styles.count}>{props.meals.length}</Text>}
          </View>

          {props.meals.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="restaurant-outline" size={28} color={color.muted} />
              </View>
              <Text style={styles.emptyTitle}>{t('emptyTitle')}</Text>
              <Text style={styles.emptyBody}>{t('emptyBody')}</Text>
            </View>
          ) : (
            <View>
              {props.meals.map((meal, index) => (
                <MealRow
                  key={meal.id}
                  meal={meal}
                  last={index === props.meals.length - 1}
                  onRetry={() => props.onRetry(meal)}
                />
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.captureDock} pointerEvents="box-none">
          <PrimaryButton label={t('addMeal')} icon="camera" onPress={props.onCapture} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function Macro(props: { name: string; value: number }) {
  return (
    <View style={styles.macro}>
      <Text style={styles.macroValue}>{formatNumber(props.value)} g</Text>
      <Text style={styles.macroName}>{props.name}</Text>
    </View>
  );
}

function Clarification(props: { meal: Meal; onAnswer: (answer: string) => void }) {
  const [answer, setAnswer] = useState('');
  return (
    <View style={styles.clarification}>
      <View style={styles.clarificationLabel}>
        <Ionicons name="sparkles" size={14} color={color.pending} />
        <Text style={styles.clarificationLabelText}>{t('clarificationTitle')}</Text>
      </View>
      <Text style={styles.question}>{props.meal.analysis?.clarification?.question}</Text>
      <View style={styles.answerRow}>
        <TextInput
          accessibilityLabel={t('answerPlaceholder')}
          onChangeText={setAnswer}
          placeholder={t('answerPlaceholder')}
          placeholderTextColor={color.muted}
          returnKeyType="send"
          style={styles.answerInput}
          value={answer}
          onSubmitEditing={() => answer.trim() && props.onAnswer(answer.trim())}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('answer')}
          disabled={!answer.trim()}
          onPress={() => props.onAnswer(answer.trim())}
          style={({ pressed }) => [
            styles.answerButton,
            !answer.trim() && styles.answerDisabled,
            pressed && styles.answerPressed,
          ]}
        >
          <Ionicons name="arrow-up" size={21} color={color.surface} />
        </Pressable>
      </View>
    </View>
  );
}

function MealRow(props: { meal: Meal; last: boolean; onRetry: () => void }) {
  const pulse = useRef(new Animated.Value(0.35)).current;
  const isWorking = props.meal.status === 'queued' || props.meal.status === 'analyzing';

  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!isWorking || reduced) return;
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0.35, duration: 900, useNativeDriver: true }),
        ]),
      );
      animation.start();
    });
    return () => animation?.stop();
  }, [isWorking, pulse]);

  const type = props.meal.analysis?.mealType;
  const title = props.meal.analysis?.title ?? (type ? t(type) : t('meal'));
  const statusKey: CopyKey | undefined =
    props.meal.status === 'needs_input' ? 'needsInput'
      : props.meal.status === 'estimated' ? 'estimated'
        : props.meal.status === 'failed' ? 'failed'
          : props.meal.status === 'queued' ? 'queued'
            : props.meal.status === 'analyzing' ? 'analyzing'
              : undefined;

  return (
    <View style={[styles.mealRow, !props.last && styles.mealDivider]}>
      <View style={styles.mealIcon}>
        <Ionicons name={type ? typeIcon[type] : 'restaurant-outline'} size={22} color={color.ink} />
      </View>
      <View style={styles.mealBody}>
        <View style={styles.mealTitleRow}>
          <Text numberOfLines={1} style={styles.mealTitle}>{title}</Text>
          {props.meal.analysis && (
            <Text style={styles.mealCalories}>
              {formatNumber(props.meal.analysis.totals.calories)} {t('kcal')}
            </Text>
          )}
        </View>
        <View style={styles.mealMeta}>
          <Text style={styles.mealTime}>{formatTime(props.meal.capturedAt)}</Text>
          {statusKey && (
            <View style={styles.status}>
              {isWorking && <Animated.View style={[styles.statusDot, { opacity: pulse }]} />}
              <Text style={[
                styles.statusText,
                props.meal.status === 'failed' && styles.failedText,
                props.meal.status === 'needs_input' && styles.pendingText,
              ]}>{t(statusKey)}</Text>
            </View>
          )}
        </View>
        {props.meal.analysis && (
          <Text numberOfLines={1} style={styles.mealItems}>
            {props.meal.analysis.items.map((item) => item.name).join(', ')}
          </Text>
        )}
        {props.meal.status === 'failed' && (
          <Pressable accessibilityRole="button" onPress={props.onRetry} hitSlop={8}>
            <Text style={styles.retry}>{t('retry')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: color.canvas, flex: 1 },
  screen: { flex: 1 },
  content: { paddingBottom: 124, paddingHorizontal: space.lg, paddingTop: space.md },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  eyebrow: { color: color.action, fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  heading: { color: color.ink, fontSize: 29, fontWeight: '700', letterSpacing: -0.7, marginTop: 2 },
  summary: { marginTop: space.xl },
  calorieLine: { color: color.ink, fontSize: 23, fontWeight: '700', letterSpacing: -0.4 },
  unit: { color: color.muted, fontSize: 15, fontWeight: '600' },
  macros: { flexDirection: 'row', gap: space.xl, marginTop: space.md },
  macro: { gap: 2 },
  macroValue: { color: color.ink, fontSize: 14, fontWeight: '600' },
  macroName: { color: color.muted, fontSize: 12 },
  clarification: {
    backgroundColor: color.surface,
    borderRadius: radius.surface,
    marginTop: space.xl,
    padding: 18,
  },
  clarificationLabel: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  clarificationLabelText: { color: color.pending, fontSize: 12, fontWeight: '700' },
  question: { color: color.ink, fontSize: 17, fontWeight: '600', lineHeight: 23, marginTop: 10 },
  answerRow: { alignItems: 'center', flexDirection: 'row', gap: space.sm, marginTop: space.md },
  answerInput: {
    backgroundColor: color.canvas,
    borderRadius: radius.control,
    color: color.ink,
    flex: 1,
    fontSize: 15,
    height: 48,
    paddingHorizontal: 14,
  },
  answerButton: {
    alignItems: 'center', backgroundColor: color.action, borderRadius: radius.round,
    height: 44, justifyContent: 'center', width: 44,
  },
  answerDisabled: { opacity: 0.35 },
  answerPressed: { backgroundColor: color.actionPressed, transform: [{ scale: 0.95 }] },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: space.xl },
  sectionTitle: { color: color.ink, fontSize: 18, fontWeight: '700' },
  count: { color: color.muted, fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', paddingBottom: space.xl, paddingTop: space.xxl },
  emptyIcon: {
    alignItems: 'center', backgroundColor: color.surface, borderRadius: radius.round,
    height: 64, justifyContent: 'center', width: 64,
  },
  emptyTitle: { color: color.ink, fontSize: 18, fontWeight: '700', marginTop: space.md },
  emptyBody: { color: color.muted, fontSize: 15, marginTop: 5, textAlign: 'center' },
  mealRow: { flexDirection: 'row', gap: 14, paddingVertical: 18 },
  mealDivider: { borderBottomColor: color.line, borderBottomWidth: StyleSheet.hairlineWidth },
  mealIcon: {
    alignItems: 'center', backgroundColor: color.surface, borderRadius: radius.round,
    height: 44, justifyContent: 'center', width: 44,
  },
  mealBody: { flex: 1, minWidth: 0 },
  mealTitleRow: { alignItems: 'baseline', flexDirection: 'row', gap: space.sm },
  mealTitle: { color: color.ink, flex: 1, fontSize: 16, fontWeight: '700' },
  mealCalories: { color: color.ink, fontSize: 14, fontWeight: '600' },
  mealMeta: { alignItems: 'center', flexDirection: 'row', gap: space.sm, marginTop: 4 },
  mealTime: { color: color.muted, fontSize: 12 },
  status: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  statusDot: { backgroundColor: color.action, borderRadius: 3, height: 6, width: 6 },
  statusText: { color: color.action, fontSize: 12, fontWeight: '600' },
  failedText: { color: color.error },
  pendingText: { color: color.pending },
  mealItems: { color: color.muted, fontSize: 13, marginTop: 7 },
  retry: { color: color.action, fontSize: 13, fontWeight: '700', marginTop: 8 },
  captureDock: { bottom: 20, left: space.lg, position: 'absolute', right: space.lg },
});
