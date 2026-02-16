import React from 'react';
import { AppItem } from '../../types';
import { Minus, Plus, Smartphone, Facebook, Instagram, Twitter, MessageCircle, Chrome, Camera, Mail, Map } from 'lucide-react';

interface AppLockSettingsScreenProps {
  apps: AppItem[];
  onUpdateApp: (appId: string, updates: Partial<AppItem>) => void;
}

const AppLockSettingsScreen: React.FC<AppLockSettingsScreenProps> = ({ apps, onUpdateApp }) => {

  // Helper to get icon based on name (matching HomeScreen logic)
  const getIcon = (name: string) => {
    switch (name) {
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
    <div className="p-4 space-y-4 pb-24">
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-2">
        <h3 className="font-bold text-blue-800 text-sm mb-1">Manage Protected Apps</h3>
        <p className="text-xs text-blue-600">
          Enable the lock switch to protect an app. Set the number of reps required to unlock it.
        </p>
      </div>

      <div className="space-y-3">
        {apps.map(app => (
          <div key={app.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className={`w-10 h-10 rounded-xl ${app.iconColor} flex items-center justify-center text-white shadow-sm`}>
                    {getIcon(app.name)}
                 </div>
                 <div>
                   <h4 className="font-bold text-gray-800 text-sm">{app.name}</h4>
                   <p className="text-xs text-gray-400">{app.isLocked ? 'Protected' : 'Unlocked'}</p>
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
    </div>
  );
};

export default AppLockSettingsScreen;