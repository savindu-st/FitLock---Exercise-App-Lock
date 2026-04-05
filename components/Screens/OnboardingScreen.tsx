import React, { useState } from 'react';
import { ShieldCheck, Dumbbell, Shield, ArrowRight, Lock } from 'lucide-react';
import { Browser } from '@capacitor/browser';

interface OnboardingScreenProps {
    onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
    const [agreed, setAgreed] = useState(false);

    return (
        <div className="min-h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden relative">
            {/* Header Art */}
            <div className="relative pt-16 pb-12 flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-blue-950 shrink-0 shadow-lg z-10 rounded-b-[40px]">
                <div className="absolute inset-0 overflow-hidden rounded-b-[40px]">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />
                </div>
                
                <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl relative mb-6">
                    <ShieldCheck size={40} className="text-white" />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full border-2 border-blue-950 flex items-center justify-center">
                        <Dumbbell size={14} className="text-white" />
                    </div>
                </div>

                <h1 className="text-3xl font-black text-white text-center tracking-tight px-6 drop-shadow-md">
                    Welcome to FitLock
                </h1>
                <p className="text-blue-200 mt-2 text-center max-w-xs px-4">
                    Earn your screen time through physical exercise.
                </p>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto w-full max-w-md mx-auto px-6 py-8 flex flex-col gap-6 relative z-20">
                
                {/* Info Cards */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-start gap-4">
                        <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 rounded-xl shrink-0">
                            <Dumbbell size={20} className="text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1">Physical Activity Required</h3>
                            <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                                FitLock locks your distracting apps until you complete AI-tracked physical exercises like squats or pushups.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-start gap-4">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl shrink-0">
                            <Shield size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1">100% Private Offline AI</h3>
                            <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                                Exercises are detected securely on your device using your camera. <span className="font-semibold text-gray-700 dark:text-gray-300">No video goes to the cloud.</span>
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-start gap-4">
                        <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-xl shrink-0">
                            <Lock size={20} className="text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1">Strong App Blocking</h3>
                            <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                                Make sure to whitelist essential apps (like Phone or Emergency Services) as they may be blocked if configured to do so.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex-1" />

                {/* Consent Section */}
                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border-2 border-blue-100 dark:border-gray-800 shadow-sm mt-4">
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                            <input 
                                type="checkbox" 
                                className="peer sr-only"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                            />
                            <div className="w-6 h-6 rounded-md border-2 border-gray-300 dark:border-gray-600 peer-checked:bg-blue-600 peer-checked:border-blue-600 dark:peer-checked:bg-blue-500 dark:peer-checked:border-blue-500 transition-colors flex items-center justify-center">
                                <CheckIcon active={agreed} />
                            </div>
                        </div>
                        <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed select-none">
                            I understand the physical risks of exercise and agree to the{' '}
                            <span 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); Browser.open({ url: 'https://sites.google.com/view/fitlock-toc/home' }); }}
                                className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                            >
                                Terms and Conditions
                            </span>{' '}
                            and{' '}
                            <span 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); Browser.open({ url: 'https://sites.google.com/view/fitlock/home' }); }}
                                className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                            >
                                Privacy Policy
                            </span>.
                        </p>
                    </label>
                </div>

                <button
                    onClick={onComplete}
                    disabled={!agreed}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg disabled:shadow-none"
                >
                    <span>Get Started</span>
                    <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
};

const CheckIcon = ({ active }: { active: boolean }) => (
    <svg 
        className={`w-4 h-4 text-white transition-transform duration-200 ${active ? 'scale-100' : 'scale-0'}`} 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={3}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

export default OnboardingScreen;
