import React from 'react';
import { ScreenName } from '../../types';
import AppBar from '../UI/AppBar';
import BottomNav from '../UI/BottomNav';

interface MobileLayoutProps {
  children: React.ReactNode;
  title: string;
  currentScreen: ScreenName;
  onNavigate: (screen: ScreenName) => void;
  actions?: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  title,
  currentScreen,
  onNavigate,
  actions
}) => {
  const isTabScreen =
    currentScreen === ScreenName.HOME ||
    currentScreen === ScreenName.SETTINGS ||
    currentScreen === ScreenName.HISTORY ||
    currentScreen === ScreenName.PROFILE;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">


      {!isTabScreen && (
        <AppBar
          title={title}
          actions={actions}
        />
      )}

      <main
        className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth no-scrollbar"
        style={{
          paddingBottom: 'calc(var(--nav-bar-height, 0px) + 130px)',
          paddingTop: isTabScreen ? 'calc(env(safe-area-inset-top, 24px) + 16px)' : undefined
        }}
      >
        {children}
      </main>

      <BottomNav currentScreen={currentScreen} onNavigate={onNavigate} />
    </div>
  );
};

export default MobileLayout;