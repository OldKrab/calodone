<p align="center">
  <img src="prototypes/pi-mobile-spike/assets/caldone-fork-icon.png" width="104" alt="CalDone bent-fork icon">
</p>

# CalDone

A calm food diary for Android. Add a meal with photos or text, get an editable calorie and macro estimate, and clarify the details in conversation.

**[Download CalDone](https://github.com/OldKrab/caldone/releases/latest)** · [Release history](https://github.com/OldKrab/caldone/releases) · [Report an issue](https://github.com/OldKrab/caldone/issues)

## What you can do

- Log meals with the camera, existing photos, or text. Add multiple angles and a note when useful.
- Review daily calories, protein, carbohydrates, and fat alongside your goals and meal history.
- Edit meal ingredients, portions, nutrition values, meal type, and time.
- Ask the assistant about your meals, answer clarifying questions, and request corrections. Inspect before/after details and undo supported changes.
- With web search enabled, the assistant researches identifiable products before asking you to transcribe a nutrition label. It checks serving sizes and prioritizes manufacturer and restaurant sources.
- Follow assistant activity without losing the conversation. Hold message text to select and copy it.
- Use the Android home-screen capture widget, English or Russian, and configurable notifications and units.
- Export and import app data from Settings.

## Install and get started

1. Download the **arm64 APK** from [GitHub Releases](https://github.com/OldKrab/caldone/releases/latest) and install it on a compatible Android phone. Android may ask you to allow installation from your browser or file manager.
2. Complete setup and connect your ChatGPT account through the browser. OpenAI Codex is the currently implemented AI provider.
3. Tap **Add meal**, capture or choose a photo, or enter a meal without one. Review the estimate and answer any remaining questions.

Starting with **1.2.0**, CalDone uses application ID `dev.caldone.app` and installs separately from earlier versions. To transfer from a 1.1.x installation:

1. In the old app, open **Settings → Data and privacy**, enable photos in the export, and export your data.
2. Install the new app, complete setup and sign in again. Import the saved JSON in **Settings → Data and privacy**.
3. Check your meals, photos and conversations before uninstalling the old app. Keep the backup until the transfer is verified.

Later updates using this application ID install over the new app normally. Credentials are not included in backups.

## Data and current limits

Meal history and photos are stored locally. Captured photos do not enter the system gallery automatically. Photos and relevant meal or conversation content are sent to the connected AI provider when needed for analysis or assistant requests; this is not an offline-only app. Credentials use the operating system's secure storage.

Nutrition values are AI estimates and can be corrected manually. Android may interrupt background networking; queued meal processing can resume later, and transient connection recovery is bounded. Immediate completion while another app is open is not guaranteed.

Barcode scanning and health-platform synchronization are not implemented. The browser preview is a design prototype, not a web version of the Android app.

## Development

The Android app lives in `prototypes/pi-mobile-spike/`; that directory name is historical. It uses Expo, React Native, and TypeScript. Use Node.js 22.18+ and an Android development environment with a compatible JDK and Android SDK; release CI uses Node.js 22 and Java 21.

A **native build is required**. Expo Go cannot run the Codex authentication callback listener.

```sh
cd prototypes/pi-mobile-spike
npm ci
npm run check
npm run android
```

`npm run android` can install on an emulator or a USB-connected Android device. Run the complete test suite from Bash, including nested feature tests:

```bash
shopt -s globstar
node --test src/**/*.test.ts
```

To build a local standalone arm64 APK with your Android SDK and JDK configured:

```sh
bash scripts/build-android.sh
```

The APK is written to `artifacts/caldone-<version>-arm64.apk` at the repository root. Local builds use the generated development signing key; builds made on another machine may not update an official installation. GitHub releases use the configured release signing key.

## Repository layout

| Path | Purpose |
| --- | --- |
| [`prototypes/pi-mobile-spike/`](prototypes/pi-mobile-spike/) | Production Android application |
| [`web-preview/`](web-preview/) | Interactive design prototype |
| [`docs/adr/`](docs/adr/) | Architecture decisions |
| [`PRODUCT.md`](PRODUCT.md) | Product behavior and scope |
| [`DESIGN.md`](DESIGN.md) | Native interface and design guidance |
| [`CONTEXT.md`](CONTEXT.md) | Domain language and implementation context |

## Contributing

Issues and pull requests are welcome. For bug reports, include the app version, device/Android version, reproduction steps, and relevant screenshots. Review diagnostic exports before posting them publicly, and never include credentials or personal meal data you do not want to share.

For a misidentified photo, open Settings → Data & privacy → Capture next analysis with photo, then add one test meal and wait for its result. Save diagnostics from the same settings page. This opt-in export contains the source photo, allowed JSON fields captured at the HTTP send boundary, and the parsed model response; it excludes HTTP headers and authentication credentials. It keeps only the latest capture (up to three attempts), survives restarting the app, and can be removed with Delete test capture. Removing all meal photos or meal data also removes the capture. Ordinary analysis is not recorded in this way.

Keep changes focused, follow [`AGENTS.md`](AGENTS.md) and the product/design references, and run TypeScript and relevant tests before opening a PR. Include screenshots for interface changes and describe any behavior that still needs device verification.

## Releases and license

The [Android release workflow](.github/workflows/android-release.yml) validates the source and builds a signed arm64 APK. Version tags (`v*`) publish a GitHub release; manual workflow runs produce downloadable build artifacts. The workflow verifies the signing certificate and APK architecture. Signing secrets, APKs, and diagnostic exports are excluded from source control.

The Android application includes an [MIT license](prototypes/pi-mobile-spike/LICENSE). See the [app README](prototypes/pi-mobile-spike/README.md) for implementation boundaries.
