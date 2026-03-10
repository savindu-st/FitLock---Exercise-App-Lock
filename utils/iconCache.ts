const iconCache = new Map<string, string>();

export const getCachedIcon = (packageName: string): string | null => {
    return iconCache.get(packageName) || null;
};

export const setCachedIcon = (packageName: string, iconUrl: string): void => {
    if (iconUrl) {
        iconCache.set(packageName, iconUrl);
    }
};
