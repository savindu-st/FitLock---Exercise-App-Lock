import React from 'react';
import { ScreenName } from '../../types';
import AppBar from '../UI/AppBar';
import BottomNav from '../UI/BottomNav';
import { Menu } from 'lucide-react';

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
  return (
    <div className="flex flex-col h-full bg-gray-50">


      <AppBar
        title={title}
        leading={<Menu size={24} className="text-white" />}
        actions={actions}
      />

      <main
        className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth no-scrollbar"
        style={{ paddingBottom: 'calc(var(--nav-bar-height, 0px) + 80px)' }}
      >
        {children}
      </main>

      <BottomNav currentScreen={currentScreen} onNavigate={onNavigate} />
    </div>
  );
};

export default MobileLayout;