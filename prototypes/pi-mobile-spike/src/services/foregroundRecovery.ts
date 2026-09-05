import { AppState } from 'react-native';

/** Android may suspend the connection in background. Retry on return, not in a loop there. */
export async function waitForConnectionRecovery(signal?: AbortSignal): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (error?: Error) => {
      clearTimeout(timer);
      subscription.remove();
      signal?.removeEventListener('abort', abort);
      if (error) reject(error); else resolve();
    };
    const abort = () => finish(new Error('Request cancelled'));
    const schedule = () => {
      clearTimeout(timer);
      if (AppState.currentState === 'active') timer = setTimeout(() => finish(), 1000);
    };
    const subscription = AppState.addEventListener('change', schedule);
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort(); else schedule();
  });
}
