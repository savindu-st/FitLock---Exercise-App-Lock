import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ScreenName, AppItem, HistoryItem, ExerciseType } from './types';
import { saveApps, loadApps, saveHistory, loadHistory, isCameraPermissionAsked, setCameraPermissionAsked, loadTheme, ThemePreference, isOnboardingCompleted, setOnboardingCompleted } from './utils/storage';
import { prefetchIcons } from './utils/iconCache';
import MobileLayout from './components/Layout/MobileLayout';
import HomeScreen from './components/Screens/HomeScreen';
import LockScreen from './components/Screens/LockScreen';
import ProfileScreen from './components/Screens/ProfileScreen';
import AppLockSettingsScreen from './components/Screens/AppLockSettingsScreen';
import HistoryScreen from './components/Screens/HistoryScreen';
import LegalScreen from './components/Screens/LegalScreen';
import OnboardingScreen from './components/Screens/OnboardingScreen';
import CameraPermissionScreen from './components/Screens/CameraPermissionScreen';
import PermissionsScreen from './components/Screens/PermissionsScreen';
import { Settings, CheckCircle } from 'lucide-react';
import { registerPlugin } from '@capacitor/core';

interface InstalledAppsPlugin {
  getApps(): Promise<{ apps: Array<{ name: string; packageName: string; icon?: string }> }>;
  getAppIcon(options: { packageName: string }): Promise<{ icon: string }>;
  getAppIcons(options: { packageNames: string[] }): Promise<{ icons: Record<string, string> }>;
}

interface PermissionsPluginInterface {
    checkOverlayPermission(): Promise<{ granted: boolean }>;
    checkUsageAccessPermission(): Promise<{ granted: boolean }>;
    checkCameraPermission(): Promise<{ granted: boolean }>;
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
const PermissionsNative = registerPlugin<PermissionsPluginInterface>('PermissionsPlugin');
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { useSubscription } from './components/Context/SubscriptionContext';
import { AdMob, BannerAdSize, BannerAdPosition, BannerAdPluginEvents, AdmobConsentStatus } from '@capacitor-community/admob';

const App: React.FC = () => {
  const { isPremium } = useSubscription();
  const [adInitialized, setAdInitialized] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<ScreenName>(
    !isOnboardingCompleted() ? ScreenName.ONBOARDING : (isCameraPermissionAsked() ? ScreenName.HOME : ScreenName.CAMERA_PERMISSION)
  );
  const [apps, setApps] = useState<AppItem[]>([]);
  const [targetApp, setTargetApp] = useState<AppItem | null>(null);
  const [pendingLockApp, setPendingLockApp] = useState<AppItem | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory());
  const [cameraGranted, setCameraGranted] = useState<boolean | null>(null);
  const [allPermissionsGranted, setAllPermissionsGranted] = useState<boolean | null>(null);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [previousScreen, setPreviousScreen] = useState<ScreenName>(ScreenName.HOME);
  const [backPressCount, setBackPressCount] = useState(0);
  const [theme, setTheme] = useState<ThemePreference>(() => loadTheme());

