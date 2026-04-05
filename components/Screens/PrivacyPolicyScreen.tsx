import React from 'react';
import { Shield, ArrowLeft, Camera, Database, Globe, Lock } from 'lucide-react';

interface PrivacyPolicyScreenProps {
    onBack: () => void;
}

const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ onBack }) => {
    return (
        <div className="pb-24 max-w-3xl mx-auto w-full">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 p-6 flex items-center gap-4 border-b border-gray-100 dark:border-gray-800">
                <button
                    onClick={onBack}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Go back"
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Privacy Policy</h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Last updated: March 2026</p>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Introduction */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield size={20} className="text-blue-600 dark:text-blue-400" />
                        <h3 className="font-bold text-blue-800 dark:text-blue-300">Your Privacy Matters</h3>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
                        FitLock is designed with your privacy in mind. We believe in transparency about how your data is handled.
                    </p>
                </div>

                {/* Camera Usage */}
                <PolicySection
                    icon={Camera}
                    title="Camera Usage"
                    color="purple"
                    content="FitLock uses your device's camera solely for real-time pose detection during exercise challenges. Camera data is processed entirely on your device using MediaPipe Pose technology. No images, video, or pose data are ever recorded, stored, or transmitted to any server."
                />

                {/* Data Storage */}
                <PolicySection
                    icon={Database}
                    title="Data Storage"
                    color="green"
                    content="All app data — including your profile information, app lock settings, and workout history — is stored locally on your device using your browser's localStorage. This data never leaves your device and is not accessible to us or any third party."
                />

                {/* Third-Party Services */}
                <PolicySection
                    icon={Globe}
                    title="Third-Party Services"
                    color="orange"
                    content="To support ongoing development, FitLock integrates Google AdMob and RevenueCat. These services may responsibly collect non-personal device identifiers like your Advertising ID. Your core app data (exercises, app locks) is strictly offline and never sent to these services."
                />

                {/* Security */}
                <PolicySection
                    icon={Lock}
                    title="Data Security"
                    color="blue"
                    content="Since all data is stored locally on your device, its security is tied to your device's security. We recommend keeping your device locked with a PIN, password, or biometric authentication to protect your data."
                />

                {/* Your Rights */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">Your Rights</h3>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 font-bold mt-0.5">✓</span>
                            <span>You can clear all app data at any time by clearing your browser's storage or uninstalling the app.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 font-bold mt-0.5">✓</span>
                            <span>You can revoke camera permissions at any time through your device settings.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 font-bold mt-0.5">✓</span>
                            <span>No account creation is required to use FitLock.</span>
                        </li>
                    </ul>
                </div>

                {/* Contact */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        If you have any questions about this privacy policy, please contact us through our GitHub repository.
                    </p>
                </div>
            </div>
        </div>
    );
};

interface PolicySectionProps {
    icon: React.ElementType;
    title: string;
    color: string;
    content: string;
}

const PolicySection: React.FC<PolicySectionProps> = ({ icon: Icon, title, color, content }) => {
    const colorMap: Record<string, string> = {
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
        green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
        orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    };
    const iconStyle = colorMap[color] || 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400';

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${iconStyle}`}>
                    <Icon size={18} />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100">{title}</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pl-11">
                {content}
            </p>
        </div>
    );
};

export default PrivacyPolicyScreen;
