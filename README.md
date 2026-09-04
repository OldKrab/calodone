# CaloDone

CaloDone is an Android meal tracker that turns meal photos or text into editable calorie and macro records. It includes persistent meal history, daily goals, an AI assistant that can inspect and edit app data, and a compact home-screen capture widget.

Version 1.0.0 is the first shared release.

## Repository layout

- `prototypes/pi-mobile-spike/` — the production Android application. The directory name is historical.
- `web-preview/` — the interactive browser prototype used while shaping the interface.
- `docs/adr/` — architecture decisions.
- `PRODUCT.md`, `DESIGN.md`, and `CONTEXT.md` — product, design-system, and domain-language references.

## Develop the Android app

The app requires a native development build; it cannot run in Expo Go because Codex authentication uses a native localhost callback listener.

```sh
cd prototypes/pi-mobile-spike
npm ci
npm run check
npm run android
```

Release APKs and local diagnostic output are intentionally excluded from Git. User credentials are stored through the operating system's secure credential storage and must never be committed.

## Releases

`.github/workflows/android-release.yml` checks the source and builds a signed ARM64 APK on manual runs and version tags. A `v*` tag also publishes the APK in a GitHub Release. Android signing material lives only in repository secrets; the workflow rejects artifacts signed with a certificate different from the 1.0.0 release.

See [`prototypes/pi-mobile-spike/README.md`](prototypes/pi-mobile-spike/README.md) for implementation details and known boundaries.
