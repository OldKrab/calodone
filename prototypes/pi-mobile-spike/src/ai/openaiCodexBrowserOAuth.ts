import type {
  OAuthAuth,
  OAuthCredential,
  ProviderAuthInteraction,
} from '@earendil-works/pi-ai';
import * as WebBrowser from 'expo-web-browser';
import TcpSocket from 'react-native-tcp-socket';
import type Server from 'react-native-tcp-socket/lib/types/Server';
import type Socket from 'react-native-tcp-socket/lib/types/Socket';

// These values mirror Pi's OpenAI Codex provider. OpenAI registers the
// localhost redirect against this public client, so the redirect URI is a
// protocol invariant rather than application configuration.
const CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';
const AUTH_BASE_URL = 'https://auth.openai.com';
const AUTHORIZE_URL = `${AUTH_BASE_URL}/oauth/authorize`;
const TOKEN_URL = `${AUTH_BASE_URL}/oauth/token`;
const REDIRECT_URI = 'http://localhost:1455/auth/callback';
const APP_RETURN_URI = 'calodone://oauth-complete';
const SCOPE = 'openid profile email offline_access';
const ACCOUNT_CLAIM = 'https://api.openai.com/auth';
const CALLBACK_TIMEOUT_MS = 5 * 60 * 1_000;

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

type CallbackServer = {
  close(): void;
  cancel(error: Error): void;
  waitForCode(): Promise<string>;
};

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomBase64Url(byteLength: number): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

async function createAuthorizationFlow(): Promise<{
  state: string;
  verifier: string;
  url: string;
}> {
  const verifier = randomBase64Url(32);
  const challenge = toBase64Url(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)),
    ),
  );
  const state = randomBase64Url(24);
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('scope', SCOPE);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', state);
  url.searchParams.set('id_token_add_organizations', 'true');
  url.searchParams.set('codex_cli_simplified_flow', 'true');
  url.searchParams.set('originator', 'pi');
  return { state, verifier, url: url.toString() };
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const payload = token.split('.')[1];
  if (!payload) throw new Error('OpenAI access token is not a JWT');
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return JSON.parse(atob(padded)) as Record<string, unknown>;
}

function credentialFromToken(token: TokenResponse): OAuthCredential {
  const payload = decodeJwtPayload(token.access_token);
  const auth = payload[ACCOUNT_CLAIM] as { chatgpt_account_id?: unknown } | undefined;
  if (typeof auth?.chatgpt_account_id !== 'string') {
    throw new Error('OpenAI access token does not contain a ChatGPT account id');
  }

  return {
    type: 'oauth',
    access: token.access_token,
    refresh: token.refresh_token,
    expires: Date.now() + token.expires_in * 1_000,
    accountId: auth.chatgpt_account_id,
  };
}

async function requireToken(response: Response, operation: string): Promise<OAuthCredential> {
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`${operation} failed (${response.status}): ${body || response.statusText}`);
  }

  const token = (await response.json()) as Partial<TokenResponse>;
  if (!token.access_token || !token.refresh_token || typeof token.expires_in !== 'number') {
    throw new Error(`${operation} returned an incomplete token response`);
  }
  return credentialFromToken(token as TokenResponse);
}

async function exchangeCode(
  code: string,
  verifier: string,
  signal: AbortSignal,
): Promise<OAuthCredential> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      code,
      code_verifier: verifier,
      redirect_uri: REDIRECT_URI,
    }).toString(),
    signal,
  });
  return requireToken(response, 'Token exchange');
}

async function refresh(
  credential: OAuthCredential,
  signal: AbortSignal,
): Promise<OAuthCredential> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: credential.refresh,
      client_id: CLIENT_ID,
    }).toString(),
    signal,
  });
  return requireToken(response, 'Token refresh');
}

function sendResponse(
  socket: Socket,
  status: string,
  body: string,
  headers: Record<string, string> = {},
): void {
  const responseHeaders = {
    'Cache-Control': 'no-store',
    Connection: 'close',
    'Content-Length': String(new TextEncoder().encode(body).byteLength),
    'Content-Type': 'text/html; charset=utf-8',
    ...headers,
  };
  const serializedHeaders = Object.entries(responseHeaders)
    .map(([name, value]) => `${name}: ${value}`)
    .join('\r\n');
  socket.end(`HTTP/1.1 ${status}\r\n${serializedHeaders}\r\n\r\n${body}`);
}

