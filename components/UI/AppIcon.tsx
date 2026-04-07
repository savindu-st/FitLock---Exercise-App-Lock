import React, { useState, useEffect } from 'react';
import { AppItem } from '../../types';
import { Smartphone, Facebook, Instagram, Twitter, MessageCircle, Chrome, Camera, Mail, Map } from 'lucide-react';
import { getCachedIcon } from '../../utils/iconCache';

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

    // Poll the cache briefly if no icon yet — batch prefetcher populates it
    useEffect(() => {
        if (iconData || app.icon === 'DEEP_LINK') return;

        // Check immediately — cache may already be populated
        const cached = getCachedIcon(app.packageName);
        if (cached) {
            setIconData(cached);
            return;
        }

        // Poll every 200ms for up to 10s waiting for the prefetcher
        let attempts = 0;
        const maxAttempts = 50;
        const interval = setInterval(() => {
            attempts++;
            const icon = getCachedIcon(app.packageName);
            if (icon) {
                setIconData(icon);
                clearInterval(interval);
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
            }
        }, 200);

        return () => clearInterval(interval);
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
