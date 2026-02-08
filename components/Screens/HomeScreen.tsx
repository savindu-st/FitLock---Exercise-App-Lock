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
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Apps</h2>
        <p className="text-gray-500 text-sm">Select an app to open</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {apps.map((app) => (
          <button
            key={app.id}
            onClick={() => onAppClick(app)}
            className="flex flex-col items-center gap-2 group relative"
          >
            <div 
              className={`
                w-16 h-16 rounded-2xl flex items-center justify-center shadow-md transition-transform active:scale-95 group-hover:scale-105
                ${app.iconColor} relative overflow-hidden
              `}
            >
              {getIcon(app.name)}
              
              {/* Lock Overlay */}
              {app.isLocked && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                  <Lock size={20} className="text-white" />
                </div>
              )}
            </div>
            <span className="text-xs font-medium text-gray-700">{app.name}</span>
          </button>
        ))}
      </div>

      <div className="mt-12 bg-blue-50 p-4 rounded-xl border border-blue-100">
        <h3 className="font-bold text-blue-800 mb-1">FitLock Active</h3>
        <p className="text-xs text-blue-600">
          Selected apps are protected by FitLock AI. Perform pushups to unlock access.
        </p>
      </div>
    </div>
  );
};

export default HomeScreen;