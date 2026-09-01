import { openDatabaseSync } from 'expo-sqlite';

import type { Meal, MealAnalysis, MealPhoto, MealStatus } from '../domain/meal';

const database = openDatabaseSync('calodone.db');

type MealRow = {
  id: string;
  captured_at: number;
  status: MealStatus;
  note: string;
  photos_json: string;
  analysis_json: string | null;
  error: string | null;
};

function fromRow(row: MealRow): Meal {
  return {
    id: row.id,
    capturedAt: row.captured_at,
    status: row.status,
    note: row.note,
    photos: JSON.parse(row.photos_json) as MealPhoto[],
    analysis: row.analysis_json ? (JSON.parse(row.analysis_json) as MealAnalysis) : undefined,
    error: row.error ?? undefined,
  };
}

export async function initializeMeals(): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS meals (
      id TEXT PRIMARY KEY NOT NULL,
      captured_at INTEGER NOT NULL,
      status TEXT NOT NULL,
      note TEXT NOT NULL,
      photos_json TEXT NOT NULL,
      analysis_json TEXT,
      error TEXT,
      clarification_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS meals_captured_at ON meals(captured_at DESC);
  `);
  const columns = await database.getAllAsync<{ name: string }>('PRAGMA table_info(meals)');
  if (!columns.some((column) => column.name === 'clarification_at')) {
    await database.execAsync('ALTER TABLE meals ADD COLUMN clarification_at INTEGER;');
  }
}

export async function createMeal(input: {
  id: string;
  capturedAt: number;
  note: string;
  photos: MealPhoto[];
}): Promise<Meal> {
  await database.runAsync(
    `INSERT INTO meals (id, captured_at, status, note, photos_json)
     VALUES (?, ?, 'queued', ?, ?)`,
    input.id,
    input.capturedAt,
    input.note,
    JSON.stringify(input.photos),
  );
  return { ...input, status: 'queued' };
}

export async function listMeals(): Promise<Meal[]> {
  const rows = await database.getAllAsync<MealRow>('SELECT * FROM meals ORDER BY captured_at DESC');
  return rows.map(fromRow);
}

export async function getMeal(id: string): Promise<Meal | undefined> {
  const row = await database.getFirstAsync<MealRow>('SELECT * FROM meals WHERE id = ?', id);
  return row ? fromRow(row) : undefined;
}

export async function setMealStatus(id: string, status: MealStatus, error?: string): Promise<void> {
  await database.runAsync(
    'UPDATE meals SET status = ?, error = ? WHERE id = ?',
    status,
    error ?? null,
    id,
  );
}

export async function saveMealAnalysis(id: string, analysis: MealAnalysis): Promise<void> {
  await database.runAsync(
    'UPDATE meals SET status = ?, analysis_json = ?, error = NULL, clarification_at = ? WHERE id = ?',
    analysis.clarification ? 'needs_input' : 'complete',
    JSON.stringify(analysis),
    analysis.clarification ? Date.now() : null,
    id,
  );
}

export async function finalizeExpiredClarifications(now = Date.now()): Promise<void> {
  const cutoff = now - 24 * 60 * 60 * 1000;
  await database.runAsync(
    `UPDATE meals
     SET status = 'estimated'
     WHERE status = 'needs_input' AND clarification_at IS NOT NULL AND clarification_at <= ?`,
    cutoff,
  );
}

export async function saveClarificationAnswer(id: string, answer: string): Promise<void> {
  const meal = await getMeal(id);
  if (!meal?.analysis) return;
  const analysis = { ...meal.analysis, clarification: undefined };
  await database.runAsync(
    'UPDATE meals SET status = ?, analysis_json = ?, note = ? WHERE id = ?',
    'complete',
    JSON.stringify(analysis),
    [meal.note, answer].filter(Boolean).join('\n'),
    id,
  );
}
