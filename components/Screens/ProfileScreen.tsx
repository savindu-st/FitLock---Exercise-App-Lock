import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Smartphone, LogOut, ChevronRight, Pencil, Check, X } from 'lucide-react';
import { loadProfile, saveProfile, UserProfile } from '../../utils/storage';
import { ScreenName } from '../../types';
import { useSubscription } from '../Context/SubscriptionContext';
import { RevenueCatUI, PAYWALL_RESULT } from '@revenuecat/purchases-capacitor-ui';

interface ProfileScreenProps {
  onNavigate?: (screen: ScreenName) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigate }) => {
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const { isPremium, refreshInfo } = useSubscription();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editEmail, setEditEmail] = useState(profile.email);

  const handleSave = () => {
    const updated = { name: editName.trim() || 'User', email: editEmail.trim() };
    setProfile(updated);
    saveProfile(updated);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(profile.name);
    setEditEmail(profile.email);
    setIsEditing(false);
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-white p-6 flex flex-col items-center border-b border-gray-100 relative">
        {/* Edit Toggle */}
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600 transition-colors"
            aria-label="Edit profile"
          >
            <Pencil size={16} />
          </button>
        ) : (
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={handleCancel}
              className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-500 transition-colors"
              aria-label="Cancel editing"
            >
              <X size={16} />
            </button>
            <button
              onClick={handleSave}
              className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
              aria-label="Save profile"
            >
              <Check size={16} />
            </button>
          </div>
        )}

        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 border-4 border-white shadow-lg">
          <User size={40} />
        </div>

        {isEditing ? (
          <div className="w-full max-w-xs space-y-3">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Your name"
              className="w-full text-center text-xl font-bold text-gray-900 border-b-2 border-blue-400 bg-transparent outline-none py-1 placeholder-gray-300"
              autoFocus
            />
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="w-full text-center text-sm text-gray-500 border-b-2 border-blue-400 bg-transparent outline-none py-1 placeholder-gray-300"
            />
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>

          </>
        )}
      </div>

      {/* Settings List */}
      <div className="mt-6 px-4 space-y-4">
        {/* RevenueCat Integration */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-200 overflow-hidden">
          {isPremium ? (
            <SettingItem
              icon={Check}
              label="Manage Subscription"
              badge="Pro"
              onClick={async () => {
                try {
                  await RevenueCatUI.presentCustomerCenter();
                } catch (e) {
                  console.error("Failed to present customer center", e);
                }
              }}
            />
          ) : (
            <SettingItem
              icon={Smartphone}
              label="Go Premium"
              onClick={async () => {
                try {
                  const { result } = await RevenueCatUI.presentPaywall();
                  if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
                    await refreshInfo(); // Refresh state after confirmed purchase or restore
                  }
                } catch (e) {
                  console.error("Failed to present paywall", e);
                }
              }}
            />
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <SettingItem icon={User} label="Edit Profile" onClick={() => setIsEditing(true)} />
          <div className="h-px bg-gray-50 mx-4" />
          <SettingItem icon={Mail} label="Notice" onClick={() => onNavigate?.(ScreenName.NOTICE)} />
          <div className="h-px bg-gray-50 mx-4" />
          <SettingItem
            icon={Shield}
            label="Privacy & Security"
            onClick={() => onNavigate?.(ScreenName.PRIVACY_POLICY)}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <SettingItem icon={Smartphone} label="App Settings" />
          <div className="h-px bg-gray-50 mx-4" />
          <SettingItem icon={LogOut} label="Log Out" danger />
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