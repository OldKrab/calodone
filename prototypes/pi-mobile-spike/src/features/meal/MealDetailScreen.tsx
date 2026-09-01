import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { IconButton, PrimaryButton } from '../../components/controls';
import { ScreenReveal } from '../../components/ScreenReveal';
import { color, radius, space } from '../../design/tokens';
import type { Meal, MealAnalysis, MealItem, MealType, NutritionTotals } from '../../domain/meal';
import { formatNumber, formatTime, t } from '../../i18n';

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const nutritionFields = ['calories', 'protein', 'carbs', 'fat'] as const;
type NutritionField = typeof nutritionFields[number];

export function MealDetailScreen(props: {
  meal: Meal;
  correcting: boolean;
  onBack: () => void;
  onCorrect: (correction: string) => Promise<void>;
  onDelete: () => void;
  onSave: (capturedAt: number, analysis: MealAnalysis) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [correction, setCorrection] = useState('');
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<MealAnalysis | undefined>(props.meal.analysis);
  const [time, setTime] = useState(editableTime(props.meal.capturedAt));

  useEffect(() => {
    if (editing) return;
    setDraft(props.meal.analysis ? JSON.parse(JSON.stringify(props.meal.analysis)) as MealAnalysis : undefined);
    setTime(editableTime(props.meal.capturedAt));
  }, [editing, props.meal.analysis, props.meal.capturedAt]);

  const submitCorrection = async () => {
    if (!correction.trim() || props.correcting) return;
    setError('');
    try {
      await props.onCorrect(correction.trim());
      setCorrection('');
    } catch {
      setError(t('correctionError'));
    }
  };

  const save = async () => {
    if (!draft) return;
    setError('');
    try {
      const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
      if (!match) throw new Error('Invalid time');
      const hours = Number(match[1]);
      const minutes = Number(match[2]);
      if (hours > 23 || minutes > 59 || draft.items.some((item) => !item.name.trim())) {
        throw new Error('Invalid meal values');
      }
      const capturedAt = new Date(props.meal.capturedAt);
      capturedAt.setHours(hours, minutes, 0, 0);
      const analysis = { ...draft, totals: sumItems(draft.items), clarification: undefined };
      await props.onSave(capturedAt.getTime(), analysis);
      setEditing(false);
    } catch {
      setError(t('saveChangesError'));
    }
  };

  const confirmDelete = () => Alert.alert(
    t('deleteConfirmTitle'),
    t('deleteConfirmBody'),
    [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: props.onDelete },
    ],
  );

  if (!draft) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title={t('mealDetails')} onBack={props.onBack} />
        <View style={styles.loading}>
          <ActivityIndicator color={color.action} />
          <Text style={styles.loadingText}>{t(props.meal.status === 'failed' ? 'failed' : 'analyzing')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenReveal>
        <Header
          action={editing ? undefined : { label: t('editManually'), onPress: () => setEditing(true) }}
          title={editing ? t('editMeal') : t('mealDetails')}
          onBack={editing ? () => { setEditing(false); setError(''); } : props.onBack}
        />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {editing ? (
          <MealEditor draft={draft} time={time} onChange={setDraft} onTimeChange={setTime} />
        ) : (
          <MealOverview meal={props.meal} analysis={draft} />
        )}

        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

        {editing ? (
          <View style={styles.editActions}>
            <PrimaryButton label={t('saveChanges')} onPress={save} />
            <Pressable accessibilityRole="button" onPress={confirmDelete} hitSlop={10}>
              <Text style={styles.delete}>{t('deleteMeal')}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.correction}>
            <View style={styles.correctionLabel}>
              <Ionicons name="sparkles" size={15} color={color.action} />
              <Text style={styles.correctionTitle}>{t('fixWithAI')}</Text>
            </View>
            <View style={styles.correctionRow}>
              <TextInput
                editable={!props.correcting}
                onChangeText={setCorrection}
                onSubmitEditing={submitCorrection}
                placeholder={t('fixPlaceholder')}
                placeholderTextColor={color.muted}
                returnKeyType="send"
                style={styles.correctionInput}
                value={correction}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('fixWithAI')}
                disabled={!correction.trim() || props.correcting}
                onPress={submitCorrection}
                style={({ pressed }) => [
                  styles.correctionSend,
                  (!correction.trim() || props.correcting) && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                {props.correcting
                  ? <ActivityIndicator color={color.surface} size="small" />
                  : <Ionicons name="arrow-up" color={color.surface} size={21} />}
              </Pressable>
            </View>
          </View>
        )}
        </ScrollView>
      </ScreenReveal>
    </SafeAreaView>
  );
}

function Header(props: {
  title: string;
  onBack: () => void;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.header}>
      <IconButton icon="arrow-back" label={t('back')} onPress={props.onBack} />
      <Text style={styles.headerTitle}>{props.title}</Text>
      {props.action ? (
        <Pressable accessibilityRole="button" onPress={props.action.onPress} hitSlop={10}>
          <Text style={styles.headerAction}>{props.action.label}</Text>
        </Pressable>
      ) : <View style={styles.headerSpacer} />}
    </View>
  );
}

