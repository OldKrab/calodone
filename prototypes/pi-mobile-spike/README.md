# CaloDone Pi mobile compatibility spike

> THROWAWAY PROTOTYPE — this is evidence for an architecture decision, not production app code.

Question: can an Android app open ChatGPT subscription login in the browser, receive OpenAI's fixed localhost callback, return to the app, and send Codex model requests without Hermes or a CaloDone backend?

The prototype intentionally uses the published `@earendil-works/pi-ai` package rather than Codex CLI or a CaloDone backend. It stores credentials through an injected `CredentialStore`, passes Expo's streaming `fetch` to inference requests, and deletes the temporary camera file after each request.

The first unchanged-package bundle failed because Metro rejects Pi's runtime-variable OAuth import. The current prototype therefore reuses Pi's model catalog, provider machinery, request transport, and credential refresh contract, but replaces its Node-oriented OAuth loader with an Android browser adapter matching Pi 0.84.4. The adapter runs a native TCP listener at `127.0.0.1:1455`, receives OpenAI's allow-listed callback, and serves a `calodone://oauth-complete` handoff page. A Metro resolver shim replaces Pi's optional Node environment/file credential lookup with an empty mobile context; actual credentials come from SecureStore.

## Run on Android

This cannot run in Expo Go because the localhost callback uses a native TCP module. Connect a phone with USB debugging enabled, install Android Studio/SDK, then run:

```sh
npm install
npm run android
```

The command creates and installs an Expo development build. In the app:

1. Run compatibility checks.
2. Select **Sign in with ChatGPT**.
3. Complete login in Chrome Custom Tabs. The localhost callback page should reopen CaloDone automatically; if Chrome blocks the automatic handoff, tap **Return to CaloDone** on that page.
4. Send the prefilled text request and verify that a model response appears.
5. Optionally take a meal photo and verify the image request too.

## What counts as success

- The Android development build starts without Node core-module shims.
- The runtime checks all pass.
- Browser login reaches the local callback and returns to the app.
- Login survives an app restart.
- Token refresh can write back through `SecureCredentialStore`.
- A text request reaches a Codex model and renders its response.
- A camera image reaches a Codex vision model and a streamed response completes.
- The captured temporary file is deleted after success or failure.

Static bundling alone is not a success verdict: login, credential refresh, and SSE parsing still require a device or simulator run.

## Known prototype shortcuts

- English and Russian UI strings are included, but the architecture is intentionally minimal.
- The browser adapter mirrors Pi/OpenAI internals that are not documented as a general mobile API and may change upstream.
- Android may keep Chrome Custom Tabs in the back stack after the app returns.
- The system camera confirmation remains; CaloDone's actual one-tap capture UX should use an embedded camera view.
- This tests only OpenAI Codex. A future shared AI library should keep provider-neutral interfaces and platform-specific auth/storage adapters in a separate package.
