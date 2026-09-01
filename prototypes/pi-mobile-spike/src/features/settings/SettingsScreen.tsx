import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
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
import type { DailyGoals } from '../../domain/meal';
import { t } from '../../i18n';

type GoalField = keyof DailyGoals;
const fields: Array<{ key: GoalField; label: ReturnType<typeof t>; unit: string }> = [
  { key: 'calories', label: t('calories'), unit: t('kcal') },
  { key: 'protein', label: t('protein'), unit: t('grams') },
  { key: 'carbs', label: t('carbs'), unit: t('grams') },
  { key: 'fat', label: t('fat'), unit: t('grams') },
];

export function SettingsScreen(props: {
  goals: DailyGoals;
  saving: boolean;
  onBack: () => void;
  onSaveGoals: (goals: DailyGoals) => Promise<void>;
  onSignOut: () => void;
}) {
  const [values, setValues] = useState<Record<GoalField, string>>({
    calories: '', protein: '', carbs: '', fat: '',
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setValues({
      calories: props.goals.calories ? String(props.goals.calories) : '',
      protein: props.goals.protein ? String(props.goals.protein) : '',
      carbs: props.goals.carbs ? String(props.goals.carbs) : '',
      fat: props.goals.fat ? String(props.goals.fat) : '',
    });
  }, [props.goals]);

  const save = async () => {
    const goals = Object.fromEntries(
      fields.flatMap(({ key }) => {
        const value = Number(values[key].replace(',', '.'));
        return value > 0 ? [[key, value]] : [];
      }),
    ) as DailyGoals;
    setError(false);
    try {
      await props.onSaveGoals(goals);
      setSaved(true);
    } catch {
      setError(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenReveal>
        <View style={styles.header}>
          <IconButton icon="arrow-back" label={t('back')} onPress={props.onBack} />
          <Text style={styles.headerTitle}>{t('settings')}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.connectionRow}>
          <View style={styles.connectionIcon}>
            <Ionicons name="checkmark" size={18} color={color.success} />
          </View>
          <Text style={styles.connectionText}>{t('signedInAs')}</Text>
        </View>
        <Text style={styles.privacy}>{t('settingsBody')}</Text>

        <View style={styles.goalsHeader}>
          <Text style={styles.sectionTitle}>{t('dailyGoals')}</Text>
          <Text style={styles.sectionBody}>{t('goalsBody')}</Text>
        </View>
        <View style={styles.goalFields}>
          {fields.map((field) => (
            <View key={field.key} style={styles.goalField}>
              <Text style={styles.goalLabel}>{field.label}</Text>
              <View style={styles.goalInputRow}>
                <TextInput
                  accessibilityLabel={field.label}
                  keyboardType="decimal-pad"
                  onChangeText={(value) => {
                    setSaved(false);
                    setValues((current) => ({ ...current, [field.key]: value }));
                  }}
                  placeholder={t('optional')}
                  placeholderTextColor={color.muted}
                  style={styles.goalInput}
                  value={values[field.key]}
                />
                <Text style={styles.goalUnit}>{field.unit}</Text>
              </View>
            </View>
          ))}
        </View>
        {error && <Text accessibilityRole="alert" style={styles.error}>{t('goalsError')}</Text>}
        <View style={styles.saveArea}>
          <PrimaryButton busy={props.saving} label={saved ? t('goalsSaved') : t('saveGoals')} onPress={save} />
        </View>

        <Pressable accessibilityRole="button" onPress={props.onSignOut} hitSlop={10}>
          <Text style={styles.signOut}>{t('signOut')}</Text>
        </Pressable>
        </ScrollView>
      </ScreenReveal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: color.canvas, flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.md, paddingTop: space.sm },
  headerTitle: { color: color.ink, fontSize: 17, fontWeight: '700' },
  headerSpacer: { width: 48 },
  content: { paddingBottom: 48, paddingHorizontal: space.lg, paddingTop: space.xl },
  connectionRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  connectionIcon: { alignItems: 'center', backgroundColor: color.surface, borderRadius: radius.round, height: 38, justifyContent: 'center', width: 38 },
  connectionText: { color: color.ink, fontSize: 16, fontWeight: '600' },
  privacy: { color: color.muted, fontSize: 14, lineHeight: 21, marginTop: space.lg, maxWidth: 330 },
  goalsHeader: { marginTop: space.xxl },
  sectionTitle: { color: color.ink, fontSize: 20, fontWeight: '700' },
  sectionBody: { color: color.muted, fontSize: 14, marginTop: 5 },
  goalFields: { marginTop: space.lg },
  goalField: { borderBottomColor: color.line, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 13 },
  goalLabel: { color: color.ink, fontSize: 14, fontWeight: '600' },
  goalInputRow: { alignItems: 'center', flexDirection: 'row', marginTop: space.sm },
  goalInput: { backgroundColor: color.surface, borderRadius: radius.control, color: color.ink, flex: 1, fontSize: 16, height: 48, paddingHorizontal: 14 },
  goalUnit: { color: color.muted, fontSize: 13, marginLeft: space.sm, width: 34 },
  saveArea: { marginTop: space.lg },
  error: { color: color.error, fontSize: 13, marginTop: space.md },
  signOut: { color: color.error, fontSize: 15, fontWeight: '600', marginTop: space.xxl, textAlign: 'center' },
});