function MealOverview(props: { meal: Meal; analysis: MealAnalysis }) {
  return (
    <>
      <Text style={styles.mealType}>{t(props.analysis.mealType)} · {formatTime(props.meal.capturedAt)}</Text>
      <Text style={styles.title}>{props.analysis.title}</Text>
      <View style={styles.totalRow}>
        <Text style={styles.totalCalories}>{formatNumber(props.analysis.totals.calories)} {t('kcal')}</Text>
        <Text style={styles.totalMacros}>
          {t('proteinShort')} {formatNumber(props.analysis.totals.protein)} · {t('carbsShort')} {formatNumber(props.analysis.totals.carbs)} · {t('fatShort')} {formatNumber(props.analysis.totals.fat)}
        </Text>
      </View>
      <View style={styles.items}>
        {props.analysis.items.map((item, index) => (
          <View key={`${item.name}-${index}`} style={[styles.itemRow, index > 0 && styles.divider]}>
            <View style={styles.itemCopy}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQuantity}>{item.quantity}</Text>
            </View>
            <View style={styles.itemNutrition}>
              <Text style={styles.itemCalories}>{formatNumber(item.calories)} {t('kcal')}</Text>
              <Text style={styles.itemMacros}>
                {t('proteinShort')} {formatNumber(item.protein)} · {t('carbsShort')} {formatNumber(item.carbs)} · {t('fatShort')} {formatNumber(item.fat)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

function MealEditor(props: {
  draft: MealAnalysis;
  time: string;
  onChange: (analysis: MealAnalysis) => void;
  onTimeChange: (time: string) => void;
}) {
  const updateItem = (index: number, field: keyof MealItem, value: string) => {
    const items = props.draft.items.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      if (nutritionFields.includes(field as NutritionField)) {
        return { ...item, [field]: Math.max(0, Number(value.replace(',', '.')) || 0) };
      }
      return { ...item, [field]: value };
    });
    props.onChange({ ...props.draft, items, totals: sumItems(items) });
  };

  const removeItem = (index: number) => {
    const items = props.draft.items.filter((_, itemIndex) => itemIndex !== index);
    props.onChange({ ...props.draft, items, totals: sumItems(items) });
  };

  const addItem = () => {
    const items = [...props.draft.items, { name: '', quantity: '', calories: 0, protein: 0, carbs: 0, fat: 0 }];
    props.onChange({ ...props.draft, items });
  };

  return (
    <>
      <Text style={styles.fieldLabel}>{t('mealType')}</Text>
      <View style={styles.chips}>
        {mealTypes.map((type) => (
          <Pressable
            key={type}
            accessibilityRole="button"
            accessibilityState={{ selected: props.draft.mealType === type }}
            onPress={() => props.onChange({ ...props.draft, mealType: type })}
            style={[styles.chip, props.draft.mealType === type && styles.chipSelected]}
          >
            <Text style={[styles.chipText, props.draft.mealType === type && styles.chipTextSelected]}>{t(type)}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.topFields}>
        <Field label={t('itemName')} value={props.draft.title} onChange={(title) => props.onChange({ ...props.draft, title })} />
        <Field keyboard="numbers-and-punctuation" label={t('time')} value={props.time} onChange={props.onTimeChange} compact />
      </View>

      <Text style={styles.itemsHeading}>{t('items')}</Text>
      {props.draft.items.map((item, index) => (
        <View key={index} style={styles.itemEditor}>
          <View style={styles.itemEditorHeader}>
            <Text style={styles.itemIndex}>{index + 1}</Text>
            {props.draft.items.length > 1 && (
              <Pressable accessibilityRole="button" accessibilityLabel={t('removePhoto')} hitSlop={10} onPress={() => removeItem(index)}>
                <Ionicons name="trash-outline" size={18} color={color.muted} />
              </Pressable>
            )}
          </View>
          <View style={styles.topFields}>
            <Field label={t('itemName')} value={item.name} onChange={(value) => updateItem(index, 'name', value)} />
            <Field label={t('quantity')} value={item.quantity} onChange={(value) => updateItem(index, 'quantity', value)} />
          </View>
          <View style={styles.nutritionFields}>
            {nutritionFields.map((field) => (
              <Field
                key={field}
                compact
                keyboard="decimal-pad"
                label={field === 'calories' ? t('caloriesField') : t(`${field}Short` as 'proteinShort')}
                value={String(item[field])}
                onChange={(value) => updateItem(index, field, value)}
              />
            ))}
          </View>
        </View>
      ))}
      <Pressable accessibilityRole="button" onPress={addItem} style={styles.addItem}>
        <Ionicons name="add" size={19} color={color.action} />
        <Text style={styles.addItemText}>{t('addItem')}</Text>
      </Pressable>
      <Text style={styles.editorTotal}>{t('total')}: {formatNumber(sumItems(props.draft.items).calories)} {t('kcal')}</Text>
    </>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
  keyboard?: 'default' | 'decimal-pad' | 'numbers-and-punctuation';
}) {
  return (
    <View style={[styles.field, props.compact && styles.fieldCompact]}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput
        keyboardType={props.keyboard ?? 'default'}
        onChangeText={props.onChange}
        placeholderTextColor={color.muted}
        style={styles.fieldInput}
        value={props.value}
      />
    </View>
  );
}

function sumItems(items: MealItem[]): NutritionTotals {
  return items.reduce((total, item) => ({
    calories: total.calories + item.calories,
    protein: total.protein + item.protein,
    carbs: total.carbs + item.carbs,
    fat: total.fat + item.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

function editableTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: color.canvas, flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.md, paddingTop: space.sm },
  headerTitle: { color: color.ink, fontSize: 17, fontWeight: '700' },
  headerAction: { color: color.action, fontSize: 13, fontWeight: '700', maxWidth: 110, textAlign: 'right' },
  headerSpacer: { width: 48 },
  content: { paddingBottom: 48, paddingHorizontal: space.lg, paddingTop: space.xl },
  loading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  loadingText: { color: color.muted, fontSize: 14, marginTop: space.sm },
  mealType: { color: color.action, fontSize: 13, fontWeight: '700' },
  title: { color: color.ink, fontSize: 28, fontWeight: '700', letterSpacing: -0.6, marginTop: 5 },
  totalRow: { marginTop: space.lg },
  totalCalories: { color: color.ink, fontSize: 19, fontWeight: '700' },
  totalMacros: { color: color.muted, fontSize: 13, marginTop: 4 },
  items: { marginTop: space.xl },
  itemRow: { alignItems: 'flex-start', flexDirection: 'row', gap: space.md, paddingVertical: space.md },
  divider: { borderTopColor: color.line, borderTopWidth: StyleSheet.hairlineWidth },
  itemCopy: { flex: 1 },
  itemName: { color: color.ink, fontSize: 16, fontWeight: '600' },
  itemQuantity: { color: color.muted, fontSize: 13, marginTop: 3 },
  itemNutrition: { alignItems: 'flex-end' },
  itemCalories: { color: color.ink, fontSize: 14, fontWeight: '600' },
  itemMacros: { color: color.muted, fontSize: 11, marginTop: 4 },
  correction: { backgroundColor: color.surface, borderRadius: radius.surface, marginTop: space.xl, padding: 18 },
  correctionLabel: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  correctionTitle: { color: color.ink, fontSize: 14, fontWeight: '700' },
  correctionRow: { alignItems: 'center', flexDirection: 'row', gap: space.sm, marginTop: space.md },
  correctionInput: { backgroundColor: color.canvas, borderRadius: radius.control, color: color.ink, flex: 1, fontSize: 15, height: 50, paddingHorizontal: 14 },
  correctionSend: { alignItems: 'center', backgroundColor: color.action, borderRadius: radius.round, height: 46, justifyContent: 'center', width: 46 },
  disabled: { opacity: 0.38 },
  pressed: { backgroundColor: color.actionPressed, transform: [{ scale: 0.95 }] },
  error: { color: color.error, fontSize: 13, marginTop: space.md },
  fieldLabel: { color: color.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg },
  chip: { backgroundColor: color.surface, borderRadius: radius.round, justifyContent: 'center', minHeight: 48, paddingHorizontal: 14 },
  chipSelected: { backgroundColor: color.ink },
  chipText: { color: color.ink, fontSize: 13, fontWeight: '600' },
  chipTextSelected: { color: color.surface },
  topFields: { flexDirection: 'row', gap: space.sm },
  field: { flex: 1 },
  fieldCompact: { minWidth: 68 },
  fieldInput: { backgroundColor: color.surface, borderRadius: radius.control, color: color.ink, fontSize: 14, height: 48, paddingHorizontal: 13 },
  itemsHeading: { color: color.ink, fontSize: 18, fontWeight: '700', marginBottom: space.md, marginTop: space.xl },
  itemEditor: { backgroundColor: color.surface, borderRadius: radius.surface, marginBottom: space.md, padding: space.md },
  itemEditorHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.sm },
  itemIndex: { color: color.muted, fontSize: 12, fontWeight: '700' },
  nutritionFields: { flexDirection: 'row', gap: 6, marginTop: space.sm },
  addItem: { alignItems: 'center', flexDirection: 'row', gap: 7, minHeight: 48 },
  addItemText: { color: color.action, fontSize: 14, fontWeight: '700' },
  editorTotal: { color: color.ink, fontSize: 15, fontWeight: '700', marginTop: space.lg },
  editActions: { gap: space.lg, marginTop: space.xl },
  delete: { color: color.error, fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
