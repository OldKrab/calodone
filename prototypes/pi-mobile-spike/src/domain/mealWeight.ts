/** Legacy quantities are prose, not structured mass. Only sum unambiguous
 * mass-only quantities; volumes, portion counts and ranges cannot be inferred. */
export function mealWeightGrams(quantities: readonly string[]): number | null {
  if (!quantities.length) return null;
  let total = 0;
  for (const quantity of quantities) {
    const match = quantity.trim().toLowerCase().match(/^(?:(?:примерно|около|about|approximately)\s+|[~≈]\s*)?(\d+(?:[.,]\d+)?)\s*(г|гр\.?|грамм(?:а|ов)?|g|grams?|кг|kg|килограмм(?:а|ов)?|oz)$/u);
    if (!match) return null;
    const value = Number(match[1].replace(',', '.'));
    const unit = match[2];
    total += value * (/^(кг|kg|килограмм)/u.test(unit) ? 1000 : unit === 'oz' ? 28.3495 : 1);
  }
  return Number.isFinite(total) && total > 0 ? total : null;
}

/** Derived from the saved portion, not an independent label measurement.
 * Unknown mass stays unknown; volumes must never be treated as grams. */
export function caloriesPer100Grams(calories: number, quantity: string): number | null {
  const grams = mealWeightGrams([quantity]);
  if (grams === null || !Number.isFinite(calories) || calories < 0) return null;
  const value = calories / grams * 100;
  return Number.isFinite(value) ? value : null;
}
