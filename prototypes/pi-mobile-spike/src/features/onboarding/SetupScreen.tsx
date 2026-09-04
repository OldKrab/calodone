import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { shouldStackFormFields } from '../../components/adaptiveScreen';
import { PrimaryButton } from '../../components/controls';
import { KeyboardSafeArea } from '../../components/KeyboardSafeArea';
import { ScreenReveal } from '../../components/ScreenReveal';
import { color, radius, space, type } from '../../design/tokens';
import { estimateDailyGoals, type GoalProfile } from '../../domain/goalEstimator';
import type { DailyGoals } from '../../domain/meal';
import { t } from '../../i18n';
import { ProviderSetupScreen } from '../provider/ProviderSetupScreen';

type FormValues = { age: string; heightCm: string; weightKg: string; sex: GoalProfile['sex']; activity: GoalProfile['activity']; objective: GoalProfile['objective'] };
type TargetValues = Record<keyof Required<DailyGoals>, string>;

const initialValues: FormValues = { age: '30', heightCm: '170', weightKg: '70', sex: 'female', activity: 'moderate', objective: 'maintain' };

export function SetupScreen(props: {
  saving: boolean;
  recalculating?: boolean;
  initialProfile?: GoalProfile;
  onCancel?: () => void;
  onComplete: (goals: DailyGoals, profile: GoalProfile) => Promise<void>;
}) {
  const { fontScale, width } = useWindowDimensions();
  const compact = shouldStackFormFields(width, fontScale);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<FormValues>(() => props.initialProfile ? profileToForm(props.initialProfile) : initialValues);
  const [targets, setTargets] = useState<TargetValues>({ calories: '', protein: '', carbs: '', fat: '' });
  const [error, setError] = useState('');
  const totalSteps = props.recalculating ? 4 : 5;

  const estimate = useMemo(() => {
    try {
      return estimateDailyGoals(formToProfile(values));
    } catch { return undefined; }
  }, [values]);

  const goals = useMemo<DailyGoals>(() => Object.fromEntries(Object.entries(targets).flatMap(([key, raw]) => {
    const value = Number(raw.replace(',', '.'));
    return value > 0 ? [[key, value]] : [];
  })), [targets]);

  const next = () => {
    if (step === 1 && !estimate) { setError(t('checkProfileValues')); return; }
    setError('');
    if (step === 2 && estimate) setTargets({ calories: String(estimate.calories), protein: String(estimate.protein), carbs: String(estimate.carbs), fat: String(estimate.fat) });
    if (step === 3 && props.recalculating) {
      void props.onComplete(goals, formToProfile(values)).catch(() => setError(t('goalsError')));
      return;
    }
    setStep((current) => current + 1);
  };

  const goBack = () => {
    if (step > 0) setStep((current) => current - 1);
    else props.onCancel?.();
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 0 && !props.onCancel) return false;
      goBack();
      return true;
    });
    return () => subscription.remove();
  }, [step, props.onCancel]);

  if (step === 4) {
    return <ProviderSetupScreen completionLabel={t('finishSetup')} onboarding onBack={() => setStep(3)} onComplete={() => props.onComplete(goals, formToProfile(values))} />;
  }

  const titles = [t('setupGoalTitle'), t('setupBasicsTitle'), t('setupActivityTitle'), t('setupTargetsTitle')];
  const bodies = [t('setupGoalBody'), t('setupBasicsBody'), t('setupDirectionBody'), t('setupTargetsBody')];

  return (
    <KeyboardSafeArea>
      <View style={styles.progress}>{Array.from({ length: totalSteps }, (_, index) => <View key={index} style={[styles.progressBar, index <= step && styles.progressBarActive]} />)}</View>
      <ScreenReveal key={step}>
        <View style={styles.stepScreen}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
          >
            <View style={styles.topline}>
              {step > 0 || props.onCancel ? <Pressable accessibilityRole="button" hitSlop={10} onPress={goBack}><Ionicons name="arrow-back" size={21} color={color.action} /></Pressable> : <View style={styles.backSpacer} />}
              <Text style={styles.stepLabel}>{t('setupStep', { current: step + 1, total: totalSteps })}</Text><View style={styles.backSpacer} />
            </View>
            <Text style={[styles.title, compact && styles.titleCompact]}>{titles[step]}</Text><Text style={styles.body}>{bodies[step]}</Text>

            {step === 0 && <ChoiceStack options={(['lose', 'maintain', 'gain'] as const).map((value) => [value, t(value)])} selected={values.objective} onSelect={(objective) => setValues((current) => ({ ...current, objective: objective as GoalProfile['objective'] }))} />}

            {step === 1 && <><View style={[styles.segment, compact && styles.segmentCompact]}>{(['female', 'male'] as const).map((sex) => <Choice key={sex} label={t(sex === 'female' ? 'femaleEquation' : 'maleEquation')} selected={values.sex === sex} stacked={compact} onPress={() => setValues((current) => ({ ...current, sex }))} />)}</View><View style={styles.fields}><NumberField label={t('age')} suffix={t('years')} value={values.age} onChange={(age) => setValues((current) => ({ ...current, age }))} /><NumberField label={t('height')} suffix={t('centimeters')} value={values.heightCm} onChange={(heightCm) => setValues((current) => ({ ...current, heightCm }))} /><NumberField label={t('weight')} suffix={t('kilograms')} value={values.weightKg} onChange={(weightKg) => setValues((current) => ({ ...current, weightKg }))} /></View><Text style={styles.scopeNote}>{t('adultEstimateNote')}</Text></>}

            {step === 2 && <ChoiceStack options={(['sedentary', 'light', 'moderate', 'very_active'] as const).map((value) => [value, t(value === 'very_active' ? 'veryActive' : value)])} selected={values.activity} onSelect={(activity) => setValues((current) => ({ ...current, activity: activity as GoalProfile['activity'] }))} />}

            {step === 3 && <View style={styles.fields}>{([['calories', t('kcal')], ['protein', t('grams')], ['carbs', t('grams')], ['fat', t('grams')]] as const).map(([field, unit]) => <NumberField key={field} label={t(field)} suffix={unit} value={targets[field]} onChange={(value) => setTargets((current) => ({ ...current, [field]: value }))} />)}</View>}
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          </ScrollView>
          <View style={styles.action}><PrimaryButton busy={props.saving} label={props.recalculating && step === 3 ? t('saveGoals') : t('continue')} onPress={next} /></View>
        </View>
      </ScreenReveal>
    </KeyboardSafeArea>
  );
}

