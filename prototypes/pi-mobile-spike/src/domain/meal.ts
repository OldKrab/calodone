export type MealStatus = 'queued' | 'analyzing' | 'needs_input' | 'complete' | 'estimated' | 'failed';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type NutritionTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type MealItem = NutritionTotals & { name: string; quantity: string };

export type MealAnalysis = {
  title: string;
  mealType: MealType;
  items: MealItem[];
  totals: NutritionTotals;
  clarification?: { question: string; impactCalories: number };
};

export type MealPhoto = { uri: string; mimeType: string };

export type Meal = {
  id: string;
  capturedAt: number;
  status: MealStatus;
  note: string;
  photos: MealPhoto[];
  analysis?: MealAnalysis;
  error?: string;
};

export function emptyTotals(): NutritionTotals {
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

export function totalsFor(meals: Meal[]): NutritionTotals {
  return meals.reduce((total, meal) => {
    const next = meal.analysis?.totals;
    if (!next) return total;
    return {
      calories: total.calories + next.calories,
      protein: total.protein + next.protein,
      carbs: total.carbs + next.carbs,
      fat: total.fat + next.fat,
    };
  }, emptyTotals());
}

export function parseMealAnalysis(text: string): MealAnalysis {
  const normalized = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const value = JSON.parse(normalized) as Partial<MealAnalysis>;
  if (
    typeof value.title !== 'string' ||
    !['breakfast', 'lunch', 'dinner', 'snack'].includes(value.mealType ?? '') ||
    !Array.isArray(value.items) ||
    !value.totals ||
    typeof value.totals.calories !== 'number'
  ) {
    throw new Error('The model returned an invalid meal result');
  }
  return value as MealAnalysis;
}
