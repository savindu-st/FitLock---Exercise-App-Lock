import React from 'react';
import { ArrowLeft, Shield, Smartphone } from 'lucide-react';

interface NoticeScreenProps {
    onBack: () => void;
}

const NoticeScreen: React.FC<NoticeScreenProps> = ({ onBack }) => {
    return (
        <div className="pb-24 max-w-3xl mx-auto w-full">
            {/* Header */}
            <div className="bg-white p-6 flex items-center gap-4 border-b border-gray-100">
                <button
                    onClick={onBack}
                    className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                    aria-label="Go back"
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Notice</h2>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Privacy Notice */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                            <Shield size={18} />
                        </div>
                        <h3 className="font-bold text-gray-800">Privacy Data</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed pl-11">
                        We don't collect any of user data or video and, everything handles locally.
                    </p>
                </div>

                {/* Subscription Notice */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                            <Smartphone size={18} />
                        </div>
                        <h3 className="font-bold text-gray-800">Premium Subscription</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed pl-11">
                        If you get premium subscription on this device you can't use that subscription on another device because the the premium subscription gives to the device id by play store.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NoticeScreen;
