# Goal Description

The goal is to prevent the `AppMonitorService` from being killed by Android's battery optimization system, which causes locked apps to open without challenges when launched from outside the FitLock app. We will achieve this by adding a "Disable Battery Optimization" permission request in the app, and creating a `BootCompletedReceiver` so the service restarts automatically when the phone is rebooted.

## Proposed Changes

### Android Native Changes

#### [MODIFY] AndroidManifest.xml
- Add `<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />`
- Add `<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />`
- Add `<receiver>` tag for `BootCompletedReceiver` that listens to `android.intent.action.BOOT_COMPLETED` and `android.intent.action.MY_PACKAGE_REPLACED`.

#### [NEW] BootCompletedReceiver.java
- Create a new BroadcastReceiver that starts the `AppMonitorService` as a Foreground Service when it receives the boot intent.

#### [MODIFY] PermissionsPlugin.java
- Add `checkBatteryOptimizationPermission` method using `PowerManager.isIgnoringBatteryOptimizations`.
- Add `requestBatteryOptimizationPermission` using `Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`.

---

### React Native Changes

#### [MODIFY] PermissionsScreen.tsx
- Add a new required permission to the `PermissionsPluginInterface` (`checkBatteryOptimizationPermission`, `requestBatteryOptimizationPermission`).
- Add a new "Battery Optimization" permission card in the UI so users can easily grant this permission alongside the others.

## User Review Required

> [!WARNING]
> Please review the plan. Note that some Chinese manufacturers (like Xiaomi, Samsung) have their own secondary "Auto-Start" settings in addition to the standard Android Battery Optimization settings. Implementing the standard Battery Optimization exemption (as planned here) will fix the issue on most stock Android phones (like Pixels) and will significantly improve reliability on other brands. However, on strict custom ROMs, the user may still need to manually enable "Auto Start".

## Verification Plan

### Automated Tests
- Build the Android app (`./gradlew assembleDebug` or similar).

### Manual Verification
- Install the app and go to the Permissions screen.
- Verify the new "Battery Optimization" permission appears.
- Tap "Grant" and verify it opens the system prompt to disable battery optimizations.
- Verify that after rebooting the device (or simulating it via adb), the "FitLock Active" notification appears automatically.
