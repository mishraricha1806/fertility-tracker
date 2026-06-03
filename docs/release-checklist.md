# Release Checklist

## Before Building

- Replace support email in `docs/privacy-policy.md`.
- Host the privacy policy on a public URL.
- Confirm the app name, bundle identifier, and Android package are final:
  - iOS: `com.richamishra.fertilitytracker`
  - Android: `com.richamishra.fertilitytracker`
- Confirm `app.json` version, iOS `buildNumber`, and Android `versionCode`.
- Run `npm run typecheck`.
- Run `npx expo-doctor`.
- Review `npm audit --omit=dev`. As of this setup, npm reports a moderate `uuid` advisory through Expo config/build tooling; `npm audit fix --force` proposes a breaking Expo package downgrade, so do not force-fix without retesting the full SDK.

## Apple App Store

- Enroll in the Apple Developer Program.
- Create the app in App Store Connect with bundle ID `com.richamishra.fertilitytracker`.
- Fill app privacy details. For the current local-only version, the draft answer is "data not collected by the developer".
- Add the hosted privacy policy URL.
- Add screenshots for required iPhone sizes and optional iPad sizes.
- Add support URL, marketing URL if available, app description, keywords, category, age rating, and review notes.
- Build with `npm run build:ios`.
- Submit with `npm run submit:ios` or upload from EAS to TestFlight.

## Google Play

- Create a Google Play Developer account.
- Create the app with package `com.richamishra.fertilitytracker`.
- Fill Data safety. For the current local-only version, the draft answer is no developer-collected or shared user data.
- Add the hosted privacy policy URL.
- Add screenshots, app icon, feature graphic, short description, full description, category, content rating, and target audience.
- Build with `npm run build:android`.
- Submit with `npm run submit:android` to the internal track first.

## Final QA

- Install the production build on a real iPhone and Android phone.
- Log a day, close the app, reopen it, and verify logs/settings persist.
- Verify all tabs fit on small phones.
- Verify Clear local data removes logs and resets settings.
- Verify no medical claim implies diagnosis, treatment, or contraception reliability.
- Verify privacy policy and store data safety answers match the final app behavior.
