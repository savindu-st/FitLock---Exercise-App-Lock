import React, { useState } from 'react';
import { User, Shield, Smartphone, ChevronRight, Moon, Sun, Scale } from 'lucide-react';
import { loadProfile, UserProfile, ThemePreference, saveTheme } from '../../utils/storage';
import { ScreenName } from '../../types';
import { useSubscription } from '../Context/SubscriptionContext';

interface ProfileScreenProps {
  onNavigate?: (screen: ScreenName) => void;
  currentTheme?: ThemePreference;
  onThemeChange?: (theme: ThemePreference) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigate, currentTheme = 'system', onThemeChange }) => {
  const [profile] = useState<UserProfile>(() => loadProfile());
  const { isPremium, refreshInfo } = useSubscription();

  const isDark = currentTheme === 'dark' || (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleToggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    if (onThemeChange) onThemeChange(newTheme);
    saveTheme(newTheme);
  };

  return (
    <div className="pb-24 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 p-6 flex flex-col items-center border-b border-gray-100 dark:border-gray-800 relative">
        <button 
          onClick={handleToggleTheme}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 border-4 border-white dark:border-gray-900 shadow-lg">
          <User size={40} />
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white">User</h2>
      </div>

      {/* Settings List */}
      <div className="mt-6 px-4 space-y-4">

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <SettingItem
            icon={Scale}
            label="Legal Information"
            onClick={() => onNavigate?.(ScreenName.LEGAL_INFO)}
          />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <SettingItem icon={Smartphone} label="Permissions" onClick={() => onNavigate?.(ScreenName.PERMISSIONS)} />
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">
          Version 1.0.0 (Build 2024.10.27)
        </p>
      </div>
    </div>
  );
};

interface SettingItemProps {
  icon: React.ElementType;
  label: string;
  badge?: string;
  danger?: boolean;
  onClick?: () => void;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon: Icon, label, badge, danger, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors active:bg-gray-100 dark:active:bg-gray-700"
    >
      <div className="flex items-center gap-3">
        <div className={`
          p-2 rounded-lg 
          ${danger ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}
        `}>
          <Icon size={18} />
        </div>
        <span className={`font-medium text-sm ${danger ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
        <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
      </div>
    </button>
  );
};

export default ProfileScreen;