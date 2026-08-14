import { DEFAULT_CONTROL_VISIBILITY_CONFIG } from "./ControlVisibility";
import { DEFAULT_SEEK_SECONDS } from "./MediaSeek";
import { DEFAULT_VOLUME_STEP } from "./MediaVolume";

export const SETTINGS_SCHEMA_VERSION = 1 as const;

export type TimeDisplayMode = "elapsed" | "remaining";

export interface FloatPlaySettings {
  readonly schemaVersion: typeof SETTINGS_SCHEMA_VERSION;
  readonly seekBackwardSeconds: number;
  readonly seekForwardSeconds: number;
  readonly volumeStep: number;
  readonly autoHideEnabled: boolean;
  readonly autoHideDelayMs: number;
  readonly timeDisplayMode: TimeDisplayMode;
}

export const DEFAULT_SETTINGS: FloatPlaySettings = {
  schemaVersion: SETTINGS_SCHEMA_VERSION,
  seekBackwardSeconds: DEFAULT_SEEK_SECONDS,
  seekForwardSeconds: DEFAULT_SEEK_SECONDS,
  volumeStep: DEFAULT_VOLUME_STEP,
  autoHideEnabled: DEFAULT_CONTROL_VISIBILITY_CONFIG.enabled,
  autoHideDelayMs: DEFAULT_CONTROL_VISIBILITY_CONFIG.delayMs,
  timeDisplayMode: "elapsed"
};

export function normalizeSettings(value: unknown): FloatPlaySettings {
  if (!isRecord(value) || value.schemaVersion !== SETTINGS_SCHEMA_VERSION) {
    return { ...DEFAULT_SETTINGS };
  }

  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    seekBackwardSeconds: positiveNumberOr(value.seekBackwardSeconds, DEFAULT_SETTINGS.seekBackwardSeconds),
    seekForwardSeconds: positiveNumberOr(value.seekForwardSeconds, DEFAULT_SETTINGS.seekForwardSeconds),
    volumeStep: volumeStepOr(value.volumeStep, DEFAULT_SETTINGS.volumeStep),
    autoHideEnabled: booleanOr(value.autoHideEnabled, DEFAULT_SETTINGS.autoHideEnabled),
    autoHideDelayMs: nonNegativeNumberOr(value.autoHideDelayMs, DEFAULT_SETTINGS.autoHideDelayMs),
    timeDisplayMode: timeDisplayModeOr(value.timeDisplayMode, DEFAULT_SETTINGS.timeDisplayMode)
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function positiveNumberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function nonNegativeNumberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function volumeStepOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 1
    ? value
    : fallback;
}

function booleanOr(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function timeDisplayModeOr(value: unknown, fallback: TimeDisplayMode): TimeDisplayMode {
  return value === "elapsed" || value === "remaining" ? value : fallback;
}
