import React from 'react';
import { ArrowLeft, Shield, AlertTriangle, Scale, Lock, Camera, Info } from 'lucide-react';

interface LegalScreenProps {
    onBack: () => void;
}

const LegalScreen: React.FC<LegalScreenProps> = ({ onBack }) => {
    return (
        <div className="pb-24 max-w-3xl mx-auto w-full bg-gray-50 dark:bg-gray-950 min-h-screen">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 p-6 flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
                <button
                    onClick={onBack}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Legal Information</h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Last updated: April 2026</p>
                </div>
            </div>

            <div className="p-4 space-y-6">
                
                {/* Terms and Conditions Section */}
                <section>
                    <div className="flex items-center gap-2 mb-3 px-2">
                        <Scale size={20} className="text-gray-700 dark:text-gray-300" />
                        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Terms & Conditions</h2>
                    </div>
                    
                    <div className="space-y-3">
                        <PolicyCard 
                            icon={AlertTriangle} 
                            color="orange"
                            title="Physical Safety Disclaimer"
                            content="FitLock requires physical exercise (e.g., squats, pushups) to unlock apps. By using this app, you acknowledge that you are responsible for your own safety. You agree to only exercise in a safe environment, within your physical limits. The developers of FitLock are not liable for any injuries or accidents that occur while using the app."
                        />
                        
                        <PolicyCard 
                            icon={Info} 
                            color="blue"
                            title="Emergency Clause"
                            content="FitLock limits access to specified applications on your device. We are not responsible if you cannot access a locked app during an emergency. We strongly advise that you DO NOT lock emergency dialers, phone apps, or essential communication tools. Whitelist your essential apps in the settings."
                        />
                    </div>
                </section>

                <div className="h-px w-full bg-gray-200 dark:bg-gray-800 my-6" />

                {/* Privacy Policy Section */}
                <section>
                    <div className="flex items-center gap-2 mb-3 px-2">
                        <Shield size={20} className="text-gray-700 dark:text-gray-300" />
                        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Privacy Policy</h2>
                    </div>

                    <div className="space-y-3">
                        <PolicyCard 
                            icon={Camera} 
                            color="purple"
                            title="Camera Privacy & On-Device AI"
                            content="FitLock uses your device's camera exclusively for real-time exercise tracking via AI pose detection. No video data, images, or pose information is ever recorded, saved, or transmitted to any server. All processing happens 100% locally on your device."
                        />

                        <PolicyCard 
                            icon={Lock} 
                            color="green"
                            title="Offline Data Storage"
                            content="All configurations, including locked apps and exercise history, are stored locally on your device. We do not maintain any cloud databases of your usage patterns or blocked apps."
                        />
                    </div>
                </section>

                <div className="h-px w-full bg-gray-200 dark:bg-gray-800 my-6" />

                {/* Open Source Licenses */}
                <section>
                    <div className="flex items-center gap-2 mb-3 px-2">
                        <Info size={20} className="text-gray-700 dark:text-gray-300" />
                        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Open Source Licenses</h2>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">MediaPipe</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                            FitLock utilizes Google's MediaPipe for on-device machine learning pose detection. MediaPipe is licensed under the Apache License, Version 2.0.
                        </p>
                        
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">React & Tailwind CSS</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            Built using React and styled with Tailwind CSS, both available under the MIT License. Vector icons are provided by Lucide (ISC License).
                        </p>
                    </div>
                </section>
                
                {/* External Links */}
                <div className="pt-6 pb-4 flex justify-center">
                    <a 
                        href="https://sites.google.com/view/fitlock/home" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline p-2"
                    >
                        View Full Privacy Policy Document
                    </a>
                </div>
            </div>
        </div>
    );
};

interface PolicyCardProps {
    icon: React.ElementType;
    title: string;
    content: string;
    color: 'orange' | 'blue' | 'purple' | 'green';
}

const PolicyCard: React.FC<PolicyCardProps> = ({ icon: Icon, title, content, color }) => {
    const colorStyles = {
        orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
        green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${colorStyles[color]}`}>
                    <Icon size={18} />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">{title}</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pl-11">
                {content}
            </p>
        </div>
    );
};

export default LegalScreen;
