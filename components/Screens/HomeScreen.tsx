import React from 'react';
import { AppItem } from '../../types';
import { Lock, Smartphone, Facebook, Instagram, Twitter, MessageCircle, Chrome, Camera, Mail, Map } from 'lucide-react';

interface HomeScreenProps {
  apps: AppItem[];
  onAppClick: (app: AppItem) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ apps, onAppClick }) => {
  // Helper to get icon based on name (simulated)
  const getIcon = (name: string) => {
    switch (name) {
      case 'Facebook': return <Facebook size={32} className="text-white" />;
      case 'Instagram': return <Instagram size={32} className="text-white" />;
      case 'WhatsApp': return <MessageCircle size={32} className="text-white" />;
      case 'Twitter': return <Twitter size={32} className="text-white" />;
      case 'Chrome': return <Chrome size={32} className="text-white" />;
      case 'Camera': return <Camera size={32} className="text-white" />;
      case 'Gmail': return <Mail size={32} className="text-white" />;
      case 'Maps': return <Map size={32} className="text-white" />;
      default: return <Smartphone size={32} className="text-white" />;
    }
  };

  return (
    <div className="px-4 pt-4 pb-2">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800">My Apps</h2>
        <p className="text-gray-400 text-xs">Select an app to open</p>
      </div>

      <div className="grid grid-cols-3 gap-y-5 gap-x-4">
        {apps.map((app) => (
          <button
            key={app.id}
            onClick={() => onAppClick(app)}
            className="flex flex-col items-center group active:scale-95 transition-transform focus:outline-none"
          >
            <div className={`relative w-[60px] h-[60px] rounded-[18px] ${app.icon ? 'bg-transparent' : app.iconColor} flex items-center justify-center mb-1.5 overflow-hidden`}>
              {app.icon ? (
                <img src={app.icon} alt={app.name} className="w-full h-full object-cover" />
              ) : (
                getIcon(app.name)
              )}
              {app.isLocked && (
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center backdrop-blur-[1px]">
                  <Lock size={18} className="text-white drop-shadow-md" />
                </div>
              )}
            </div>
            <span className="text-[11px] font-medium text-gray-600 truncate w-full text-center leading-tight">{app.name}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100/60">
        <h3 className="font-bold text-blue-700 text-sm mb-0.5">FitLock Active</h3>
        <p className="text-xs text-blue-500/80">
          Protected apps require exercise to unlock.
        </p>
      </div>
    </div>
  );
};

export default HomeScreen;