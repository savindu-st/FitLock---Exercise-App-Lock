import { registerPlugin } from '@capacitor/core';

interface InstalledAppsPlugin {
    getAppIcon(options: { packageName: string }): Promise<{ icon: string }>;
}

const InstalledApps = registerPlugin<InstalledAppsPlugin>('InstalledApps');

const ICON_CACHE_KEY = 'fitlock_icon_cache';

// In-memory cache for fast reads during the session
const memoryCache = new Map<string, string>();

// Track in-flight requests to avoid duplicate native calls
const pendingRequests = new Map<string, Promise<string>>();

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
    }
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

    // Process in batches of 5 to keep the native bridge responsive
    const BATCH_SIZE = 5;
    for (let i = 0; i < uncached.length; i += BATCH_SIZE) {
        const batch = uncached.slice(i, i + BATCH_SIZE);
        await Promise.all(
            batch.map(async (pkg) => {
                // Deduplicate — if someone else is already fetching, wait for that
                if (pendingRequests.has(pkg)) {
                    const icon = await pendingRequests.get(pkg)!;
                    if (icon) onIconLoaded?.(pkg, icon);
                    return;
                }

                const request = InstalledApps.getAppIcon({ packageName: pkg })
                    .then(({ icon }) => {
                        if (icon) {
                            setCachedIcon(pkg, icon);
                            onIconLoaded?.(pkg, icon);
                        }
                        return icon;
                    })
                    .catch(() => '')
                    .finally(() => {
                        pendingRequests.delete(pkg);
                    });

                pendingRequests.set(pkg, request);
                await request;
            })
        );
    }
};
