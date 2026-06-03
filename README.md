# Fertility Tracker

A cross-platform Expo app for Android and iOS that helps track menstrual cycles, fertile-window estimates, symptoms, tests, fertility signals, and daily notes.

## Features

- Home dashboard with cycle day, next period, fertile window, ovulation estimate, and quick actions.
- Daily logging for flow, mood, symptoms, cervical mucus, BBT, ovulation tests, pregnancy tests, intercourse, and notes.
- Cycle calendar with period, fertile, ovulation, and regular phases.
- Insights screen with symptom trends, logged history, BMI category, TTC care prompts, and key fertility stats.
- Settings for age, trying-to-conceive months, height, weight, prenatal/folic acid status, cycle length, period length, luteal phase, reminders, and privacy lock preference.
- Clear local data control for user-managed deletion.
- Local persistence with AsyncStorage so logs and settings survive app restarts.

## Run

Install Node.js first if `npm` is not available in your terminal:

```sh
brew install node
```

Then install dependencies and start Expo:

```sh
npm install
npm run ios
npm run android
```

If `npm run android` fails with `spawn adb ENOENT`, install Android Studio and the Android SDK:

1. Install Android Studio from <https://developer.android.com/studio>.
2. Open Android Studio once and install the default SDK.
3. Add the SDK tools to your shell:

```sh
echo 'export ANDROID_HOME="$HOME/Library/Android/sdk"' >> ~/.zshrc
echo 'export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Then run:

```sh
npm run android
```

To test on a real phone without an Android emulator, install Expo Go on the phone and run:

```sh
npm start
```

The app stores entries locally on the device with `AsyncStorage`. Use an encrypted store or secure backend before handling production health data.

## Notes

Predicted period and fertility dates are estimates based on cycle length and last period start. They should not be used as medical advice or as the only method for preventing pregnancy.

The BMI and TTC care prompts are educational screening prompts only. The app uses CDC adult BMI categories, CDC/ACOG folic acid guidance, and ACOG infertility-evaluation timing guidance.
