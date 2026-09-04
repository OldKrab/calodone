export type MealActivityStage = 'reading_photos' | 'reviewing_meal' | 'thinking' | 'web_search' | 'writing_result' | 'saving_result';

type Listener = (activities: ReadonlyMap<string, MealActivityStage>) => void;

const activities = new Map<string, MealActivityStage>();
const listeners = new Set<Listener>();

/** Ephemeral progress only: meal status in the repository remains authoritative. */
export function setMealActivity(mealId: string, stage?: MealActivityStage): void {
  if (stage) activities.set(mealId, stage);
  else activities.delete(mealId);
  const snapshot = new Map(activities);
  listeners.forEach((listener) => listener(snapshot));
}

export function subscribeMealActivity(listener: Listener): () => void {
  listener(new Map(activities));
  listeners.add(listener);
  return () => listeners.delete(listener);
}
