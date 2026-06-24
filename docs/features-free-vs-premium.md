# Fertility Tracker Feature Documentation

This document describes the current Free and Premium product experience for Fertility Tracker.

## Product Positioning

Fertility Tracker is a privacy-focused cycle, ovulation, and trying-to-conceive app. The first release is free and covers essential period and fertility tracking. Fertility Tracker Plus is shown only as a coming soon roadmap for future deeper insights, reporting, reminders, and backup features.

## Current Billing Status

The Plus experience is currently a coming soon roadmap. It does not show prices or process real payments yet.

Before charging users, connect Apple In-App Purchases and Google Play Billing directly or through a subscription service such as RevenueCat. Store listings must not claim live paid subscriptions until billing is implemented, tested, and approved.

## Free Plan

The Free plan should remain useful enough for users to trust the app and continue logging consistently.

### Cycle Dashboard

Users can see:

- Current cycle day
- Next period estimate
- Days until next period
- Average cycle length
- Fertile window estimate
- Ovulation estimate
- Quick action to mark period started
- Quick action to log today's data

Purpose:

The dashboard gives users the most important daily cycle context without requiring them to open multiple screens.

### Period and Fertility Logging

Users can log:

- Period flow: None, Spotting, Light, Medium, Heavy
- Cervical mucus: Dry, Sticky, Creamy, Watery, Egg white
- Basal body temperature
- Intercourse
- Ovulation test result
- Pregnancy test result
- Mood
- Symptoms
- Daily note

Purpose:

This creates the raw data needed for cycle history, fertile-window estimates, and future premium insights.

### Cycle Calendar

Users can view:

- Full cycle calendar
- Cycle day numbers
- Period phase
- Fertile phase
- Ovulation day
- Regular days
- Logged-day markers

Purpose:

The calendar helps users understand where they are in the cycle and visually compare logged days with predicted phases.

### Basic Insights

Users can see:

- Cycle length
- Flow days
- Fertile start date
- BMI value
- Symptom trends
- Logged history
- Intercourse timing summary

Purpose:

Free insights provide helpful summaries without moving into advanced prediction or report generation.

### TTC Care Plan

Users can see educational prompts for:

- Prenatal vitamin or folic acid
- BMI category
- When to consider seeking infertility evaluation
- Cycle pattern range

Purpose:

This supports trying-to-conceive users with gentle, non-diagnostic guidance.

Medical note:

These prompts are educational only. They are not medical advice, diagnosis, treatment, contraception, or a substitute for clinician care.

### BMI and Prep Settings

Users can enter:

- Age
- Months trying to conceive
- Height
- Weight
- Prenatal or folic acid status

Purpose:

These fields personalize the educational TTC care prompts.

### Reminders Preferences

Users can toggle:

- Fertile window reminder
- Period reminder

Current status:

These are UI preferences in the current prototype. Native push notification scheduling is not implemented yet.

### Privacy Lock

Users can:

- Create a 4 digit PIN
- Reset the PIN
- Disable PIN lock
- Unlock with PIN
- Unlock with Face ID or biometrics on supported devices

Technical behavior:

- PIN is stored with secure device storage.
- Face ID and biometric verification are handled by the operating system.
- The app does not receive or store biometric templates.

Purpose:

Fertility data is sensitive. Privacy lock is a core trust feature and should remain free.

### Local Storage

The app stores logs and settings locally on the device.

Users can:

- Keep data without creating an account
- Clear local data from Settings

Current limitations:

- No cloud backup
- No multi-device sync
- Data may be removed if the app is deleted or app storage is cleared

## Premium Plan: Fertility Tracker Plus

Fertility Tracker Plus is a future paid tier concept. In the current app, it is a coming soon roadmap only. It does not show prices, accept payment, unlock simulated purchases, or restore purchases.

### Plus Coming Soon Screen

The Plus screen includes:

- Coming soon headline
- Premium roadmap cards
- Premium feature list
- Free plan feature list
- Billing availability disclaimer

Purpose:

This screen presents future monetization value without selling subscriptions before real store billing is connected.

### Advanced TTC Insights

Premium concept:

- Ovulation confidence score
- Cycle regularity score
- Fertility signal interpretation
- Pattern comparison across cycles

Inputs used:

- LH test results
- Cervical mucus
- BBT
- Cycle day
- Period history

Current status:

Coming soon card exists in Insights. Real scoring logic is not yet production-grade.

