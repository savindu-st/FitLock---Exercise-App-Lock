import React from 'react';
import { User, Mail, Shield, Smartphone, LogOut, ChevronRight } from 'lucide-react';

const ProfileScreen: React.FC = () => {
  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-white p-6 flex flex-col items-center border-b border-gray-100">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 border-4 border-white shadow-lg">
          <User size={40} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Alex Johnson</h2>
        <p className="text-gray-500 text-sm">alex.johnson@example.com</p>
      </div>

      {/* Settings List */}
      <div className="mt-6 px-4 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <SettingItem icon={User} label="Edit Profile" />
          <div className="h-px bg-gray-50 mx-4" />
          <SettingItem icon={Mail} label="Notifications" badge="3" />
          <div className="h-px bg-gray-50 mx-4" />
          <SettingItem icon={Shield} label="Privacy & Security" />
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
}

const SettingItem: React.FC<SettingItemProps> = ({ icon: Icon, label, badge, danger }) => {
  return (
    <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors active:bg-gray-100">
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