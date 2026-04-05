import React from 'react';
import { ScreenName, NavItem } from '../../types';
import { Home, Shield, User, Clock } from 'lucide-react';

interface BottomNavProps {
  currentScreen: ScreenName;
  onNavigate: (screen: ScreenName) => void;
}

const NAV_ITEMS: NavItem[] = [
  { id: ScreenName.HOME, label: 'Home', icon: Home },
  { id: ScreenName.SETTINGS, label: 'App Lock', icon: Shield },
  { id: ScreenName.HISTORY, label: 'History', icon: Clock },
  { id: ScreenName.PROFILE, label: 'Profile', icon: User },
];

const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-start justify-around px-2 pt-2 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-none"
      style={{ paddingBottom: 'var(--nav-bar-height, 0px)' }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = currentScreen === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-1 focus:outline-none active:opacity-70"
          >
            <div
              className={`
                p-2 rounded-2xl transition-all duration-300
                ${isActive ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 scale-105' : 'text-gray-400 dark:text-gray-500'}
              `}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                fill={isActive ? "currentColor" : "none"}
                className={isActive ? "fill-blue-600/20 dark:fill-blue-400/20" : ""}
              />
            </div>
            <span className={`text-[11px] font-medium transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;