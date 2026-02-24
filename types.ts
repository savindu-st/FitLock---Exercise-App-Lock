import { LucideIcon } from 'lucide-react';

export enum ScreenName {
  HOME = 'HOME',
  LOCK_CHALLENGE = 'LOCK_CHALLENGE',
  APP_CONTENT = 'APP_CONTENT',
  SETTINGS = 'SETTINGS',
  PROFILE = 'PROFILE',
  HISTORY = 'HISTORY',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  CAMERA_PERMISSION = 'CAMERA_PERMISSION',
  PERMISSIONS = 'PERMISSIONS',
  NOTICE = 'NOTICE'
}

export interface AppItem {
  id: string;
  name: string;
  packageName: string;
  iconColor: string;
  isLocked: boolean;
  requiredReps: number;
  icon?: string; // Base64 icon string
}

export interface NavItem {
  id: ScreenName;
  label: string;
  icon: LucideIcon;
}

export interface HistoryItem {
  id: string;
  appName: string;
  exerciseType: ExerciseType;
  reps: number;
  timestamp: number;
}

export enum ExerciseState {
  IDLE = 'IDLE',
  UP = 'UP',
  DOWN = 'DOWN',
  COMPLETED = 'COMPLETED'
}

export enum ExerciseType {
  PUSHUPS = 'Pushups',
  SQUATS = 'Squats',
  JUMPING_JACKS = 'Jumping Jacks'
}