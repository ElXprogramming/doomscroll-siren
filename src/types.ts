export interface Detection {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  score: number;
  classId: number;
  label: 'person' | 'cell phone' | string;
}

export interface TelemetryStats {
  sirenTriggers: number;
  longestFocusStreak: number; // in seconds
  totalDoomscrollBlocked: number; // in seconds
}

export type GuardState = 'disarmed' | 'clean' | 'warning' | 'siren';

export interface GuardSettings {
  confidenceThreshold: number; // 0.20 to 0.75
  timeLimit: number; // 5, 10, or 15 seconds
  volume: number; // 0.0 to 1.0
  simulatedPhone: boolean;
}