function successPage(): string {
  // No credential or authorization code enters the app deep link. The loopback
  // listener already owns the code; this URI only returns focus to the app.
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>CaloDone login</title></head><body><p>Login complete. Returning to CaloDone...</p><p><a href="${APP_RETURN_URI}">Return to CaloDone</a></p><script>location.replace('${APP_RETURN_URI}')</script></body></html>`;
}

function startCallbackServer(expectedState: string, signal: AbortSignal): Promise<CallbackServer> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let resolveCode!: (code: string) => void;
    let rejectCode!: (error: Error) => void;
    const codePromise = new Promise<string>((resolveValue, rejectValue) => {
      resolveCode = resolveValue;
      rejectCode = rejectValue;
    });
    const timeout = setTimeout(
      () => cancel(new Error('Login callback timed out')),
      CALLBACK_TIMEOUT_MS,
    );

    const close = () => {
      clearTimeout(timeout);
      signal.removeEventListener('abort', onAbort);
      if (server.listening) server.close();
    };
    const cancel = (error: Error) => {
      if (settled) return;
      settled = true;
      rejectCode(error);
      close();
    };
    const onAbort = () => cancel(new Error('Login cancelled'));

    const server: Server = TcpSocket.createServer((socket) => {
      socket.setEncoding('utf8');
      let request = '';
      let handled = false;

      socket.on('data', (chunk) => {
        if (handled) return;
        request += String(chunk);
        if (request.length > 16_384) {
          handled = true;
          sendResponse(socket, '431 Request Header Fields Too Large', 'Request too large.');
          return;
        }
        if (!request.includes('\r\n\r\n')) return;
        handled = true;

        try {
          const requestLine = request.split('\r\n', 1)[0] ?? '';
          const [method, target] = requestLine.split(' ');
          const callback = new URL(target ?? '', REDIRECT_URI);
          if (method !== 'GET' || callback.pathname !== '/auth/callback') {
            sendResponse(socket, '404 Not Found', 'Callback route not found.');
            return;
          }
          if (callback.searchParams.get('state') !== expectedState) {
            sendResponse(socket, '400 Bad Request', 'OAuth state mismatch.');
            return;
          }

          const oauthError = callback.searchParams.get('error');
          if (oauthError) {
            sendResponse(socket, '400 Bad Request', 'OpenAI login was not completed.');
            cancel(new Error(`OpenAI login failed: ${oauthError}`));
            return;
          }

          const code = callback.searchParams.get('code');
          if (!code) {
            sendResponse(socket, '400 Bad Request', 'Authorization code is missing.');
            return;
          }

          sendResponse(socket, '200 OK', successPage());
          if (!settled) {
            settled = true;
            resolveCode(code);
          }
        } catch (error) {
          sendResponse(socket, '400 Bad Request', 'Invalid OAuth callback.');
        }
      });
      socket.on('error', () => {
        socket.destroy();
      });
    });

    server.on('error', (error) => {
      cancel(error);
      reject(error);
    });
    server.listen({ port: 1455, host: '127.0.0.1', reuseAddress: true }, () => {
      if (signal.aborted) {
        cancel(new Error('Login cancelled'));
        reject(new Error('Login cancelled'));
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
      resolve({ close, cancel, waitForCode: () => codePromise });
    });
  });
}

async function login(interaction: ProviderAuthInteraction): Promise<OAuthCredential> {
  const { state, verifier, url } = await createAuthorizationFlow();
  const callbackServer = await startCallbackServer(state, interaction.signal);
  interaction.notify({
    type: 'auth_url',
    url,
    instructions: 'Complete ChatGPT login in the browser.',
  });

  // Android's auth session observes the CaloDone deep link emitted by the
  // callback page and brings the existing activity back to the foreground.
  // The authorization code itself is accepted only by the loopback listener.
  void WebBrowser.openAuthSessionAsync(url, APP_RETURN_URI).then(
    (result) => {
      if (result.type !== 'success') {
        callbackServer.cancel(new Error('Browser login was cancelled'));
      }
    },
    (error) => {
      callbackServer.cancel(error instanceof Error ? error : new Error(String(error)));
    },
  );

  try {
    const code = await callbackServer.waitForCode();
    return await exchangeCode(code, verifier, interaction.signal);
  } finally {
    callbackServer.close();
  }
}

/** Android browser OAuth adapter using OpenAI's allow-listed localhost callback. */
export const openaiCodexBrowserOAuth: OAuthAuth = {
  name: 'OpenAI (ChatGPT Plus/Pro)',
  isSubscription: true,
  loginLabel: 'Sign in with ChatGPT',
  login,
  refresh,
  async toAuth(credential) {
    return { apiKey: credential.access };
  },
};
