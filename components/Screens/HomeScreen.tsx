import React from 'react';
import { AppItem } from '../../types';
import { Lock } from 'lucide-react';
import AppIcon from '../UI/AppIcon';

interface HomeScreenProps {
  apps: AppItem[];
  onAppClick: (app: AppItem) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ apps, onAppClick }) => {
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
            <div className={`relative w-[60px] h-[60px] rounded-[18px] flex items-center justify-center mb-1.5 overflow-hidden`}>
              <AppIcon app={app} />
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