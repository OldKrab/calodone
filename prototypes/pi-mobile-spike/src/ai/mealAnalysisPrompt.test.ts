import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildMealAnalysisPrompt, MEAL_ANALYSIS_PROMPT_VERSION } from './mealAnalysisPrompt.ts';

test('analysis contract handles material visual uncertainty without food-specific rules', () => {
  const prompt = buildMealAnalysisPrompt('English');

  assert.match(prompt, /low, central, and high plausible quantity/);
  assert.match(prompt, /MUST return one to three clarification questions/);
  assert.match(prompt, /Never substitute a familiar or default serving/);
  assert.match(prompt, /Never transfer nutrition from a different variant or serving size/);
  assert.doesNotMatch(prompt, /Snickers|candy bar|mini bar/i);
});

test('analysis prompt has a stable diagnostic version', () => {
  assert.match(MEAL_ANALYSIS_PROMPT_VERSION, /^meal-evidence-v\d+$/);
});


test('descriptions are sufficient evidence and missing portions do not require a photo', () => {
  const prompt = buildMealAnalysisPrompt('English');
  assert.match(prompt, /A text description alone is sufficient input/);
  assert.match(prompt, /ask about the food or portion instead/);
});
