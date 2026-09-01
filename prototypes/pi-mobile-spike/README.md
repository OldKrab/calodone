# CaloDone Pi mobile compatibility spike

> THROWAWAY PROTOTYPE — this is evidence for an architecture decision, not production app code.

Question: can an Expo/React Native app directly use Pi's OpenAI Codex provider for ChatGPT subscription login, secure token refresh, image input, and streamed responses?

The prototype intentionally uses the published `@earendil-works/pi-ai` package rather than Codex CLI or a CaloDone backend. It stores credentials through an injected `CredentialStore`, passes Expo's streaming `fetch` to inference requests, and deletes the temporary camera file after each request.

The first unchanged-package bundle failed because Metro rejects Pi's runtime-variable OAuth import. The current prototype therefore reuses Pi's model catalog, provider machinery, request transport, and credential refresh contract, but replaces its Node-oriented OAuth loader with a local device-code-only adapter matching Pi 0.84.4. A Metro resolver shim also replaces Pi's optional Node environment/file credential lookup with an empty mobile context; actual credentials come from SecureStore.

## Run on Android

1. Install Expo Go on the phone.
2. From this directory, run `npm start`.
3. Scan the QR code with Expo Go.
4. Run compatibility checks.
5. Select **Sign in with ChatGPT**, finish device-code login in the opened browser, and return to the app.
6. Take a test photo and verify that a model response appears.

## Run in the iOS Simulator on macOS

A physical iPhone is not required. Install Xcode, open it once so it installs the simulator runtime, then:

```sh
npm install
npm run ios
```

The simulator can test bundling, login, Keychain storage, and streaming. It cannot take a real camera photo, so drag an image into the simulator's Photos app and select **Choose a test photo (simulator)**. Use Android for the end-to-end camera check. SecureStore's biometric behavior also requires a physical device, but this prototype does not enable biometric-gated reads.

## What counts as success

- Android and iOS bundles build without Node core-module shims.
- The runtime checks all pass.
- Device-code login completes and survives an app restart.
- Token refresh can write back through `SecureCredentialStore`.
- A camera image reaches a Codex vision model and a streamed response completes.
- The captured temporary file is deleted after success or failure.

Static bundling alone is not a success verdict: login, credential refresh, and SSE parsing still require a device or simulator run.

## Known prototype shortcuts

- English and Russian UI strings are included, but the architecture is intentionally minimal.
- The system camera confirmation remains; CaloDone's actual one-tap capture UX should use an embedded camera view.
- This tests only OpenAI Codex. A future shared AI library should keep provider-neutral interfaces and platform-specific auth/storage adapters in a separate package.