### Smart Reminders

Premium concept:

- LH test reminder
- BBT reminder
- Fertile window reminder
- Prenatal vitamin reminder
- Period reminder

Current status:

Coming soon feature listed in Plus. Native notification scheduling is not implemented yet.

### Doctor-Ready Reports

Premium concept:

- 3 month cycle report
- 6 month cycle report
- Symptom summary
- Flow history
- BBT history
- Ovulation test summary
- Pregnancy test summary
- PDF export

Current status:

Coming soon card exists. PDF generation is not implemented yet.

### Cloud Backup Preview

Premium concept:

- Backup logs and settings
- Restore on a new phone
- Future multi-device sync

Current status:

Coming soon feature listed in Plus. Real cloud storage, account login, account deletion, and sync are not implemented yet.

### Locked Premium Cards

In Insights, free users see locked cards for:

- Ovulation confidence
- Doctor report

The current release keeps these cards in a coming soon state.

Purpose:

This communicates upgrade value without blocking core tracking.

## Free vs Premium Table

| Feature | Free Release | Plus Roadmap |
| --- | --- | --- |
| Cycle dashboard | Yes | Yes |
| Period logging | Yes | Yes |
| Symptoms and mood | Yes | Yes |
| Cervical mucus | Yes | Yes |
| BBT logging | Yes | Yes |
| Ovulation test logging | Yes | Yes |
| Pregnancy test logging | Yes | Yes |
| Intercourse logging | Yes | Yes |
| Cycle calendar | Yes | Yes |
| Basic fertile window estimate | Yes | Yes |
| Basic TTC care prompts | Yes | Yes |
| BMI category | Yes | Yes |
| PIN lock | Yes | Yes |
| Face ID / biometrics | Yes | Yes |
| Local data deletion | Yes | Yes |
| Advanced ovulation confidence | Coming soon preview | Planned |
| Doctor PDF report | Coming soon preview | Planned |
| Smart reminder suite | Coming soon preview | Planned |
| Cloud backup | Coming soon preview | Planned |
| Restore purchases | Not available | Planned after billing |
| Real payments | No | Not yet |

## Suggested App Store Description Split

### Free App Description

Track your cycle, period, fertile window, ovulation estimates, symptoms, mood, BBT, cervical mucus, ovulation tests, pregnancy tests, and daily notes. Protect private data with PIN and Face ID or biometric unlock on supported devices.

### Future Plus Description

Fertility Tracker Plus unlocks advanced trying-to-conceive insights, smart reminders, doctor-ready reports, and backup features.

Use this wording only after real subscriptions are implemented and approved.

## Store Disclosure Notes

### Apple

If real subscriptions are added:

- Configure Apple In-App Purchases.
- Add subscription products in App Store Connect.
- Add restore purchase support.
- Add subscription terms and pricing.
- Update screenshots and app description.
- Ensure the app does not imply medical diagnosis or guaranteed pregnancy outcomes.

### Google Play

If real subscriptions are added:

- Configure Google Play Billing.
- Add subscription products in Play Console.
- Update Data safety if cloud backup, analytics, ads, or account systems are added.
- Add subscription disclosure and cancellation information.
- Test through internal testing before production.

## Features Not Yet Production-Ready

The following are future concepts and need engineering work before being sold:

- Real Apple/Google subscription billing
- RevenueCat or direct billing integration
- Push notification scheduling
- PDF doctor report generation
- Cloud backup
- Account login
- Account deletion
- Multi-device sync
- Production-grade fertility scoring

## Recommended Release Strategy

### Version 1.0 Free Launch

Launch with:

- Cycle tracking
- Logging
- Calendar
- Insights
- TTC care prompts
- BMI category
- PIN and Face ID / biometric lock
- Local data storage
- Clear local data

Goal:

Get store approval and user feedback with a trustworthy free health app.

### Version 1.1 Premium Roadmap

Add:

- Plus screen
- Locked premium cards
- Coming soon messaging

Goal:

Validate premium positioning without charging yet.

### Version 1.2 Paid Plus

Add:

- Apple In-App Purchases
- Google Play Billing
- Restore purchases
- Subscription state persistence
- Store-approved subscription language

Goal:

Start charging for premium features.

### Version 1.3 Premium Utility

Add:

- PDF reports
- Smart reminders
- More advanced insights

Goal:

Make Plus feel worth paying for.