  const currentScreenRef = useRef(currentScreen);
  const targetAppRef = useRef(targetApp);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (currentTheme: ThemePreference) => {
      if (currentTheme === 'dark') {
        root.classList.add('dark');
      } else if (currentTheme === 'light') {
        root.classList.remove('dark');
      } else {
        // system
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };
    
    applyTheme(theme);

    // Listen for system changes if system theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        if (e.matches) root.classList.add('dark');
        else root.classList.remove('dark');
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  useEffect(() => {
    currentScreenRef.current = currentScreen;
  }, [currentScreen]);

  // Monitor native permission statuses globally
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const [overlay, usage, camera] = await Promise.all([
          PermissionsNative.checkOverlayPermission(),
          PermissionsNative.checkUsageAccessPermission(),
          PermissionsNative.checkCameraPermission()
        ]);
        setAllPermissionsGranted(overlay.granted && usage.granted && camera.granted);
      } catch (err) {
        console.warn('Failed to check native permissions:', err);
      }
    };
    checkPermissions();

    const sub = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) checkPermissions();
    });

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkPermissions();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => { 
      sub.then(s => s.remove()); 
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // AdMob initialization
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const initAdMob = async () => {
        try {
          // Check/Request tracking authorization
          await AdMob.trackingAuthorizationStatus();
          
          await AdMob.initialize({
            tagForChildDirectedTreatment: false,
          });
          
          console.log('[FitLock] AdMob SDK Initialized');

          // Request consent information (UMP SDK)
          try {
            const consentInfo = await AdMob.requestConsentInfo();

            // Show consent form if required
            if (consentInfo.isConsentFormAvailable && consentInfo.status === AdmobConsentStatus.REQUIRED) {
              await AdMob.showConsentForm();
            }

            console.log('[FitLock] AdMob Consent Status:', consentInfo.status);
          } catch (consentErr) {
            console.warn('[FitLock] AdMob Consent Error (non-fatal, ads will still load):', consentErr);
          }

          setAdInitialized(true);
        } catch (err) {
          console.error('[FitLock] AdMob Init Error:', err);
          // Still attempt to show ads even if init partially failed
          setAdInitialized(true);
        }
      };
      
      initAdMob();

      // Add listeners for debugging
      const loadedSub = AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
        console.log('[FitLock] AdMob: Banner Loaded');
      });

      const failedSub = AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (info) => {
        console.warn('[FitLock] AdMob: Banner Failed to Load', info);
      });

      const openedSub = AdMob.addListener(BannerAdPluginEvents.Opened, () => {
        console.log('[FitLock] AdMob: Banner Opened');
      });

      const closedSub = AdMob.addListener(BannerAdPluginEvents.Closed, () => {
        console.log('[FitLock] AdMob: Banner Closed');
      });

      return () => {
        loadedSub.then(sub => sub.remove());
        failedSub.then(sub => sub.remove());
        openedSub.then(sub => sub.remove());
        closedSub.then(sub => sub.remove());
      };
    }
  }, []);

  // AdMob Banner setup
  const isFullScreen = currentScreen === ScreenName.CAMERA_PERMISSION || 
                       currentScreen === ScreenName.ONBOARDING ||
                       currentScreen === ScreenName.APP_CONTENT;

  // Track banner state to prevent duplicate requests and improve resilience
  const adRequestPendingRef = useRef(false);
  const bannerExistsRef = useRef(false);
  const currentAdMarginRef = useRef<number | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !adInitialized) return;
    
    let mounted = true;

    const setupAds = async () => {
      if (isPremium || isFullScreen) {
        try {
          if (bannerExistsRef.current) {
            await AdMob.hideBanner();
            console.log('[FitLock] AdMob: Banner Hidden');
          }
        } catch (e) { }
        return;
      }

      // Determine if we are in development mode
      const isDev = import.meta.env.DEV;
      const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
      const PROD_BANNER_ID = 'ca-app-pub-8224368007922953/5157443584';
      const activeAdId = isDev ? TEST_BANNER_ID : PROD_BANNER_ID;
      
      const desiredMargin = currentScreen === ScreenName.LOCK_CHALLENGE ? 0 : 110;

      // If we already have a banner
      if (bannerExistsRef.current) {
        if (currentAdMarginRef.current !== desiredMargin) {
          // Margin changed, we must recreate the banner
          console.log('[FitLock] AdMob: Margin changed, recreating banner');
          try { await AdMob.removeBanner(); } catch (_) { }
          bannerExistsRef.current = false;
        } else {
          // Margin is the same, just resume it
          try {
            await AdMob.resumeBanner();
            console.log('[FitLock] AdMob: Banner Resumed');
            return;
          } catch (e) {
            console.warn('[FitLock] AdMob: Resume failed, will recreate banner', e);
            try { await AdMob.removeBanner(); } catch (_) { }
            bannerExistsRef.current = false;
          }
        }
      }

      if (!mounted || adRequestPendingRef.current) return;

      try {
        adRequestPendingRef.current = true;
        
        console.log('[FitLock] Attempting to create adaptive banner with adId:', activeAdId, 'margin:', desiredMargin, 'isTesting:', isDev);
        await AdMob.showBanner({
          adId: activeAdId, 
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: desiredMargin, 
          isTesting: isDev
        });
        
        bannerExistsRef.current = true;
        currentAdMarginRef.current = desiredMargin;
        console.log('[FitLock] AdMob: Banner Created Successfully');
      } catch (err) {
        console.warn('[FitLock] AdMob Show Error:', err);
      } finally {
        adRequestPendingRef.current = false;
      }
    };

    setupAds();

    // Re-trigger ad setup when app returns from background
    const appStateSub = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive && mounted) {
        console.log('[FitLock] App Foregrounded: Checking Ads...');
        setupAds();
      }
    });

    return () => {
      mounted = false;
      appStateSub.then(s => s.remove());
    };
  }, [isPremium, isFullScreen, adInitialized]);

  useEffect(() => {
    targetAppRef.current = targetApp;
  }, [targetApp]);

  useEffect(() => {
    async function configurePurchases() {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

      const platform = Capacitor.getPlatform();

      if (platform === 'ios') {
        await Purchases.configure({ apiKey: import.meta.env.VITE_REVENUECAT_IOS_KEY || "" }); 
      } else if (platform === 'android') {
        await Purchases.configure({ apiKey: import.meta.env.VITE_REVENUECAT_ANDROID_KEY || "" });
      }
    }
    configurePurchases();
  }, []);

  // Fetch real apps and merge with saved lock settings
  useEffect(() => {
    const fetchApps = async () => {
      const savedApps = loadApps() || [];
      
      if (savedApps.length > 0) {
        setApps(savedApps);
        setIsLoadingApps(false);
      } else {
        setIsLoadingApps(true);
      }

      try {
        const response = await InstalledApps.getApps() as any;
        const applications = response?.apps || [];

        let mergedApps: AppItem[] = applications.map((app: any) => {
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

        mergedApps = mergedApps.filter(app => {
          const pkg = app.packageName.toLowerCase();
          const appName = app.name.toLowerCase().trim();
          return !(
            pkg.includes('dialer') || 
            pkg.includes('settings') || 
            pkg.includes('phone') || 
            pkg.includes('contacts') || 
            pkg.includes('systemui') ||
            pkg.includes('telecom') ||
            pkg.includes('incallui') ||
            appName === 'call' ||
            appName === 'phone' ||
            appName === 'settings'
          );
        });

        mergedApps.sort((a, b) => a.name.localeCompare(b.name));

        setApps(mergedApps);
        setIsLoadingApps(false);

        const packageNames = mergedApps.map(a => a.packageName);
        prefetchIcons(packageNames).catch(err =>
          console.warn('Icon prefetch error:', err)
        );
      } catch (err) {
        console.error('Failed to fetch installed apps:', err);
        if (savedApps.length === 0) {
          setApps(loadApps() || []);
        }
      } finally {
        setIsLoadingApps(false);
      }
    };

    fetchApps();
  }, []);

  useEffect(() => { saveApps(apps); }, [apps]);
  useEffect(() => { saveHistory(history); }, [history]);

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

  useEffect(() => {
    const startMonitoring = async () => {
      try {
        await AppLockService.startService();
        console.log('[FitLock] App monitor service started');
      } catch (err) {
        console.warn('[FitLock] Failed to start monitor service:', err);
      }
    };
    startMonitoring();
  }, []);

  useEffect(() => {
    const preloadPoseModel = async () => {
      try {
        if (!(window as any).Pose) {
          await new Promise<void>((resolve) => {
            const check = setInterval(() => {
              if ((window as any).Pose) {
                clearInterval(check);
                resolve();
              }
            }, 200);
            setTimeout(() => { clearInterval(check); resolve(); }, 10000);
          });
        }
        if (!(window as any).Pose) return;

        console.log('[FitLock] Preloading Pose model...');
        const warmupPose = new (window as any).Pose({
          locateFile: (file: string) => `/mediapipe/${file}`,
        });
        warmupPose.setOptions({
          modelComplexity: 0,
          smoothLandmarks: false,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        await warmupPose.initialize();
        warmupPose.close();
        console.log('[FitLock] Pose model preloaded and cached.');
      } catch (err) {
        console.warn('[FitLock] Pose preload failed (non-critical):', err);
      }
    };
    preloadPoseModel();
  }, []);

  useEffect(() => {
    const checkPendingChallenge = async () => {
      try {
        const result = await AppLockService.getPendingChallenge();
        if (result.hasChallenge && result.action === 'lock_challenge') {
          setTargetApp({
            id: result.locked_package || '',
            name: result.locked_app_name || 'App',
            packageName: result.locked_package || '',
            icon: 'DEEP_LINK', 
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

    checkPendingChallenge();

    const sub = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) checkPendingChallenge();
    });

    return () => { sub.then(s => s.remove()); };
  }, []);

  useEffect(() => {
    const backButtonSub = CapacitorApp.addListener('backButton', () => {
      const screen = currentScreenRef.current;

      if (screen === ScreenName.HOME) {
        setBackPressCount(prevCount => {
          const newCount = prevCount + 1;
          if (newCount >= 2) {
            CapacitorApp.exitApp();
            return 0;
          }
          setTimeout(() => setBackPressCount(0), 2000);
          return newCount;
        });
      } else if (screen === ScreenName.LOCK_CHALLENGE) {
        const tgtApp = targetAppRef.current;
        if (tgtApp && tgtApp.icon === 'DEEP_LINK') {
          AppLockService.exitToApp({ packageName: '' }).catch(console.warn);
        } else {
          setTargetApp(null);
          setCurrentScreen(ScreenName.HOME);
        }
      } else if (screen === ScreenName.CAMERA_PERMISSION) {
      } else if (screen === ScreenName.LEGAL_INFO) {
        setCurrentScreen(ScreenName.PROFILE);
      } else {
        setCurrentScreen(ScreenName.HOME);
      }
    });

    return () => { backButtonSub.then(s => s.remove()); };
  }, []);

  useEffect(() => {
    const checkInitialPermission = async () => {
      let isGranted = false;

      try {
        if ('permissions' in navigator) {
          const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
          if (result.state === 'granted') isGranted = true;

          result.onchange = () => {
            const newState = result.state === 'granted';
            setCameraGranted(newState);
            if (newState) setCameraPermissionAsked();
          };
        }
      } catch (err) {
        console.warn('Permissions API check failed:', err);
      }

      try {
        if (!isGranted && 'mediaDevices' in navigator && 'enumerateDevices' in navigator.mediaDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasLabel = devices.some(device => device.kind === 'videoinput' && device.label);
          if (hasLabel) isGranted = true;
        }
      } catch (err) {
        console.warn('enumerateDevices check failed:', err);
      }

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
    if (cameraGranted === true) return true;

    try {
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (result.state === 'granted') return true;
      }

      if ('mediaDevices' in navigator && 'enumerateDevices' in navigator.mediaDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (devices.some(device => device.kind === 'videoinput' && device.label)) return true;
      }

      return isCameraPermissionAsked();
    } catch {
      return isCameraPermissionAsked();
    }
  };

  const handleAppClick = useCallback(async (app: AppItem) => {
    if (app.isLocked) {
      const hasCamera = cameraGranted ?? (await checkCameraPermission());
      if (!hasCamera) {
        setPendingLockApp(app);
        setCurrentScreen(ScreenName.CAMERA_PERMISSION);
      } else {
        setTargetApp(app);
        setCurrentScreen(ScreenName.LOCK_CHALLENGE);
      }
    } else {
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

        AppLockService.addTempUnlock({ packageName: prevTarget.packageName })
          .then(() => {
            return AppLockService.exitToApp({ packageName: prevTarget.packageName });
          })
          .catch(err => console.warn('Failed to add temp unlock or exit:', err));
      }
      return null;
    });
    setCurrentScreen(ScreenName.HOME);
  }, []);

  const handleCancelLock = useCallback(() => {
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
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 z-10">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Loading apps...</p>
            </div>
          );
        }
        return <HomeScreen 
          apps={apps} 
          onAppClick={handleAppClick} 
          allPermissionsGranted={allPermissionsGranted}
          onRequirePermissions={() => {
            setPreviousScreen(ScreenName.HOME);
            setCurrentScreen(ScreenName.PERMISSIONS);
          }}
        />;

      case ScreenName.SETTINGS:
        if (isLoadingApps) {
          return (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 z-10">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Scanning system apps...</p>
            </div>
          );
        }
        return <AppLockSettingsScreen 
          apps={apps} 
          onUpdateApp={handleUpdateApp} 
          allPermissionsGranted={allPermissionsGranted}
          onRequirePermissions={() => {
            setPreviousScreen(ScreenName.SETTINGS);
            setCurrentScreen(ScreenName.PERMISSIONS);
          }} 
        />;

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
        return <ProfileScreen 
          onNavigate={(screen) => {
            setPreviousScreen(ScreenName.PROFILE);
            setCurrentScreen(screen);
          }}
          currentTheme={theme}
          onThemeChange={setTheme}
        />;

      case ScreenName.LEGAL_INFO:
        return <LegalScreen onBack={() => setCurrentScreen(ScreenName.PROFILE)} />;

      case ScreenName.CAMERA_PERMISSION:
        return <CameraPermissionScreen onPermissionGranted={handleCameraPermissionDone} onSkip={handleCameraPermissionDone} />;

      case ScreenName.PERMISSIONS:
        return <PermissionsScreen onBack={() => setCurrentScreen(previousScreen)} />;

      default:
        return <HomeScreen 
          apps={apps} 
          onAppClick={handleAppClick} 
          allPermissionsGranted={allPermissionsGranted}
          onRequirePermissions={() => {
            setPreviousScreen(ScreenName.HOME);
            setCurrentScreen(ScreenName.PERMISSIONS);
          }}
        />;
    }
  };

  if (currentScreen === ScreenName.CAMERA_PERMISSION) {
    return <CameraPermissionScreen onPermissionGranted={handleCameraPermissionDone} onSkip={handleCameraPermissionDone} />;
  }

  if (currentScreen === ScreenName.ONBOARDING) {
    return (
      <OnboardingScreen 
        onComplete={() => {
          setOnboardingCompleted();
          setCurrentScreen(isCameraPermissionAsked() ? ScreenName.HOME : ScreenName.CAMERA_PERMISSION);
        }} 
      />
    );
  }

  if (currentScreen === ScreenName.LOCK_CHALLENGE && targetApp) {
    return (
      <div className="min-h-screen w-full bg-black relative flex flex-col">
        <LockScreen app={targetApp} onUnlock={handleUnlock} onCancel={handleCancelLock} />
      </div>
    );
  }

  const getTitle = () => {
    switch (currentScreen) {
      case ScreenName.SETTINGS: return "App Lock";
      case ScreenName.HISTORY: return "Workout History";
      case ScreenName.PROFILE: return "Profile";
      case ScreenName.LEGAL_INFO: return "Legal Information";
      case ScreenName.PERMISSIONS: return "Permissions";
      default: return "Home";
    }
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-950 flex flex-col">
      <div className="w-full min-h-screen bg-white dark:bg-gray-950 relative flex flex-col">
        <MobileLayout
          title={getTitle()}
          currentScreen={currentScreen}
          onNavigate={(screen) => {
            if (screen === ScreenName.HOME) handleBackToHome();
            else setCurrentScreen(screen);
          }}
        >
          {renderContent()}
        </MobileLayout>
      </div>
    </div>
  );
};

export default App;
