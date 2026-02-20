import React, { useState } from 'react';
import { Camera, ShieldCheck, ChevronRight, X } from 'lucide-react';

interface CameraPermissionScreenProps {
    onPermissionGranted: () => void;
    onSkip: () => void;
}

const CameraPermissionScreen: React.FC<CameraPermissionScreenProps> = ({ onPermissionGranted, onSkip }) => {
    const [requesting, setRequesting] = useState(false);
    const [denied, setDenied] = useState(false);

    const requestCameraAccess = async () => {
        setRequesting(true);
        try {
            // This triggers the native Android permission dialog in Capacitor WebView
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            // Permission granted — stop the stream immediately
            stream.getTracks().forEach(track => track.stop());
            onPermissionGranted();
        } catch (err) {
            console.warn('Camera permission denied or unavailable:', err);
            setDenied(true);
            setRequesting(false);
        }
    };

    const openAppSettings = () => {
        // On Capacitor Android, open the app's native settings page
        try {
            const capacitor = (window as any).Capacitor;
            if (capacitor?.isNativePlatform()) {
                // Use Android intent to open app settings
                const AndroidSettings = (window as any).cordova?.plugins?.settings;
                if (AndroidSettings) {
                    AndroidSettings.open('application_details');
                } else {
                    // Fallback: use Capacitor's App plugin or a direct intent
                    // For most Capacitor apps, we can use the App plugin
                    capacitor.Plugins?.Browser?.open?.({ url: `package:${capacitor.Plugins?.Device?.getId?.() || 'com.savindu.fitlock'}` });
                }
            }
        } catch (e) {
            console.error('Could not open app settings:', e);
        }
        // After the user comes back from settings, they'll see the home screen
        onPermissionGranted();
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950">
            <div className="w-full h-[100dvh] sm:h-[800px] sm:w-[400px] sm:rounded-3xl sm:border-8 sm:border-gray-800 bg-gray-900 overflow-hidden shadow-2xl relative flex flex-col">

                {/* Skip button */}
                <button
                    onClick={onSkip}
                    className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-gray-400 hover:text-white"
                    aria-label="Skip"
                >
                    <X size={20} />
                </button>

                {/* Main Content */}
                <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
                    {/* Animated Camera Icon */}
                    <div className="relative mb-8">
                        <div className="w-32 h-32 rounded-full bg-blue-500/10 flex items-center justify-center ring-4 ring-blue-500/20">
                            <div className="w-24 h-24 rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse">
                                <Camera size={48} className="text-blue-400" />
                            </div>
                        </div>
                        {/* Decorative glow */}
                        <div className="absolute -inset-4 bg-blue-500/5 rounded-full blur-2xl" />
                    </div>

                    <h1 className="text-3xl font-black text-white mb-3 tracking-tight">
                        Camera Access
                    </h1>

                    <p className="text-gray-400 text-base leading-relaxed mb-2 max-w-xs">
                        FitLock needs your camera to detect exercises and track your movements in real-time.
                    </p>

                    <div className="flex items-center gap-2 text-green-400/80 text-sm mb-10">
                        <ShieldCheck size={16} />
                        <span>Your camera feed is never stored or shared</span>
                    </div>

                    {/* Feature highlights */}
                    <div className="w-full max-w-xs space-y-3 mb-10">
                        {[
                            { emoji: '🏋️', text: 'Real-time exercise detection' },
                            { emoji: '📐', text: 'AI-powered form analysis' },
                            { emoji: '🔓', text: 'Exercise to unlock apps' },
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/5"
                            >
                                <span className="text-lg">{feature.emoji}</span>
                                <span className="text-sm text-gray-300 font-medium">{feature.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="px-8 pb-10 space-y-3">
                    {!denied ? (
                        <button
                            onClick={requestCameraAccess}
                            disabled={requesting}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-blue-600/30"
                        >
                            {requesting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Requesting...</span>
                                </>
                            ) : (
                                <>
                                    <Camera size={20} />
                                    <span>Give Access</span>
                                    <ChevronRight size={18} className="ml-1 opacity-60" />
                                </>
                            )}
                        </button>
                    ) : (
                        <>
                            <p className="text-amber-400/90 text-xs text-center mb-2">
                                Camera access was denied. Please enable it in your device settings.
                            </p>
                            <button
                                onClick={openAppSettings}
                                className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-amber-600/30"
                            >
                                <span>Open Settings</span>
                                <ChevronRight size={18} className="ml-1 opacity-60" />
                            </button>
                        </>
                    )}

                    <button
                        onClick={onSkip}
                        className="w-full text-gray-500 hover:text-gray-300 font-medium py-3 rounded-2xl transition-colors text-sm"
                    >
                        Skip for now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CameraPermissionScreen;
