# Privacy Policy for FitLock - Exercise App Lock

**Effective Date:** March 29, 2026

Thank you for choosing to be part of our community at FitLock. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy or our practices with regards to your personal information, please contact us.

When you use our mobile application (the "App"), you trust us with your privacy. We take your privacy very seriously. In this privacy policy, we describe our privacy practices. We seek to explain to you in the clearest way possible what information we collect, how we use it, and what rights you have in relation to it.

## 1. Information We Collect and How We Use It

We have designed FitLock to be privacy-first. **All core processing, including exercise detection and app usage monitoring, occurs locally on your device.** 

We request certain permissions on your device to enable the core functionality of FitLock:

### Camera Permission (`android.permission.CAMERA`)
- **Why we need it:** We require camera access to track your movements for the exercise-based unlock mechanism (e.g., counting jumping jacks).
- **How we handle your data:** The camera feed is processed entirely locally on your device in real-time. **We do not record, store, or transmit any pictures or videos.** No personal imagery leaves your device.

### Usage Access (`android.permission.PACKAGE_USAGE_STATS`) & Query All Packages (`android.permission.QUERY_ALL_PACKAGES`)
- **Why we need them:** To know which apps are installed on your device so you can select which ones to lock, and to detect when a locked application has been launched.
- **How we handle your data:** The list of installed apps and your app usage history is accessed only locally within the App to trigger the lock screen. This data is **never** sent to external servers or shared with any third party.

### Display Over Other Apps (`android.permission.SYSTEM_ALERT_WINDOW`)
- **Why we need it:** We use this permission to securely display the FitLock screen over any locked application you attempt to open, ensuring the app blocker functions seamlessly.

### Background Services & Notifications (`android.permission.FOREGROUND_SERVICE`, `android.permission.FOREGROUND_SERVICE_SPECIAL_USE`, `android.permission.POST_NOTIFICATIONS`)
- **Why we need them:** To monitor the launch of locked apps reliably, FitLock runs an optimized background service using specialized use cases. Android requires us to show a persistent notification for this service to ensure transparency that the App is running.

### Advertising ID (`android.permission.AD_ID`)
- **Why we need it:** We use Google AdMob to display advertisements within the App, which helps support our development. Android requires the AD_ID permission to provide relevant ads and analyze ad performance.
- **How we handle your data:** The Advertising ID is a unique, user-resettable identifier provided by Google Play services. It is used exclusively by our advertising partners (Google AdMob) for ad serving and frequency capping. You can reset or opt out of personalized ads at any time through your Android device settings.

## 2. In-App Purchases and Subscription Data

FitLock uses a third-party service, **RevenueCat**, to manage premium subscriptions and in-app purchases.

- **Information processed by RevenueCat:** When you make a purchase, RevenueCat processes an anonymous App User ID linked to your device, purchase history, and receipt data from the Google Play Store. This is strictly required to validate your subscription, restore purchases, and ensure premium features are unlocked.
- **Device Specificity:** Premium subscriptions are tied to the device ID obtained from the Google Play Store and are device-specific.
- Please refer to the [RevenueCat Privacy Policy](https://www.revenuecat.com/privacy) for more details on how they handle information related to purchases.

## 3. Data Sharing and Third-Party Services

FitLock uses the following third-party services:

- **RevenueCat:** To process and manage premium subscriptions and in-app purchases, as detailed above.
- **Google AdMob:** To serve advertisements within the App. AdMob may collect and process information such as your Advertising ID, device information, and ad interactions to provide relevant advertising. Please refer to the [Google Privacy Policy](https://policies.google.com/privacy) for more details.

Except for the services listed above, **FitLock does not integrate with third-party analytics or crash reporting SDKs.** We do not sell, rent, or trade any personal user information to third parties.

## 4. Security of Your Information

Because nearly all processing is handled locally on your device, the risk of data compromise in transit is virtually eliminated. For the subscription checking process (handled by RevenueCat), communication is encrypted over secure HTTPS connections.

## 5. Changes to This Privacy Policy

We may update our Privacy Policy from time to time. The updated version will be indicated by an updated "Effective Date" at the top of this document. We encourage you to review this privacy policy frequently to be informed of how we are protecting your information.

## 6. Contact Us

If you have questions or comments about this policy, or if you wish to exercise any of your rights regarding your data, please contact us at [Insert Support Email/Contact Form Link].
