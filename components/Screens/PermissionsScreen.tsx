import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Layers, BarChart3, Camera, Bell, CheckCircle2, XCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { registerPlugin } from '@capacitor/core';

// ── Native Plugin Interface ────────────────────────────────────────

interface PermissionsPluginInterface {
    checkOverlayPermission(): Promise<{ granted: boolean }>;
    requestOverlayPermission(): Promise<void>;
    checkUsageAccessPermission(): Promise<{ granted: boolean }>;
    requestUsageAccessPermission(): Promise<void>;
    checkCameraPermission(): Promise<{ granted: boolean }>;
    requestCameraPermission(): Promise<void>;
    checkNotificationPermission(): Promise<{ granted: boolean }>;
    requestNotificationPermission(): Promise<void>;
    openAppSettings(): Promise<void>;
}

const PermissionsNative = registerPlugin<PermissionsPluginInterface>('PermissionsPlugin');

// ── Types ──────────────────────────────────────────────────────────

interface PermissionItem {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    granted: boolean;
    critical: boolean; // If true, shown with warning styling when not granted
    check: () => Promise<boolean>;
    request: () => Promise<void>;
}

interface PermissionsScreenProps {
    onBack: () => void;
}

// ── Component ──────────────────────────────────────────────────────

const PermissionsScreen: React.FC<PermissionsScreenProps> = ({ onBack }) => {
    const [permissions, setPermissions] = useState<PermissionItem[]>([]);
    const [loading, setLoading] = useState(true);

    const buildPermissions = useCallback((): PermissionItem[] => [
        {
            id: 'overlay',
            title: 'Display Over Other Apps',
            description: 'Required to show the exercise lock screen when you open a locked app.',
            icon: Layers,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
            granted: false,
            critical: true,
            check: async () => {
                try {
                    const r = await PermissionsNative.checkOverlayPermission();
                    return r.granted;
                } catch { return false; }
            },
            request: async () => {
                try { await PermissionsNative.requestOverlayPermission(); } catch { }
            },
        },
        {
            id: 'usage',
            title: 'Usage Access',
            description: 'Required to detect which app you opened so FitLock can trigger a challenge.',
            icon: BarChart3,
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
            granted: false,
            critical: true,
            check: async () => {
                try {
                    const r = await PermissionsNative.checkUsageAccessPermission();
                    return r.granted;
                } catch { return false; }
            },
            request: async () => {
                try { await PermissionsNative.requestUsageAccessPermission(); } catch { }
            },
        },
        {
            id: 'camera',
            title: 'Camera',
            description: 'Needed for the AI exercise tracker to count your reps using your camera.',
            icon: Camera,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            granted: false,
            critical: true,
            check: async () => {
                try {
                    const r = await PermissionsNative.checkCameraPermission();
                    return r.granted;
                } catch { return false; }
            },
            request: async () => {
                try { await PermissionsNative.requestCameraPermission(); } catch { }
            },
        },
        {
            id: 'notifications',
            title: 'Notifications',
            description: 'Allows FitLock to send reminders and lock status alerts.',
            icon: Bell,
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
            granted: false,
            critical: false,
            check: async () => {
                try {
                    const r = await PermissionsNative.checkNotificationPermission();
                    return r.granted;
                } catch { return false; }
            },
            request: async () => {
                try { await PermissionsNative.requestNotificationPermission(); } catch { }
            },
        },
    ], []);

    // Check all permission statuses
    const refreshPermissions = useCallback(async () => {
        const perms = buildPermissions();
        const updated = await Promise.all(
            perms.map(async (p) => ({
                ...p,
                granted: await p.check(),
            }))
        );
        setPermissions(updated);
        setLoading(false);
    }, [buildPermissions]);

    // Initial load
    useEffect(() => {
        refreshPermissions();
    }, [refreshPermissions]);

    // Re-check when the user returns from system settings (visibility change)
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                refreshPermissions();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [refreshPermissions]);

    const handleGrant = async (perm: PermissionItem) => {
        await perm.request();
        // Small delay to let the system process the permission
        setTimeout(() => refreshPermissions(), 500);
    };

    const grantedCount = permissions.filter(p => p.granted).length;
    const totalCount = permissions.length;
    const allGranted = grantedCount === totalCount && totalCount > 0;

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm text-gray-500 font-medium">Checking permissions…</p>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-gray-50 overflow-y-auto">
            {/* Header */}
            <div className="bg-white px-4 pt-4 pb-5 border-b border-gray-100">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1 text-blue-600 text-sm font-medium mb-4 active:opacity-70 transition-opacity"
                >
                    <ArrowLeft size={18} />
                    Back
                </button>

                {/* Status Summary */}
                <div className={`
          flex items-center gap-3 p-4 rounded-2xl
          ${allGranted ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}
        `}>
                    <div className={`
            p-2.5 rounded-xl
            ${allGranted ? 'bg-green-100' : 'bg-amber-100'}
          `}>
                        <ShieldCheck size={24} className={allGranted ? 'text-green-600' : 'text-amber-600'} />
                    </div>
                    <div>
                        <p className={`font-semibold text-sm ${allGranted ? 'text-green-800' : 'text-amber-800'}`}>
                            {allGranted ? 'All Permissions Granted' : `${grantedCount} of ${totalCount} Granted`}
                        </p>
                        <p className={`text-xs mt-0.5 ${allGranted ? 'text-green-600' : 'text-amber-600'}`}>
                            {allGranted
                                ? 'FitLock is fully configured and ready to go!'
                                : 'Grant all permissions for FitLock to work properly.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Permission Cards */}
            <div className="px-4 py-4 space-y-3">
                {permissions.map((perm) => {
                    const Icon = perm.icon;
                    return (
                        <div
                            key={perm.id}
                            className={`
                bg-white rounded-2xl border overflow-hidden transition-all
                ${!perm.granted && perm.critical
                                    ? 'border-red-200 shadow-sm shadow-red-100'
                                    : 'border-gray-100 shadow-sm'}
              `}
                        >
                            <div className="p-4 flex items-start gap-3">
                                {/* Icon */}
                                <div className={`p-2.5 rounded-xl ${perm.iconBg} shrink-0`}>
                                    <Icon size={20} className={perm.iconColor} />
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-gray-900 text-sm">{perm.title}</h3>
                                        {perm.critical && !perm.granted && (
                                            <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full uppercase">
                                                Required
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 leading-relaxed">{perm.description}</p>
                                </div>

                                {/* Status */}
                                <div className="shrink-0 pt-0.5">
                                    {perm.granted ? (
                                        <div className="flex items-center gap-1 bg-green-50 px-2.5 py-1 rounded-full">
                                            <CheckCircle2 size={14} className="text-green-600" />
                                            <span className="text-xs font-semibold text-green-700">Granted</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 bg-red-50 px-2.5 py-1 rounded-full">
                                            <XCircle size={14} className="text-red-500" />
                                            <span className="text-xs font-semibold text-red-600">Denied</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Grant button — only shown when not granted */}
                            {!perm.granted && (
                                <div className="px-4 pb-4">
                                    <button
                                        onClick={() => handleGrant(perm)}
                                        className={`
                      w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm
                      transition-all active:scale-[0.98]
                      ${perm.critical
                                                ? 'bg-blue-600 text-white active:bg-blue-700'
                                                : 'bg-gray-100 text-gray-700 active:bg-gray-200'}
                    `}
                                    >
                                        <ExternalLink size={14} />
                                        Grant Permission
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer info */}
            <div className="px-6 pb-8 pt-2">
                <p className="text-center text-[11px] text-gray-400 leading-relaxed">
                    Some permissions open Android system settings.
                    <br />
                    Grant the permission there and return to FitLock.
                </p>
            </div>
        </div>
    );
};

export default PermissionsScreen;
