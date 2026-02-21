import React, { useState, useEffect } from 'react';
import { AppItem } from '../../types';
import { Minus, Plus, Smartphone, Facebook, Instagram, Twitter, MessageCircle, Chrome, Camera, Mail, Map, ShieldCheck, ShieldAlert, ChevronRight } from 'lucide-react';

interface AppLockSettingsScreenProps {
  apps: AppItem[];
  onUpdateApp: (appId: string, updates: Partial<AppItem>) => void;
  onRequestCamera: () => void;
  cameraGranted: boolean | null;
}

const AppLockSettingsScreen: React.FC<AppLockSettingsScreenProps> = ({ apps, onUpdateApp, onRequestCamera, cameraGranted }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter apps based on search query
  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.packageName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to get icon based on name (matching HomeScreen logic)
  const getIcon = (app: AppItem) => {
    if (app.icon) {
      return <img src={app.icon} alt={app.name} className="w-full h-full object-cover" />;
    }
    switch (app.name) {
      case 'Facebook': return <Facebook size={20} className="text-white" />;
      case 'Instagram': return <Instagram size={20} className="text-white" />;
      case 'WhatsApp': return <MessageCircle size={20} className="text-white" />;
      case 'Twitter': return <Twitter size={20} className="text-white" />;
      case 'Chrome': return <Chrome size={20} className="text-white" />;
      case 'Camera': return <Camera size={20} className="text-white" />;
      case 'Gmail': return <Mail size={20} className="text-white" />;
      case 'Maps': return <Map size={20} className="text-white" />;
      default: return <Smartphone size={20} className="text-white" />;
    }
  };

  return (
    <div className="p-4 space-y-4 pb-4">
      {/* Camera Access Section - Only show if not granted */}
      {cameraGranted !== true && (
        <div className={`p-4 rounded-xl border ${cameraGranted === false
          ? 'bg-amber-50 border-amber-100'
          : 'bg-gray-50 border-gray-100'
          }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100">
                <ShieldAlert size={20} className="text-amber-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Camera Access</h4>
                <p className="text-xs text-amber-600">
                  {cameraGranted === null ? 'Checking...' : 'Not granted'}
                </p>
              </div>
            </div>
            <button
              onClick={onRequestCamera}
              className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 active:scale-95 transition-all"
            >
              <span>Grant</span>
              <ChevronRight size={14} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Camera is required for exercise detection to unlock protected apps.
          </p>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
        <h3 className="font-bold text-blue-800 text-sm mb-1">Manage Protected Apps</h3>
        <p className="text-xs text-blue-600">
          Enable the lock switch to protect an app. Set the number of reps required to unlock it.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search apps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>

      <div>
        {filteredApps.length > 0 ? (
          <div className="space-y-3">
            {filteredApps.map(app => (
              <div key={app.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${app.icon ? 'bg-transparent' : app.iconColor} flex items-center justify-center text-white shadow-sm overflow-hidden`}>
                      {getIcon(app)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">{app.name}</h4>
                      <p className="text-xs text-gray-400 truncate max-w-[150px]">{app.packageName}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onUpdateApp(app.id, { isLocked: !app.isLocked })}
                    className={`w-12 h-7 rounded-full transition-colors relative ${app.isLocked ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${app.isLocked ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                {app.isLocked && (
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg mt-1 animate-in slide-in-from-top-2 duration-200">
                    <span className="text-xs font-medium text-gray-500 ml-1">Required Reps:</span>
                    <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-200">
                      <button
                        onClick={() => onUpdateApp(app.id, { requiredReps: Math.max(1, app.requiredReps - 1) })}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-blue-600 active:scale-90 transition-all"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-4 text-center text-sm font-bold text-gray-800">{app.requiredReps}</span>
                      <button
                        onClick={() => onUpdateApp(app.id, { requiredReps: Math.min(20, app.requiredReps + 1) })}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-blue-600 active:scale-90 transition-all"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Smartphone size={32} className="text-gray-300" />
            </div>
            <h4 className="font-bold text-gray-800 mb-1">No apps found</h4>
            <p className="text-xs text-gray-400">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppLockSettingsScreen;