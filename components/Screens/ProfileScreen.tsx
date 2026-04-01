import React, { useState } from 'react';
import { User, Mail, Shield, Smartphone, ChevronRight, Check } from 'lucide-react';
import { loadProfile, UserProfile } from '../../utils/storage';
import { ScreenName } from '../../types';
import { useSubscription } from '../Context/SubscriptionContext';

interface ProfileScreenProps {
  onNavigate?: (screen: ScreenName) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigate }) => {
  const [profile] = useState<UserProfile>(() => loadProfile());
  const { isPremium, refreshInfo } = useSubscription();

  return (
    <div className="pb-24 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="bg-white p-6 flex flex-col items-center border-b border-gray-100 relative">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 border-4 border-white shadow-lg">
          <User size={40} />
        </div>

        <h2 className="text-xl font-bold text-gray-900">User</h2>
      </div>

      {/* Settings List */}
      <div className="mt-6 px-4 space-y-4">


        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <SettingItem icon={Mail} label="Notice" onClick={() => onNavigate?.(ScreenName.NOTICE)} />
          <div className="h-px bg-gray-50 mx-4" />
          <SettingItem
            icon={Shield}
            label="Privacy & Security"
            onClick={() => onNavigate?.(ScreenName.PRIVACY_POLICY)}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <SettingItem icon={Smartphone} label="Permissions" onClick={() => onNavigate?.(ScreenName.PERMISSIONS)} />
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
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
      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors active:bg-gray-100"
    >
      <div className="flex items-center gap-3">
        <div className={`
          p-2 rounded-lg 
          ${danger ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-600'}
        `}>
          <Icon size={18} />
        </div>
        <span className={`font-medium text-sm ${danger ? 'text-red-500' : 'text-gray-700'}`}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
        <ChevronRight size={16} className="text-gray-300" />
      </div>
    </button>
  );
};

export default ProfileScreen;