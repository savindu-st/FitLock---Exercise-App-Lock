import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ScreenName, AppItem, HistoryItem, ExerciseType } from './types';
import { saveApps, loadApps, saveHistory, loadHistory, isCameraPermissionAsked, setCameraPermissionAsked } from './utils/storage';
import MobileLayout from './components/Layout/MobileLayout';
import HomeScreen from './components/Screens/HomeScreen';
import LockScreen from './components/Screens/LockScreen';
import ProfileScreen from './components/Screens/ProfileScreen';
import AppLockSettingsScreen from './components/Screens/AppLockSettingsScreen';
import HistoryScreen from './components/Screens/HistoryScreen';
import PrivacyPolicyScreen from './components/Screens/PrivacyPolicyScreen';
import CameraPermissionScreen from './components/Screens/CameraPermissionScreen';
import PermissionsScreen from './components/Screens/PermissionsScreen';
import { Settings, CheckCircle } from 'lucide-react';
import { registerPlugin } from '@capacitor/core';

interface InstalledAppsPlugin {
  getApps(): Promise<{ apps: Array<{ name: string; packageName: string; icon: string }> }>;
}

interface AppLockServicePlugin {
  startService(): Promise<void>;
  stopService(): Promise<void>;
  isServiceRunning(): Promise<{ running: boolean }>;
  updateLockedApps(options: { apps: string }): Promise<void>;
  addTempUnlock(options: { packageName: string }): Promise<void>;
  clearTempUnlocks(): Promise<void>;
  getPendingChallenge(): Promise<{ hasChallenge: boolean, action?: string, locked_package?: string, locked_app_name?: string, required_reps?: number }>;
  exitToApp(options: { packageName: string }): Promise<void>;
}

const InstalledApps = registerPlugin<InstalledAppsPlugin>('InstalledApps');
const AppLockService = registerPlugin<AppLockServicePlugin>('AppLockService');
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { useSubscription } from './components/Context/SubscriptionContext';

