import React, { useState, useEffect } from 'react';
import { AppItem } from '../../types';
import { Smartphone, Facebook, Instagram, Twitter, MessageCircle, Chrome, Camera, Mail, Map } from 'lucide-react';
import { getCachedIcon, subscribeToIconUpdates } from '../../utils/iconCache';

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
        // If we already have the icon data, no need to subscribe
        if (iconData || app.icon === 'DEEP_LINK') return;

        // Check cache immediately (in case it was updated between initial state and effect)
        const cached = getCachedIcon(app.packageName);
        if (cached) {
            setIconData(cached);
            return;
        }

        // Subscribe to cache updates
        const unsubscribe = subscribeToIconUpdates((pkg, icon) => {
            if (pkg === app.packageName) {
                setIconData(icon);
            }
        });

        return () => unsubscribe();
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
