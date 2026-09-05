# CaloDone Android app

This directory contains the production CaloDone Android app. Its name comes from the original Pi mobile compatibility spike. See the [root README](../../README.md) for the current release, installation, and contribution instructions.

## Current flow

1. Connect a ChatGPT account through browser OAuth.
2. Tap **Add meal** and choose a photo, **Describe meal**, or manual nutrition entry.
3. Take or choose photos, or describe the meal in text, then start analysis.
4. Return immediately to the Today screen while CaloDone recognizes the complete meal.
5. Answer any remaining clarification questions if needed. Unanswered clarifications become **Estimated** after 24 hours.

The Android home-screen widget opens directly into the camera. User-initiated meal analysis acquires an Android foreground service with a quiet notification and a bounded wake lock, allowing processing while other apps are open. WorkManager provides durable recovery after interruption, and returning to the app revisits delayed retries. Requests have a deadline and failures use bounded retries.

Opening a meal exposes its nutrition breakdown, **Fix with AI**, and manual editing for items, portions, meal type, time, calories, and macros. The Today header navigates previous days, and Settings stores optional calorie and macro goals.

Captured photos stay in private app storage and never enter the system gallery automatically. They remain attached to the meal so the user and assistant can inspect them later; saving or sharing a photo requires an explicit user action.

The interface and formatting are localized in English and Russian. Provider authorization and multimodal transport remain isolated under `src/ai`; meal prompts, persistence, and processing live outside that boundary.

## Run and verify

This cannot run in Expo Go because Codex OAuth uses a native localhost callback listener.

```sh
npm ci
npm run check
npm run android
```

No emulator is required. `npm run android` can install a development build on a USB-connected Android phone.

## Current boundary

- OpenAI Codex is the first provider.
- Android controls the exact WorkManager execution time; foreground-service processing still depends on network availability and device power policies. Force-stopping the app ends processing; queued work can resume on the next launch.
- Nutrition estimates currently come from the connected model rather than a verified food database.
- Barcode scanning, a dedicated packaged-food database, and health-platform synchronization are not implemented. App-data import and export are available in Settings.
- The OAuth adapter follows Pi/OpenAI integration behavior that is not documented as a stable general mobile API and may require upstream maintenance.

Camera zoom uses CameraX-exposed lenses and zoom ranges. An ultrawide choice appears only when Android exposes one to third-party apps. Preview and capture review preserve the full frame; capture requests disable the shutter sound. Diagnostics are saved as JSON to a user-selected folder rather than opening a share sheet.
