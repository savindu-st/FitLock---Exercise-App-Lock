# FitLock - Exercise App Lock

FitLock is an innovative productivity and fitness application that locks your distracting apps and requires you to perform physical exercises to unlock them. Built using React and Capacitor, it uses on-device AI (MediaPipe Pose detection) to verify your exercises.

## Features

- **App Locking**: Select which apps on your device you want to lock.
- **Exercise to Unlock**: Perform physical exercises (like squats or push-ups) to regain access to your locked apps.
- **On-Device AI**: Uses MediaPipe for real-time, privacy-preserving pose detection without sending video data to the cloud.
- **Workout History**: Keep track of the exercises you've completed.
- **Monetization**: Includes RevenueCat for premium subscriptions and AdMob for free user ads.
- **Dark Mode Support**: Full support for system-level light and dark themes.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide React
- **Mobile Runtime**: Capacitor (Android)
- **AI/ML**: MediaPipe Pose
- **Monetization**: RevenueCat (In-App Purchases), AdMob

## Prerequisites

- Node.js (v18+)
- Android Studio (for Android deployment)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Environment Variables:**
   Create a `.env` or `.env.local` file with required keys (RevenueCat API keys, AdMob IDs).

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Build the web assets:**
   ```bash
   npm run build
   ```

5. **Sync with Capacitor and open Android Studio:**
   ```bash
   npx cap sync
   npx cap open android
   ```

## Privacy & Permissions

FitLock requires the following permissions to function correctly:
- **Camera Access**: Strictly used for on-device pose detection.
- **Usage Access**: Required to detect when a locked app is opened.
- **Overlay Permission**: Required to draw the lock screen over other apps.

No personal video data is recorded or sent to external servers.
