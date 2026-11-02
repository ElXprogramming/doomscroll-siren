import type { TelemetryStats } from '../types';

const STORAGE_KEY = 'doomscroll_siren_telemetry_v1';

const DEFAULT_STATS: TelemetryStats = {
  sirenTriggers: 0,
  longestFocusStreak: 0,
  totalDoomscrollBlocked: 0,
};

export function loadTelemetry(): TelemetryStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATS };
    const parsed = JSON.parse(raw);
    return {
      sirenTriggers: Number(parsed.sirenTriggers) || 0,
      longestFocusStreak: Number(parsed.longestFocusStreak) || 0,
      totalDoomscrollBlocked: Number(parsed.totalDoomscrollBlocked) || 0,
    };
  } catch (err) {
    console.warn('Failed to load telemetry from localStorage:', err);
    return { ...DEFAULT_STATS };
  }
}

export function saveTelemetry(stats: TelemetryStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.warn('Failed to save telemetry to localStorage:', err);
  }
}

export function recordSirenTrigger(): TelemetryStats {
  const current = loadTelemetry();
  current.sirenTriggers += 1;
  saveTelemetry(current);
  return current;
}

export function updateFocusStreak(currentStreak: number): TelemetryStats {
  const current = loadTelemetry();
  if (currentStreak > current.longestFocusStreak) {
    current.longestFocusStreak = Math.round(currentStreak);
    saveTelemetry(current);
  }
  return current;
}

export function addDoomscrollBlocked(seconds: number): TelemetryStats {
  const current = loadTelemetry();
  current.totalDoomscrollBlocked = Math.round((current.totalDoomscrollBlocked + seconds) * 10) / 10;
  saveTelemetry(current);
  return current;
}

export function resetTelemetry(): TelemetryStats {
  saveTelemetry(DEFAULT_STATS);
  return { ...DEFAULT_STATS };
}
