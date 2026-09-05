import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mealWeightGrams } from './mealWeight.ts';

test('totals explicit ingredient masses without counting portions or volumes as grams', () => {
  assert.equal(mealWeightGrams(['примерно 80 г', '150 г', 'около 70 г', '50 g', '0,1 кг']), 450);
  assert.equal(mealWeightGrams(['80 г', '1 порция']), null);
  assert.equal(mealWeightGrams(['80 г', '100 мл']), null);
  assert.equal(mealWeightGrams(['2 × 50 г']), null);
  assert.equal(mealWeightGrams(['50–70 г']), null);
  assert.equal(mealWeightGrams([]), null);
});

test('calories per 100 g use the portion mass, including zero-calorie products', async () => {
  const { caloriesPer100Grams } = await import('./mealWeight.ts');
  assert.ok(Math.abs(caloriesPer100Grams(166, 'примерно 80 г')! - 207.5) < 1e-9);
  assert.equal(caloriesPer100Grams(195, '0,15 кг'), 130);
  assert.equal(caloriesPer100Grams(0, '100 г'), 0);
  assert.equal(caloriesPer100Grams(5, '500 мл'), null);
  assert.equal(caloriesPer100Grams(150, '1 порция'), null);
  assert.equal(caloriesPer100Grams(150, '50–70 г'), null);
  assert.equal(caloriesPer100Grams(150, '0 г'), null);
});