const App: React.FC = () => {
  const { isPremium } = useSubscription();
  const [currentScreen, setCurrentScreen] = useState<ScreenName>(
    isCameraPermissionAsked() ? ScreenName.HOME : ScreenName.CAMERA_PERMISSION
  );
  const [apps, setApps] = useState<AppItem[]>([]);
  const [targetApp, setTargetApp] = useState<AppItem | null>(null);
  const [pendingLockApp, setPendingLockApp] = useState<AppItem | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory());
  const [cameraGranted, setCameraGranted] = useState<boolean | null>(null);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [previousScreen, setPreviousScreen] = useState<ScreenName>(ScreenName.HOME);
  const [backPressCount, setBackPressCount] = useState(0);

  const currentScreenRef = useRef(currentScreen);
  const targetAppRef = useRef(targetApp);

  useEffect(() => {
    currentScreenRef.current = currentScreen;
  }, [currentScreen]);

  useEffect(() => {
    targetAppRef.current = targetApp;
  }, [targetApp]);

  useEffect(() => {
    async function configurePurchases() {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

      const platform = Capacitor.getPlatform();

      if (platform === 'ios') {
        await Purchases.configure({ apiKey: "test_txIFCPMNfrJLsYEOgIRjWuwnHkd" });
      } else if (platform === 'android') {
        await Purchases.configure({ apiKey: "test_txIFCPMNfrJLsYEOgIRjWuwnHkd" });
      }
    }
    configurePurchases();
  }, []);

  // Fetch real apps and merge with saved lock settings
  useEffect(() => {
    const fetchApps = async () => {
      setIsLoadingApps(true);
      try {
        const savedApps = loadApps() || [];
        const response = await InstalledApps.getApps() as any;
        const applications = response?.apps || [];

        // Merge real apps with saved settings
        const mergedApps: AppItem[] = applications.map((app: any) => {
          const pkgName = app.packageName || '';
          const saved = savedApps.find((s: AppItem) => s.packageName === pkgName);
          return {
            id: pkgName,
            name: app.name || pkgName,
            packageName: pkgName,
            icon: app.icon || '',
            iconColor: saved?.iconColor || 'bg-blue-500',
            isLocked: saved?.isLocked || false,
            requiredReps: saved?.requiredReps || 5
          };
        });

        // Sort apps alphabetically by name
        mergedApps.sort((a, b) => a.name.localeCompare(b.name));

        setApps(mergedApps);
      } catch (err) {
        console.error('Failed to fetch installed apps:', err);
        // Fallback to saved apps if native plugin fails (e.g. in browser)
        setApps(loadApps() || []);
      } finally {
        setIsLoadingApps(false);
      }
    };

    fetchApps();
  }, []);

  // Auto-save apps and history to localStorage
  useEffect(() => { saveApps(apps); }, [apps]);
  useEffect(() => { saveHistory(history); }, [history]);

  // Sync locked apps to native SharedPreferences whenever apps change
  useEffect(() => {
    const syncLockedApps = async () => {
      try {
        const lockedApps = apps
          .filter(a => a.isLocked)
          .map(a => ({ packageName: a.packageName, name: a.name, requiredReps: a.requiredReps }));
        await AppLockService.updateLockedApps({ apps: JSON.stringify(lockedApps) });
      } catch (err) {
        console.warn('Failed to sync locked apps to native:', err);
      }
    };
    if (apps.length > 0) syncLockedApps();
  }, [apps]);

  // Auto-start monitoring service on launch
  useEffect(() => {
    const startMonitoring = async () => {
      try {
        await AppLockService.startService();
        console.log('[FitLock] App monitor service started');
      } catch (err) {
        console.warn('[FitLock] Failed to start monitor service:', err);
      }
    };
    // Small delay to ensure app is initialized
    const timer = setTimeout(startMonitoring, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Poll for deep-linked challenges from native
  useEffect(() => {
    const checkPendingChallenge = async () => {
      try {
        const result = await AppLockService.getPendingChallenge();
        if (result.hasChallenge && result.action === 'lock_challenge') {
          // A challenge was initiated natively via the lock overlay 
          setTargetApp({
            id: result.locked_package || '',
            name: result.locked_app_name || 'App',
            packageName: result.locked_package || '',
            icon: 'DEEP_LINK', // Use a specific marker to identify deep links
            iconColor: 'bg-blue-500',
            isLocked: true,
            requiredReps: result.required_reps || 5
          });
          setCurrentScreen(ScreenName.LOCK_CHALLENGE);
        }
      } catch (err) {
        console.warn('Failed to check pending challenge', err);
      }
    };

    // Check on mount
    checkPendingChallenge();

    // Check whenever app resumes
    const sub = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) checkPendingChallenge();
    });

    return () => { sub.then(s => s.remove()); };
  }, []);

  // Handle native Android back button
  useEffect(() => {
    const backButtonSub = CapacitorApp.addListener('backButton', () => {
      const screen = currentScreenRef.current;

      if (screen === ScreenName.HOME) {
        // Double press to exit if on Home
        setBackPressCount(prevCount => {
          const newCount = prevCount + 1;
          if (newCount >= 2) {
            CapacitorApp.exitApp();
            return 0;
          }
          // Reset count after 2 seconds
          setTimeout(() => setBackPressCount(0), 2000);
          return newCount;
        });
      } else if (screen === ScreenName.LOCK_CHALLENGE) {
        const tgtApp = targetAppRef.current;
        if (tgtApp && tgtApp.icon === 'DEEP_LINK') {
          // If we're deep-linked over an app, cancelling should dump us back to home, not FitLock Home
          AppLockService.exitToApp({ packageName: '' }).catch(console.warn);
        } else {
          setTargetApp(null);
          setCurrentScreen(ScreenName.HOME);
        }
      } else if (screen === ScreenName.CAMERA_PERMISSION) {
        // Do nothing to avoid bypassing
      } else if (screen === ScreenName.PRIVACY_POLICY) {
        setCurrentScreen(ScreenName.PROFILE);
      } else {
        // For Settings, History, Profile, etc.
        setCurrentScreen(ScreenName.HOME);
      }
    });

    return () => { backButtonSub.then(s => s.remove()); };
  }, []);

  // Initial permission check and skip onboarding if already granted
  useEffect(() => {
    const checkInitialPermission = async () => {
      let isGranted = false;

      // Layer 1: Permissions API
      try {
        if ('permissions' in navigator) {
          const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
          if (result.state === 'granted') isGranted = true;

          // Listen for permission changes
          result.onchange = () => {
            const newState = result.state === 'granted';
            setCameraGranted(newState);
            if (newState) setCameraPermissionAsked();
          };
        }
      } catch (err) {
        console.warn('Permissions API check failed:', err);
      }

      // Layer 2: Device Enumeration (more reliable in some WebViews)
      // If we have labels, we definitely have permission
      try {
        if (!isGranted && 'mediaDevices' in navigator && 'enumerateDevices' in navigator.mediaDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasLabel = devices.some(device => device.kind === 'videoinput' && device.label);
          if (hasLabel) isGranted = true;
        }
      } catch (err) {
        console.warn('enumerateDevices check failed:', err);
      }

      // If either check passed, or we previously asked and it was granted
      if (isGranted || isCameraPermissionAsked()) {
        setCameraGranted(true);
        if (!isCameraPermissionAsked()) setCameraPermissionAsked();
        setCurrentScreen(prev => prev === ScreenName.CAMERA_PERMISSION ? ScreenName.HOME : prev);
      } else {
        setCameraGranted(false);
      }
    };

    checkInitialPermission();
  }, []);

  const checkCameraPermission = async (): Promise<boolean> => {
    // Return early if we already have a confirmed granted state
    if (cameraGranted === true) return true;

    try {
      // 1. Check Permissions API
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (result.state === 'granted') return true;
      }

      // 2. Check enumerateDevices (if we have labels, we have permission)
      if ('mediaDevices' in navigator && 'enumerateDevices' in navigator.mediaDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (devices.some(device => device.kind === 'videoinput' && device.label)) return true;
      }

      // 3. Fallback to localStorage flag
      return isCameraPermissionAsked();
    } catch {
      return isCameraPermissionAsked();
    }
  };

  const handleAppClick = useCallback(async (app: AppItem) => {
    if (app.isLocked) {
      // Check camera permission before going to lock challenge
      // Use permissions API check first, then fallback to local state
      const hasCamera = cameraGranted ?? (await checkCameraPermission());
      if (!hasCamera) {
        // Camera not available — show permission screen, then go to lock after
        setPendingLockApp(app);
        setCurrentScreen(ScreenName.CAMERA_PERMISSION);
      } else {
        setTargetApp(app);
        setCurrentScreen(ScreenName.LOCK_CHALLENGE);
      }
    } else {
      // Launch the app directly via native plugin
      AppLockService.exitToApp({ packageName: app.packageName }).catch(err => console.warn('Failed to launch app:', err));
    }
  }, [cameraGranted]);

  const handleUpdateApp = useCallback((appId: string, updates: Partial<AppItem>) => {
    setApps(prevApps => prevApps.map(app =>
      app.id === appId ? { ...app, ...updates } : app
    ));
  }, []);

  const handleUnlock = useCallback((exerciseType: ExerciseType, reps: number) => {
    setTargetApp(prevTarget => {
      if (prevTarget) {
        const newItem: HistoryItem = {
          id: Date.now().toString(),
          appName: prevTarget.name,
          exerciseType: exerciseType,
          reps: reps,
          timestamp: Date.now()
        };
        setHistory(prev => [newItem, ...prev]);

        // Temporarily unlock the app in native service so it doesn't re-trigger
        AppLockService.addTempUnlock({ packageName: prevTarget.packageName })
          .then(() => {
            // Instantly launch the locked app and background FitLock
            return AppLockService.exitToApp({ packageName: prevTarget.packageName });
          })
          .catch(err => console.warn('Failed to add temp unlock or exit:', err));
      }
      return null;
    });
    // Immediately clear LockScreen so WebGL and Camera are released before going to background
    setCurrentScreen(ScreenName.HOME);
  }, []);

  const handleCancelLock = useCallback(() => {
    // If we're deep-linked over an app, cancelling should dump us back to home, not FitLock Home
    // We do this by passing empty packageName to just push FitLock to the background
    if (targetApp && targetApp.icon === 'DEEP_LINK') {
      AppLockService.exitToApp({ packageName: '' }).catch(console.warn);
    } else {
      setTargetApp(null);
      setCurrentScreen(ScreenName.HOME);
    }
  }, [targetApp]);

  const handleBackToHome = useCallback(() => {
    setTargetApp(null);
    setCurrentScreen(ScreenName.HOME);
  }, []);

  const handleCameraPermissionDone = useCallback(() => {
    setCameraPermissionAsked();
    setCameraGranted(true);
    // If there's a pending locked app, go directly to the lock challenge
    if (pendingLockApp) {
      setTargetApp(pendingLockApp);
      setPendingLockApp(null);
      setCurrentScreen(ScreenName.LOCK_CHALLENGE);
    } else {
      setCurrentScreen(ScreenName.HOME);
    }
  }, [pendingLockApp]);

  const handleRequestCameraFromSettings = useCallback(() => {
    setPendingLockApp(null);
    setCurrentScreen(ScreenName.CAMERA_PERMISSION);
  }, []);

  const renderContent = () => {
    switch (currentScreen) {
      case ScreenName.HOME:
        if (isLoadingApps) {
          return (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-gray-500 font-medium">Loading apps...</p>
            </div>
          );
        }
        return <HomeScreen apps={apps} onAppClick={handleAppClick} />;

      case ScreenName.SETTINGS:
        if (isLoadingApps) {
          return (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-gray-500 font-medium">Scanning system apps...</p>
            </div>
          );
        }
        return <AppLockSettingsScreen apps={apps} onUpdateApp={handleUpdateApp} onRequestCamera={handleRequestCameraFromSettings} cameraGranted={cameraGranted} />;

      case ScreenName.HISTORY:
        return <HistoryScreen history={history} />;

      case ScreenName.LOCK_CHALLENGE:
        if (!targetApp) return null;
        return <LockScreen app={targetApp} onUnlock={handleUnlock} onCancel={handleCancelLock} />;

      case ScreenName.APP_CONTENT:
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white">
            <div className={`w-24 h-24 rounded-3xl ${targetApp?.iconColor} flex items-center justify-center mb-6 shadow-xl`}>
              <CheckCircle size={48} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{targetApp?.name} Unlocked</h1>
            <p className="text-gray-500 mb-8">You have successfully completed the exercise challenge.</p>
            <button
              onClick={handleBackToHome}
              className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium active:scale-95 transition-transform"
            >
              Close App
            </button>
          </div>
        );

      case ScreenName.PROFILE:
        return <ProfileScreen onNavigate={(screen) => setCurrentScreen(screen)} />;

      case ScreenName.PRIVACY_POLICY:
        return <PrivacyPolicyScreen onBack={() => setCurrentScreen(ScreenName.PROFILE)} />;

      case ScreenName.CAMERA_PERMISSION:
        return <CameraPermissionScreen onPermissionGranted={handleCameraPermissionDone} onSkip={handleCameraPermissionDone} />;

      case ScreenName.PERMISSIONS:
        return <PermissionsScreen onBack={() => setCurrentScreen(previousScreen)} />;

      default:
        return <HomeScreen apps={apps} onAppClick={handleAppClick} />;
    }
  };

  // Camera Permission screen is full-screen, rendered outside the layout
  if (currentScreen === ScreenName.CAMERA_PERMISSION) {
    return <CameraPermissionScreen onPermissionGranted={handleCameraPermissionDone} onSkip={handleCameraPermissionDone} />;
  }

  // If we are in Lock Challenge, we want a Full Screen experience (no App Bar, No Bottom Nav)
  if (currentScreen === ScreenName.LOCK_CHALLENGE && targetApp) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="w-full h-[100dvh] sm:h-[800px] sm:w-[400px] sm:rounded-3xl sm:border-8 sm:border-gray-900 bg-black overflow-hidden shadow-2xl relative flex flex-col">
          <LockScreen app={targetApp} onUnlock={handleUnlock} onCancel={handleCancelLock} />
        </div>
      </div>
    );
  }

  // Determine title based on screen
  const getTitle = () => {
    switch (currentScreen) {
      case ScreenName.SETTINGS: return "App Lock Config";
      case ScreenName.HISTORY: return "Workout History";
      case ScreenName.PROFILE: return "Profile";
      case ScreenName.PRIVACY_POLICY: return "Privacy Policy";
      case ScreenName.PERMISSIONS: return "Permissions";
      default: return "FitLock Launcher";
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="w-full h-full sm:h-[800px] sm:w-[400px] sm:rounded-3xl sm:border-8 sm:border-gray-900 bg-white overflow-hidden shadow-2xl relative flex flex-col">
        <MobileLayout
          title={getTitle()}
          currentScreen={currentScreen}
          onNavigate={(screen) => {
            if (screen === ScreenName.HOME) handleBackToHome();
            else setCurrentScreen(screen);
          }}
          actions={
            <button
              className="p-2 text-white/90 hover:text-white transition-colors"
              onClick={() => {
                setPreviousScreen(currentScreen);
                setCurrentScreen(ScreenName.PERMISSIONS);
              }}
            >
              <Settings size={20} />
            </button>
          }
        >
          {renderContent()}
        </MobileLayout>
      </div>
    </div>
  );
};

export default App;