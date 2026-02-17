import { AppItem, HistoryItem } from '../types';

const STORAGE_KEYS = {
    APPS: 'fitlock_apps',
    HISTORY: 'fitlock_history',
    PROFILE: 'fitlock_profile',
} as const;

// --- Apps ---
export const saveApps = (apps: AppItem[]): void => {
    try {
        localStorage.setItem(STORAGE_KEYS.APPS, JSON.stringify(apps));
    } catch (e) {
        console.error('Failed to save apps:', e);
    }
};

export const loadApps = (): AppItem[] | null => {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.APPS);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Failed to load apps:', e);
        return null;
    }
};

// --- History ---
export const saveHistory = (history: HistoryItem[]): void => {
    try {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (e) {
        console.error('Failed to save history:', e);
    }
};

export const loadHistory = (): HistoryItem[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Failed to load history:', e);
        return [];
    }
};

// --- Profile ---
export interface UserProfile {
    name: string;
    email: string;
}

const DEFAULT_PROFILE: UserProfile = {
    name: 'User',
    email: '',
};

export const saveProfile = (profile: UserProfile): void => {
    try {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
        console.error('Failed to save profile:', e);
    }
};

export const loadProfile = (): UserProfile => {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
        return data ? JSON.parse(data) : DEFAULT_PROFILE;
    } catch (e) {
        console.error('Failed to load profile:', e);
        return DEFAULT_PROFILE;
    }
};
