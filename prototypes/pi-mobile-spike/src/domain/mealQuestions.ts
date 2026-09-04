export type MealClarification = {
  questions: string[];
  impactCalories: number;
};

export type LegacyMealClarification = {
  question: string;
  impactCalories: number;
};

export function mealQuestions(clarification?: MealClarification | LegacyMealClarification): string[] {
  if (!clarification) return [];
  const questions = 'questions' in clarification ? clarification.questions : [clarification.question];
  return questions.map((question) => question.trim()).filter(Boolean);
}

export function normalizeClarification(value: unknown): MealClarification | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const source = value as { questions?: unknown; question?: unknown; impactCalories?: unknown };
  const rawQuestions = Array.isArray(source.questions)
    ? source.questions
    : typeof source.question === 'string' ? [source.question] : [];
  const questions = rawQuestions
    .filter((question): question is string => typeof question === 'string')
    .map((question) => question.trim())
    .filter(Boolean)
    .slice(0, 3);
  if (questions.length === 0 || typeof source.impactCalories !== 'number' || !Number.isFinite(source.impactCalories) || source.impactCalories < 0) {
    return undefined;
  }
  return { questions, impactCalories: source.impactCalories };
}
