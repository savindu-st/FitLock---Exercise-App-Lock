import React from 'react';
import { ScreenName, NavItem } from '../../types';
import { Home, Shield, User } from 'lucide-react';

interface BottomNavProps {
  currentScreen: ScreenName;
  onNavigate: (screen: ScreenName) => void;
}

const NAV_ITEMS: NavItem[] = [
  { id: ScreenName.HOME, label: 'Launcher', icon: Home },
  { id: ScreenName.SETTINGS, label: 'App Lock', icon: Shield },
  { id: ScreenName.PROFILE, label: 'Profile', icon: User },
];

const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  return (
    <nav className="h-20 bg-white border-t border-gray-200 flex items-center justify-around px-2 pb-2 shrink-0 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {NAV_ITEMS.map((item) => {
        const isActive = currentScreen === item.id;
        const Icon = item.icon;
        
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="flex-1 flex flex-col items-center justify-center gap-1 h-full pt-2"
          >
            <div 
              className={`
                p-1.5 rounded-full transition-all duration-300
                ${isActive ? 'bg-blue-100 text-blue-700 -translate-y-1' : 'text-gray-500 hover:bg-gray-50'}
              `}
            >
              <Icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2}
                fill={isActive ? "currentColor" : "none"}
                className={isActive ? "fill-blue-700/20" : ""}
              />
            </div>
            <span className={`text-xs font-medium transition-colors ${isActive ? 'text-blue-700' : 'text-gray-500'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;