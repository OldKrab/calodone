# CaloDone Android app

This directory contains the first usable CaloDone vertical slice. It grew from the Pi mobile compatibility spike after browser-based ChatGPT login and Codex model requests were verified on a physical Android phone.

## Current flow

1. Connect a ChatGPT account through browser OAuth.
2. Tap **Add meal** to open CaloDone's embedded camera.
3. Take one photo, optionally add another angle or a short note, then tap **Send**.
4. Return immediately to the Today screen while CaloDone recognizes the complete meal.
5. Answer one high-impact clarification if needed. Unanswered clarifications become **Estimated** after 24 hours.

The Android home-screen widget opens directly into the camera. Queued meals use foreground processing first and a WorkManager-backed periodic task for durable recovery after interruption. Failed requests use bounded exponential retries.

Opening a meal exposes its nutrition breakdown, **Fix with AI**, and manual editing for items, portions, meal type, time, calories, and macros. The Today header navigates previous days, and Settings stores optional calorie and macro goals.

Captured photos stay in private app storage, never enter the gallery, and are deleted after successful analysis. Failed and interrupted jobs retain their private photos so they can be retried.

The interface and formatting are localized in English and Russian. Provider authorization and multimodal transport remain isolated under `src/ai`; meal prompts, persistence, and processing live outside that boundary.

## Run and verify

This cannot run in Expo Go because Codex OAuth uses a native localhost callback listener.

```sh
npm install
npm run check
npm run android
```

No emulator is required. `npm run android` can install a development build on a USB-connected Android phone.

## Current boundary

- OpenAI Codex is the first provider.
- Android controls the exact WorkManager execution time; immediate processing remains best effort when the app leaves the foreground, while queued work is durable and resumes periodically or on the next launch.
- Nutrition estimates currently come from the connected model rather than a verified food database.
- Barcode capture, packaged-food lookup, export, backups, and health-platform synchronization are not implemented.
- The OAuth adapter follows Pi/OpenAI integration behavior that is not documented as a stable general mobile API and may require upstream maintenance.
