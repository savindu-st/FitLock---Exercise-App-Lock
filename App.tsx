import React, { useState } from 'react';
import { ScreenName, AppItem } from './types';
import MobileLayout from './components/Layout/MobileLayout';
import HomeScreen from './components/Screens/HomeScreen';
import LockScreen from './components/Screens/LockScreen';
import ProfileScreen from './components/Screens/ProfileScreen';
import { Settings, CheckCircle } from 'lucide-react';

const INITIAL_APPS: AppItem[] = [
  { id: '1', name: 'Facebook', iconColor: 'bg-blue-600', isLocked: true, requiredReps: 5 },
  { id: '2', name: 'Instagram', iconColor: 'bg-pink-600', isLocked: true, requiredReps: 5 },
  { id: '3', name: 'WhatsApp', iconColor: 'bg-green-500', isLocked: false, requiredReps: 0 },
  { id: '4', name: 'Gallery', iconColor: 'bg-purple-500', isLocked: true, requiredReps: 3 },
  { id: '5', name: 'Twitter', iconColor: 'bg-sky-400', isLocked: false, requiredReps: 0 },
  { id: '6', name: 'Chrome', iconColor: 'bg-yellow-500', isLocked: false, requiredReps: 0 },
  { id: '7', name: 'Gmail', iconColor: 'bg-red-500', isLocked: true, requiredReps: 3 },
  { id: '8', name: 'Maps', iconColor: 'bg-green-600', isLocked: false, requiredReps: 0 },
  { id: '9', name: 'Camera', iconColor: 'bg-gray-500', isLocked: false, requiredReps: 0 },
];

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>(ScreenName.HOME);
  const [apps, setApps] = useState<AppItem[]>(INITIAL_APPS);
  const [targetApp, setTargetApp] = useState<AppItem | null>(null);

  const handleAppClick = (app: AppItem) => {
    if (app.isLocked) {
      setTargetApp(app);
      setCurrentScreen(ScreenName.LOCK_CHALLENGE);
    } else {
      setTargetApp(app);
      setCurrentScreen(ScreenName.APP_CONTENT);
    }
  };

  const handleUnlock = () => {
    setCurrentScreen(ScreenName.APP_CONTENT);
  };

  const handleCancelLock = () => {
    setTargetApp(null);
    setCurrentScreen(ScreenName.HOME);
  };

  const handleBackToHome = () => {
    setTargetApp(null);
    setCurrentScreen(ScreenName.HOME);
  };

  const renderContent = () => {
    switch (currentScreen) {
      case ScreenName.HOME:
        return <HomeScreen apps={apps} onAppClick={handleAppClick} />;
      
      case ScreenName.LOCK_CHALLENGE:
        if (!targetApp) return null;
        // LockScreen takes over the full view, so we render it specially
        // But here it's inside the layout. We might want to hide the layout bars for lock screen?
        // Let's handle layout visibility in the return statement.
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
        return <ProfileScreen />;
        
      default:
        return <HomeScreen apps={apps} onAppClick={handleAppClick} />;
    }
  };

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

  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <div className="w-full h-[100dvh] sm:h-[800px] sm:w-[400px] sm:rounded-3xl sm:border-8 sm:border-gray-900 bg-white overflow-hidden shadow-2xl relative flex flex-col">
        <MobileLayout 
          title="FitLock Launcher"
          currentScreen={currentScreen}
          onNavigate={(screen) => {
             if (screen === ScreenName.HOME) handleBackToHome();
             else setCurrentScreen(screen);
          }}
          actions={
            <button className="p-2 text-white/90 hover:text-white transition-colors">
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