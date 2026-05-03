import React, { useState, useEffect, useMemo } from 'react';
import { AppItem } from '../../types';
import { Minus, Plus, Smartphone, ShieldCheck, ShieldAlert, ChevronRight } from 'lucide-react';
import AppIcon from '../UI/AppIcon';

import { registerPlugin } from '@capacitor/core';

interface PermissionsPluginInterface {
    checkOverlayPermission(): Promise<{ granted: boolean }>;
    checkUsageAccessPermission(): Promise<{ granted: boolean }>;
    checkCameraPermission(): Promise<{ granted: boolean }>;
}

const PermissionsNative = registerPlugin<PermissionsPluginInterface>('PermissionsPlugin');

interface AppLockSettingsScreenProps {
  apps: AppItem[];
  onUpdateApp: (appId: string, updates: Partial<AppItem>) => void;
  onRequirePermissions: () => void;
  allPermissionsGranted?: boolean | null;
}

const AppLockSettingsScreen: React.FC<AppLockSettingsScreenProps> = ({ apps, onUpdateApp, onRequirePermissions, allPermissionsGranted }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter apps based on search query - memoized to prevent re-filtering on every render
  const filteredApps = useMemo(() => apps.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.packageName.toLowerCase().includes(searchQuery.toLowerCase())
  ), [apps, searchQuery]);

  return (
    <div className="p-4 space-y-4 pb-4 max-w-3xl mx-auto w-full">

      {allPermissionsGranted === false && (
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800/30 shadow-sm flex flex-col items-start gap-2">
          <div className="flex items-start gap-3 w-full">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100 dark:bg-amber-800/50 shrink-0">
              <ShieldAlert size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm">Action Required</h4>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5 leading-relaxed">
                App locking is paused until required permissions are granted.
              </p>
            </div>
            <button
              onClick={onRequirePermissions}
              className="flex items-center gap-1 px-3 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 active:scale-95 transition-all mt-1"
            >
              <span>Review</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
        <h3 className="font-bold text-blue-800 dark:text-blue-300 text-sm mb-1">Manage Protected Apps</h3>
        <p className="text-xs text-blue-600 dark:text-blue-400">
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
          className="w-full px-4 py-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
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
              <AppLockSettingsItem 
                key={app.id} 
                app={app} 
                onUpdateApp={onUpdateApp} 
                onRequirePermissions={onRequirePermissions} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Smartphone size={32} className="text-gray-300 dark:text-gray-600" />
            </div>
            <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-1">No apps found</h4>
            <p className="text-xs text-gray-400 dark:text-gray-500">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface AppLockSettingsItemProps {
  app: AppItem;
  onUpdateApp: (appId: string, updates: Partial<AppItem>) => void;
  onRequirePermissions: () => void;
}

const AppLockSettingsItem: React.FC<AppLockSettingsItemProps> = React.memo(({ app, onUpdateApp, onRequirePermissions }) => {
  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm overflow-hidden">
            <AppIcon app={app} iconSize={20} />
          </div>
          <div>
            <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm">{app.name}</h4>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[150px]">{app.packageName}</p>
          </div>
        </div>

        <button
          onClick={async () => {
            if (!app.isLocked) {
              try {
                const [overlay, usage, camera] = await Promise.all([
                  PermissionsNative.checkOverlayPermission(),
                  PermissionsNative.checkUsageAccessPermission(),
                  PermissionsNative.checkCameraPermission()
                ]);
                
                if (!overlay.granted || !usage.granted || !camera.granted) {
                  onRequirePermissions();
                  return;
                }
              } catch (err) {
                console.warn("Failed to check permissions", err);
                onRequirePermissions();
                return;
              }
            }
            onUpdateApp(app.id, { isLocked: !app.isLocked });
          }}
          className={`w-12 h-7 rounded-full transition-colors relative ${app.isLocked ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
          <div className={`absolute top-1 left-1 w-5 h-5 bg-white dark:bg-gray-100 rounded-full shadow-sm transition-transform ${app.isLocked ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      {app.isLocked && (
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg mt-1 animate-in slide-in-from-top-2 duration-200">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1">Required Reps:</span>
          <div className="flex items-center gap-3 bg-white dark:bg-gray-900 px-2 py-1 rounded-md shadow-sm border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => onUpdateApp(app.id, { requiredReps: Math.max(1, app.requiredReps - 1) })}
              className="w-6 h-6 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 active:scale-90 transition-all"
            >
              <Minus size={14} />
            </button>
            <span className="w-4 text-center text-sm font-bold text-gray-800 dark:text-gray-100">{app.requiredReps}</span>
            <button
              onClick={() => onUpdateApp(app.id, { requiredReps: Math.min(20, app.requiredReps + 1) })}
              className="w-6 h-6 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 active:scale-90 transition-all"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default React.memo(AppLockSettingsScreen);