function formToProfile(values: FormValues): GoalProfile {
  return {
    age: Number(values.age),
    heightCm: Number(values.heightCm.replace(',', '.')),
    weightKg: Number(values.weightKg.replace(',', '.')),
    sex: values.sex,
    activity: values.activity,
    objective: values.objective,
  };
}

function profileToForm(profile: GoalProfile): FormValues {
  return {
    age: String(profile.age),
    heightCm: String(profile.heightCm),
    weightKg: String(profile.weightKg),
    sex: profile.sex,
    activity: profile.activity,
    objective: profile.objective,
  };
}

function NumberField(props: { label: string; suffix: string; value: string; onChange: (value: string) => void }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{props.label}</Text><View style={styles.inputRow}><TextInput accessibilityLabel={props.label} keyboardType="decimal-pad" onChangeText={props.onChange} selectTextOnFocus style={styles.input} value={props.value} /><Text style={styles.suffix}>{props.suffix}</Text></View></View>;
}

function ChoiceStack(props: { options: ReadonlyArray<readonly [string, string]>; selected: string; onSelect: (value: string) => void }) {
  return <View style={styles.choiceStack}>{props.options.map(([value, label]) => <Choice key={value} label={label} selected={props.selected === value} onPress={() => props.onSelect(value)} />)}</View>;
}

function Choice(props: { label: string; selected: boolean; stacked?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: props.selected }} onPress={props.onPress} style={[styles.choice, props.stacked && styles.choiceStacked, props.selected && styles.choiceSelected]}><View style={[styles.radio, props.selected && styles.radioSelected]}>{props.selected && <Ionicons name="checkmark" size={15} color={color.surface} />}</View><Text style={styles.choiceText}>{props.label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  progress: { flexDirection: 'row', gap: 6, paddingHorizontal: space.lg, paddingTop: space.md }, progressBar: { backgroundColor: color.line, borderRadius: 2, flex: 1, height: 3 }, progressBarActive: { backgroundColor: color.action },
  stepScreen: { flex: 1 }, scroll: { flex: 1 }, content: { padding: space.lg, paddingBottom: space.lg }, topline: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, backSpacer: { width: 22 }, stepLabel: { color: color.muted, fontFamily: type.ticketBold, fontSize: 13, letterSpacing: 0.7, textTransform: 'uppercase' },
  title: { color: color.ink, fontFamily: type.ticketBold, fontSize: 36, lineHeight: 39, marginTop: space.xl }, titleCompact: { fontSize: 31, lineHeight: 34 }, body: { color: color.muted, fontSize: 15, lineHeight: 22, marginTop: space.sm, maxWidth: 350 }, segment: { flexDirection: 'row', gap: space.sm, marginTop: space.xl }, segmentCompact: { flexDirection: 'column' }, choiceStack: { gap: space.sm, marginTop: space.xl },
  choice: { alignItems: 'center', backgroundColor: color.surface, borderColor: color.line, borderRadius: radius.control, borderWidth: StyleSheet.hairlineWidth, flex: 1, flexDirection: 'row', gap: 12, minHeight: 56, paddingHorizontal: 14 }, choiceStacked: { flex: 0 }, choiceSelected: { borderColor: color.action }, radio: { alignItems: 'center', borderColor: color.line, borderRadius: radius.round, borderWidth: 1, height: 24, justifyContent: 'center', width: 24 }, radioSelected: { backgroundColor: color.action, borderColor: color.action }, choiceText: { color: color.ink, flex: 1, fontFamily: type.ticketBold, fontSize: 17 },
  fields: { backgroundColor: color.surface, borderColor: color.line, borderRadius: radius.surface, borderWidth: StyleSheet.hairlineWidth, marginTop: space.xl, paddingHorizontal: space.md }, field: { alignItems: 'center', borderBottomColor: color.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 65 }, fieldLabel: { color: color.ink, flexShrink: 1, fontFamily: type.ticketBold, fontSize: 16, marginRight: space.sm }, inputRow: { alignItems: 'center', backgroundColor: color.canvas, borderRadius: radius.control, flexDirection: 'row', height: 46, justifyContent: 'flex-end', minWidth: 112, paddingHorizontal: 11 }, input: { color: color.ink, fontFamily: type.ticketBold, fontSize: 17, minWidth: 54, padding: 0, textAlign: 'right' }, suffix: { color: color.muted, fontSize: 12, marginLeft: 7 }, scopeNote: { color: color.muted, fontSize: 12, lineHeight: 18, marginTop: space.md }, error: { color: color.error, fontSize: 13, marginTop: space.md }, action: { backgroundColor: color.canvas, paddingBottom: space.sm, paddingHorizontal: space.lg, paddingTop: space.sm },
});
