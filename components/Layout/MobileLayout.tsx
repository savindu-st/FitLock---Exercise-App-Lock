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
      {/* Status Bar Mock (for desktop visuals) */}
      <div className="h-0 sm:h-7 bg-blue-800 w-full shrink-0" />
      
      <AppBar 
        title={title} 
        leading={<Menu size={24} className="text-white" />}
        actions={actions}
      />
      
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth no-scrollbar pb-20">
        {children}
      </main>

      <BottomNav currentScreen={currentScreen} onNavigate={onNavigate} />
    </div>
  );
};

export default MobileLayout;