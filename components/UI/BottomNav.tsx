import React from 'react';
import { ScreenName, NavItem } from '../../types';
import { Home, Shield, User, Clock } from 'lucide-react';

interface BottomNavProps {
  currentScreen: ScreenName;
  onNavigate: (screen: ScreenName) => void;
}

const NAV_ITEMS: NavItem[] = [
  { id: ScreenName.HOME, label: 'Launcher', icon: Home },
  { id: ScreenName.SETTINGS, label: 'App Lock', icon: Shield },
  { id: ScreenName.HISTORY, label: 'History', icon: Clock },
  { id: ScreenName.PROFILE, label: 'Profile', icon: User },
];

const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  return (
    <nav
      className="bg-white border-t border-gray-200 flex items-start justify-around px-2 pt-2 shrink-0 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
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
                ${isActive ? 'bg-blue-100 text-blue-600 scale-105' : 'text-gray-400'}
              `}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                fill={isActive ? "currentColor" : "none"}
                className={isActive ? "fill-blue-600/20" : ""}
              />
            </div>
            <span className={`text-[11px] font-medium transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;