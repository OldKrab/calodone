import {
  contentText,
  createModels,
  type AuthEvent,
  type AuthPrompt,
} from '@earendil-works/pi-ai';
import { fetch as expoFetch } from 'expo/fetch';

import { installPiMobileRuntime } from './mobileRuntime';
import { openaiCodexMobileProvider } from './openaiCodexMobileProvider';
import { SecureCredentialStore } from './secureCredentialStore';

const PROVIDER_ID = 'openai-codex';
const PREFERRED_IMAGE_MODELS = [
  'gpt-5.6-luna',
  'gpt-5.4-mini',
  'gpt-5.4',
] as const;

installPiMobileRuntime();

const credentials = new SecureCredentialStore();
const models = createModels({ credentials });
models.setProvider(openaiCodexMobileProvider());

export type LoginCallbacks = {
  onEvent(event: AuthEvent): void;
};

export async function isSignedIn(): Promise<boolean> {
  return Boolean(await models.checkAuth(PROVIDER_ID));
}

export async function signInWithBrowser(
  callbacks: LoginCallbacks,
): Promise<void> {
  await models.login(PROVIDER_ID, 'oauth', {
    prompt: async (prompt: AuthPrompt) => {
      throw new Error(`Unexpected mobile OAuth prompt: ${prompt.type}`);
    },
    notify: callbacks.onEvent,
  });
}

export async function signOut(): Promise<void> {
  await models.logout(PROVIDER_ID);
}

function imageModel() {
  for (const modelId of PREFERRED_IMAGE_MODELS) {
    const model = models.getModel(PROVIDER_ID, modelId);
    if (model?.input.includes('image')) return model;
  }

  const fallback = models
    .getModels(PROVIDER_ID)
    .find((model) => model.input.includes('image'));
  if (!fallback) throw new Error('Pi did not expose a Codex model with image input');
  return fallback;
}

function textModel() {
  for (const modelId of PREFERRED_IMAGE_MODELS) {
    const model = models.getModel(PROVIDER_ID, modelId);
    if (model?.input.includes('text')) return model;
  }

  const fallback = models
    .getModels(PROVIDER_ID)
    .find((model) => model.input.includes('text'));
  if (!fallback) throw new Error('Pi did not expose a Codex model with text input');
  return fallback;
}

export async function sendTextPrompt(
  prompt: string,
): Promise<{ model: string; text: string }> {
  const text = prompt.trim();
  if (!text) throw new Error('Enter a request first');
  const model = textModel();
  const response = await models.complete(
    model,
    {
      systemPrompt: 'Answer the user directly and concisely.',
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text }],
          timestamp: Date.now(),
        },
      ],
    },
    {
      fetch: expoFetch as typeof globalThis.fetch,
      transport: 'sse',
    },
  );

  if (response.stopReason === 'error') {
    throw new Error(response.errorMessage ?? 'Unknown Pi request error');
  }
  return { model: model.id, text: contentText(response.content) };
}

export type ImageInput = {
  base64: string;
  mimeType: string;
};

const MEAL_RESULT_SHAPE = `Return only valid JSON with this exact shape:
{
  "title": string,
  "mealType": "breakfast" | "lunch" | "dinner" | "snack",
  "items": [{ "name": string, "quantity": string, "calories": number, "protein": number, "carbs": number, "fat": number }],
  "totals": { "calories": number, "protein": number, "carbs": number, "fat": number },
  "clarification"?: { "question": string, "impactCalories": number }
}`;

export async function analyzeMealPhotos(input: {
  photos: ImageInput[];
  note?: string;
  language: 'English' | 'Russian';
}): Promise<{ model: string; text: string }> {
  if (input.photos.length === 0) throw new Error('At least one meal photo is required');
  const model = imageModel();
  const response = await models.complete(
    model,
    {
      systemPrompt: `You estimate nutrition from meal photos for a calorie tracker.
All supplied photos show the same meal, possibly from different angles. Recognize the whole meal and never double-count food repeated across photos.
Use visible evidence and the user note. Estimate plausible portions without pretending certainty.
Ask at most one clarification, only when resolving it could change calories by more than 100 kcal or 20%. Ask the single highest-impact question.
Write all user-facing strings in ${input.language}. ${MEAL_RESULT_SHAPE}`,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: input.note?.trim()
                ? `Analyze this complete meal. User note: ${input.note.trim()}`
                : 'Analyze this complete meal.',
            },
            ...input.photos.map((photo) => ({
              type: 'image' as const,
              data: photo.base64,
              mimeType: photo.mimeType,
            })),
          ],
          timestamp: Date.now(),
        },
      ],
    },
    {
      // React Native's built-in fetch historically lacked a streaming body.
      // Expo's implementation supplies the ReadableStream contract Pi consumes.
      fetch: expoFetch as typeof globalThis.fetch,
      transport: 'sse',
    },
  );

  if (response.stopReason === 'error') {
    throw new Error(response.errorMessage ?? 'Unknown Pi request error');
  }

  return { model: model.id, text: contentText(response.content) };
}

export async function refineMealAnalysis(input: {
  previousJson: string;
  question: string;
  answer: string;
  language: 'English' | 'Russian';
}): Promise<{ model: string; text: string }> {
  const model = textModel();
  const response = await models.complete(
    model,
    {
      systemPrompt: `Update an existing meal estimate using the user's answer.
Preserve details unaffected by the answer and recalculate item and meal totals. Do not ask another question.
Write all user-facing strings in ${input.language}. ${MEAL_RESULT_SHAPE}`,
      messages: [{
        role: 'user',
        content: [{
          type: 'text',
          text: `Existing meal JSON:\n${input.previousJson}\n\nQuestion: ${input.question}\nAnswer: ${input.answer}`,
        }],
        timestamp: Date.now(),
      }],
    },
    { fetch: expoFetch as typeof globalThis.fetch, transport: 'sse' },
  );

  if (response.stopReason === 'error') {
    throw new Error(response.errorMessage ?? 'Unknown Pi request error');
  }
  return { model: model.id, text: contentText(response.content) };
}
