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
