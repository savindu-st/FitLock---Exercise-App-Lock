import { AppItem, HistoryItem } from '../types';

const STORAGE_KEYS = {
    APPS: 'fitlock_apps',
    HISTORY: 'fitlock_history',
    PROFILE: 'fitlock_profile',
    CAMERA_ASKED: 'fitlock_camera_asked',
    THEME: 'fitlock_theme',
    ONBOARDING_COMPLETED: 'fitlock_onboarding_completed',
} as const;

// --- Camera Permission ---
export const setCameraPermissionAsked = (): void => {
    try {
        localStorage.setItem(STORAGE_KEYS.CAMERA_ASKED, 'true');
    } catch (e) {
        console.error('Failed to save camera permission flag:', e);
    }
};

export const isCameraPermissionAsked = (): boolean => {
    try {
        return localStorage.getItem(STORAGE_KEYS.CAMERA_ASKED) === 'true';
    } catch (e) {
        console.error('Failed to load camera permission flag:', e);
        return false;
    }
};

// --- Onboarding ---
export const setOnboardingCompleted = (): void => {
    try {
        localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    } catch (e) {
        console.error('Failed to save onboarding flag:', e);
    }
};

export const isOnboardingCompleted = (): boolean => {
    try {
        return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED) === 'true';
    } catch (e) {
        console.error('Failed to load onboarding flag:', e);
        return false;
    }
};

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
    avatar?: string;
    soundEnabled?: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
    name: 'User',
    email: '',
    avatar: '💪',
    soundEnabled: true,
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

// --- Theme ---
export type ThemePreference = 'light' | 'dark' | 'system';

export const saveTheme = (theme: ThemePreference): void => {
    try {
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {
        console.error('Failed to save theme:', e);
    }
};

export const loadTheme = (): ThemePreference => {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.THEME) as ThemePreference;
        return data || 'system';
    } catch (e) {
        console.error('Failed to load theme:', e);
        return 'system';
    }
};

