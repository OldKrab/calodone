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

export async function analyzeMealPhoto(input: {
  base64: string;
  mimeType: string;
  note?: string;
}): Promise<{ model: string; text: string }> {
  const model = imageModel();
  const response = await models.complete(
    model,
    {
      systemPrompt:
        'This is a transport compatibility test. Describe the visible meal briefly. Do not invent hidden ingredients or exact quantities.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: input.note?.trim()
                ? `Describe this meal. User note: ${input.note.trim()}`
                : 'Describe this meal.',
            },
            { type: 'image', data: input.base64, mimeType: input.mimeType },
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
