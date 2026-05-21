import { registerPlugin } from '@capacitor/core';

interface InstalledAppsPlugin {
    getAppIcon(options: { packageName: string }): Promise<{ icon: string }>;
    getAppIcons(options: { packageNames: string[] }): Promise<{ icons: Record<string, string> }>;
}

const InstalledApps = registerPlugin<InstalledAppsPlugin>('InstalledApps');

const ICON_CACHE_KEY = 'fitlock_icon_cache';

// In-memory cache for fast reads during the session
const memoryCache = new Map<string, string>();

// Track in-flight requests to avoid duplicate native calls
const pendingRequests = new Map<string, Promise<string>>();

// Listeners for icon updates
type IconListener = (packageName: string, iconUrl: string) => void;
const listeners = new Set<IconListener>();

// --- localStorage persistence ---

const loadCacheFromStorage = (): void => {
    try {
        const data = localStorage.getItem(ICON_CACHE_KEY);
        if (data) {
            const parsed: Record<string, string> = JSON.parse(data);
            for (const [key, value] of Object.entries(parsed)) {
                memoryCache.set(key, value);
            }
        }
    } catch (e) {
        console.warn('Failed to load icon cache from storage:', e);
    }
};

const saveCacheToStorage = (): void => {
    try {
        const obj: Record<string, string> = {};
        memoryCache.forEach((value, key) => {
            obj[key] = value;
        });
        localStorage.setItem(ICON_CACHE_KEY, JSON.stringify(obj));
    } catch (e) {
        console.warn('Failed to save icon cache to storage:', e);
    }
};

// Debounce saves so we don't hammer localStorage during batch icon loads
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
const debouncedSave = (): void => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveCacheToStorage, 500);
};

// Load persistent cache on module init
loadCacheFromStorage();

// --- Public API ---

export const getCachedIcon = (packageName: string): string | null => {
    return memoryCache.get(packageName) || null;
};

export const setCachedIcon = (packageName: string, iconUrl: string): void => {
    if (iconUrl) {
        memoryCache.set(packageName, iconUrl);
        debouncedSave();
        // Notify listeners
        listeners.forEach(l => l(packageName, iconUrl));
    }
};

export const subscribeToIconUpdates = (listener: IconListener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

/**
 * Batch-fetch icons for a list of package names.
 * Skips packages that are already cached and deduplicates in-flight requests.
 * Calls the callback for each icon as it resolves (for progressive UI updates).
 */
export const prefetchIcons = async (
    packageNames: string[],
    onIconLoaded?: (packageName: string, icon: string) => void
): Promise<void> => {
    const uncached = packageNames.filter(pkg => !memoryCache.has(pkg));
    if (uncached.length === 0) return;

    // Deduplicate from ongoing requests
    const toFetch = uncached.filter(pkg => !pendingRequests.has(pkg));

    // For any already pending request, wait for it
    uncached.forEach(async (pkg) => {
        if (pendingRequests.has(pkg)) {
            const icon = await pendingRequests.get(pkg);
            if (icon) onIconLoaded?.(pkg, icon);
        }
    });

    if (toFetch.length === 0) return;

    // Process in larger batches of 20 using the native bulk API getAppIcons
    const BATCH_SIZE = 20;
    for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
        const batch = toFetch.slice(i, i + BATCH_SIZE);
        
        // Setup promises for this batch to track ongoing requests in pendingRequests Map
        const batchPromises: Record<string, (icon: string) => void> = {};
        batch.forEach(pkg => {
            const promise = new Promise<string>((resolve) => {
                batchPromises[pkg] = resolve;
            });
            pendingRequests.set(pkg, promise);
        });

        try {
            // Call bulk API on native side
            const response = await InstalledApps.getAppIcons({ packageNames: batch });
            const icons = response?.icons || {};
            
            // Resolve all promises and set icons
            batch.forEach(pkg => {
                const icon = icons[pkg] || '';
                if (icon) {
                    setCachedIcon(pkg, icon);
                    onIconLoaded?.(pkg, icon);
                }
                // Clean from pending and resolve the promise
                pendingRequests.delete(pkg);
                batchPromises[pkg]?.(icon);
            });
        } catch (err) {
            console.warn('Batch fetch failed, falling back to individual fetch', err);
            // Fallback: fetch individually for this batch in case of error
            await Promise.all(batch.map(async (pkg) => {
                try {
                    const { icon } = await InstalledApps.getAppIcon({ packageName: pkg });
                    if (icon) {
                        setCachedIcon(pkg, icon);
                        onIconLoaded?.(pkg, icon);
                    }
                    pendingRequests.delete(pkg);
                    batchPromises[pkg]?.(icon);
                } catch {
                    pendingRequests.delete(pkg);
                    batchPromises[pkg]?.('');
                }
            }));
        }
    }
};
