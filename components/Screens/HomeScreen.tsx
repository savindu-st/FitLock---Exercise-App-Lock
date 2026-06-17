import React from 'react';
import { AppItem } from '../../types';
import { Lock } from 'lucide-react';
import AppIcon from '../UI/AppIcon';

interface HomeScreenProps {
  apps: AppItem[];
  onAppClick: (app: AppItem) => void;
  allPermissionsGranted?: boolean | null;
  onRequirePermissions?: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ apps, onAppClick, allPermissionsGranted, onRequirePermissions }) => {
  return (
    <div className="px-4 pt-4 pb-2">

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-y-6 gap-x-4">
        {apps.map((app) => (
          <HomeScreenItem key={app.id} app={app} onClick={onAppClick} />
        ))}
      </div>

      {allPermissionsGranted === false ? (
        <div className="mt-8 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/30 shadow-sm flex flex-col items-start gap-2">
          <div>
            <h3 className="font-bold text-amber-800 dark:text-amber-400 text-sm mb-0.5">Permissions Missing</h3>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
              FitLock needs certain permissions to lock apps and detect exercises.
            </p>
          </div>
          <button 
            onClick={onRequirePermissions}
            className="mt-1 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold active:bg-amber-700 transition-colors w-full"
          >
            Grant Permissions
          </button>
        </div>
      ) : (
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-4 rounded-2xl border border-blue-100/60 dark:border-blue-800/30 shadow-sm">
          <h3 className="font-bold text-blue-800 dark:text-blue-300 text-sm mb-0.5">FitLock Active</h3>
          <p className="text-xs text-blue-600/80 dark:text-blue-300/80">
            Protected apps require exercise to unlock.
          </p>
        </div>
      )}
    </div>
  );
};

interface HomeScreenItemProps {
  app: AppItem;
  onClick: (app: AppItem) => void;
}

const HomeScreenItem: React.FC<HomeScreenItemProps> = React.memo(({ app, onClick }) => {
  return (
    <button
      onClick={() => onClick(app)}
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
      <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300 truncate w-full text-center leading-tight">{app.name}</span>
    </button>
  );
});

export default React.memo(HomeScreen);