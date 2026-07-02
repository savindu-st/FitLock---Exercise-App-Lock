import React, { useState, useMemo } from 'react';
import { 
  User, Shield, Smartphone, ChevronRight, Moon, Sun, Scale, 
  Dumbbell, Flame, Lock, Volume2, MessageSquare, Edit2, Check
} from 'lucide-react';
import { loadProfile, saveProfile, UserProfile, ThemePreference, saveTheme, loadHistory } from '../../utils/storage';
import { ScreenName } from '../../types';
import { useSubscription } from '../Context/SubscriptionContext';

interface ProfileScreenProps {
  onNavigate?: (screen: ScreenName) => void;
  currentTheme?: ThemePreference;
  onThemeChange?: (theme: ThemePreference) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigate, currentTheme = 'system', onThemeChange }) => {
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const { isPremium, refreshInfo } = useSubscription();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(profile.name);

  // Real stats calculation
  const history = useMemo(() => loadHistory(), []);
  
  const totalReps = history.reduce((sum, item) => sum + item.reps, 0).toLocaleString();
  
  const appCounts = history.reduce((acc, item) => {
    acc[item.appName] = (acc[item.appName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topDistraction = Object.entries(appCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
  const distractionsAvoided = history.length.toString();

  const streak = useMemo(() => {
     const days = [...new Set(history.map(item => new Date(item.timestamp).setHours(0,0,0,0)))].sort((a,b) => b - a);
     if (days.length === 0) return 0;
     const today = new Date().setHours(0,0,0,0);
     let currentStreak = 0;
     let expectedDate = today;
     
     if (days[0] === today) {
         currentStreak = 1;
         expectedDate -= 86400000;
         for (let i = 1; i < days.length; i++) {
             if (days[i] === expectedDate) {
                 currentStreak++;
                 expectedDate -= 86400000;
             } else {
                 break;
             }
         }
     } else if (days[0] === today - 86400000) {
         currentStreak = 1;
         expectedDate = days[0] - 86400000;
         for (let i = 1; i < days.length; i++) {
             if (days[i] === expectedDate) {
                 currentStreak++;
                 expectedDate -= 86400000;
             } else {
                 break;
             }
         }
     }
     return currentStreak;
  }, [history]);

  const handleNameSave = () => {
    if (editNameValue.trim()) {
      const newProfile = { ...profile, name: editNameValue.trim() };
      setProfile(newProfile);
      saveProfile(newProfile);
    }
    setIsEditingName(false);
  };

  const handleEmojiChange = () => {
    const newEmoji = window.prompt("Enter a new emoji or short text for your avatar:", profile.avatar || "💪");
    if (newEmoji && newEmoji.trim()) {
      const newProfile = { ...profile, avatar: newEmoji.trim().substring(0, 2) };
      setProfile(newProfile);
      saveProfile(newProfile);
    }
  };

  const handleToggleSound = () => {
    const newProfile = { ...profile, soundEnabled: !(profile.soundEnabled ?? true) };
    setProfile(newProfile);
    saveProfile(newProfile);
  };

  const isDark = currentTheme === 'dark' || (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleToggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    if (onThemeChange) onThemeChange(newTheme);
    saveTheme(newTheme);
  };

  return (
    <div className="pb-28 max-w-3xl mx-auto w-full min-h-screen bg-gray-50 dark:bg-[#0A0F1C] font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      
      {/* Header */}
      <div className="relative p-6 pt-12 flex flex-col items-center">
        <button 
          onClick={handleToggleTheme}
          className="absolute top-6 right-6 p-2.5 rounded-full bg-white dark:bg-[#151B2B] shadow-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-800"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="relative group cursor-pointer mb-4" onClick={handleEmojiChange}>
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-full flex items-center justify-center text-4xl shadow-lg border-4 border-white dark:border-[#151B2B] transition-transform group-hover:scale-105">
            {profile.avatar || '💪'}
          </div>
          <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full border-2 border-white dark:border-[#151B2B]">
            <Edit2 size={12} />
          </div>
        </div>

        <div className="flex items-center gap-2 h-10">
          {isEditingName ? (
            <>
              <input 
                type="text"
                autoFocus
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                onBlur={handleNameSave}
                className="text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-blue-500 outline-none text-center w-48"
              />
              <button onMouseDown={(e) => { e.preventDefault(); handleNameSave(); }} className="text-green-500 hover:text-green-600 transition-colors p-1">
                <Check size={20} />
              </button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h2>
              <button onClick={() => setIsEditingName(true)} className="text-gray-400 hover:text-blue-500 transition-colors p-1">
                <Edit2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="px-5 space-y-8">
        
        {/* Milestones Section (2x2 Grid) */}
        <section>
          <div className="grid grid-cols-2 gap-4">
            <MetricCard icon={Dumbbell} label="Total Reps" value={totalReps} iconColor="text-blue-500" />
            <MetricCard icon={Flame} label="Current Streak" value={`${streak} Day${streak === 1 ? '' : 's'}`} iconColor="text-orange-500" />
            <MetricCard icon={Shield} label="Distractions Avoided" value={`${distractionsAvoided} App${distractionsAvoided === '1' ? '' : 's'}`} iconColor="text-green-500" />
            <MetricCard icon={Lock} label="Top Distraction" value={topDistraction} iconColor="text-red-500" />
          </div>
        </section>

        {/* Settings Hub Section */}
        <section className="space-y-6">
          <SettingsGroup title="PREFERENCES">
            <SettingItem
              icon={Volume2}
              label="Sound & Haptics"
              onClick={handleToggleSound}
              trailing={
                <div 
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${(profile.soundEnabled ?? true) ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${(profile.soundEnabled ?? true) ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              }
            />
          </SettingsGroup>



          <SettingsGroup title="ABOUT & LEGAL">
            <SettingItem 
              icon={Smartphone} 
              label="Permissions" 
              onClick={() => onNavigate?.(ScreenName.PERMISSIONS)} 
            />
            <SettingItem
              icon={Scale}
              label="Legal Information"
              onClick={() => onNavigate?.(ScreenName.LEGAL_INFO)}
            />
          </SettingsGroup>
        </section>

        {/* Footer Section */}
        <div className="pt-4 pb-8 flex justify-center">
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 font-medium tracking-wide">
            Version 1.0.9 (Build 2026.05.21)
          </p>
        </div>
        
      </div>
    </div>
  );
};

/* Components */

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  iconColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon: Icon, label, value, iconColor }) => (
  <div className="bg-white dark:bg-[#151B2B] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/50 flex flex-col justify-center gap-2 hover:shadow-md transition-shadow">
    <div className={`w-8 h-8 rounded-full bg-gray-50 dark:bg-[#0A0F1C] flex items-center justify-center ${iconColor}`}>
      <Icon size={16} />
    </div>
    <div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{value}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">{label}</p>
    </div>
  </div>
);

interface SettingsGroupProps {
  title: string;
  children: React.ReactNode;
}

const SettingsGroup: React.FC<SettingsGroupProps> = ({ title, children }) => (
  <div className="space-y-3">
    <h3 className="text-[12px] font-bold text-gray-400 dark:text-gray-500 tracking-wider px-2">
      {title}
    </h3>
    <div className="bg-white dark:bg-[#151B2B] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/50 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800/50">
      {children}
    </div>
  </div>
);

interface SettingItemProps {
  icon: React.ElementType;
  label: string;
  trailing?: React.ReactNode;
  danger?: boolean;
  onClick?: () => void;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon: Icon, label, trailing, danger, onClick }) => {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`w-full flex items-center justify-between p-4 bg-white dark:bg-[#151B2B] hover:bg-gray-50 dark:hover:bg-[#1C2333] transition-colors active:bg-gray-100 dark:active:bg-[#232A3B] ${!onClick && !trailing ? 'cursor-default' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className={`
          p-2 rounded-xl 
          ${danger ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-gray-50 dark:bg-[#0A0F1C] text-gray-600 dark:text-gray-300'}
        `}>
          <Icon size={18} />
        </div>
        <span className={`font-medium text-[15px] tracking-tight ${danger ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {trailing ? trailing : <ChevronRight size={18} className="text-gray-300 dark:text-gray-600" />}
      </div>
    </button>
  );
};

export default ProfileScreen;