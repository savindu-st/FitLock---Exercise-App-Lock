import React, { useState, useEffect } from 'react';
import { AppItem } from '../../types';
import { Smartphone, Facebook, Instagram, Twitter, MessageCircle, Chrome, Camera, Mail, Map } from 'lucide-react';
import { registerPlugin } from '@capacitor/core';
import { getCachedIcon, setCachedIcon } from '../../utils/iconCache';

interface InstalledAppsPlugin {
    getAppIcon(options: { packageName: string }): Promise<{ icon: string }>;
}
const InstalledApps = registerPlugin<InstalledAppsPlugin>('InstalledApps');

interface AppIconProps {
    app: AppItem;
    className?: string;
    iconSize?: number;
}

const AppIcon: React.FC<AppIconProps> = ({ app, className = "w-full h-full object-cover", iconSize = 32 }) => {
    const [iconData, setIconData] = useState<string | null>(() => {
        if (app.icon && app.icon !== '' && app.icon !== 'DEEP_LINK') return app.icon;
        return getCachedIcon(app.packageName);
    });

    useEffect(() => {
        let isMounted = true;
        if (iconData || app.icon === 'DEEP_LINK') return;

        const fetchIcon = async () => {
            try {
                const { icon } = await InstalledApps.getAppIcon({ packageName: app.packageName });
                if (isMounted && icon) {
                    setCachedIcon(app.packageName, icon);
                    setIconData(icon);
                }
            } catch (e) {
                // Ignore error and fall back
            }
        };

        // Stagger loading slightly to keep UI responsive
        const timer = setTimeout(fetchIcon, 50);
        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [app.packageName, iconData, app.icon]);

    const renderFallbackIcon = () => {
        switch (app.name) {
            case 'Facebook': return <Facebook size={iconSize} className="text-white" />;
            case 'Instagram': return <Instagram size={iconSize} className="text-white" />;
            case 'WhatsApp': return <MessageCircle size={iconSize} className="text-white" />;
            case 'Twitter': return <Twitter size={iconSize} className="text-white" />;
            case 'Chrome': return <Chrome size={iconSize} className="text-white" />;
            case 'Camera': return <Camera size={iconSize} className="text-white" />;
            case 'Gmail': return <Mail size={iconSize} className="text-white" />;
            case 'Maps': return <Map size={iconSize} className="text-white" />;
            default: return <Smartphone size={iconSize} className="text-white" />;
        }
    };

    if (iconData) {
        return <img src={iconData} alt={app.name} className={className} />;
    }

    return (
        <div className={`w-full h-full flex items-center justify-center ${app.iconColor || 'bg-blue-500'}`}>
            {renderFallbackIcon()}
        </div>
    );
};

export default AppIcon;
