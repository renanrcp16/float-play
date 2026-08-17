import { DEFAULT_CONTROL_VISIBILITY_CONFIG } from "./ControlVisibility";
import { DEFAULT_SEEK_SECONDS } from "./MediaSeek";
import { DEFAULT_VOLUME_STEP } from "./MediaVolume";

export const SETTINGS_SCHEMA_VERSION = 1 as const;
export const MIN_SEEK_SECONDS = 0.1;
export const MAX_SEEK_SECONDS = 600;
export const MIN_VOLUME_STEP = 0.01;
export const MAX_VOLUME_STEP = 1;
export const MIN_AUTO_HIDE_DELAY_MS = 0;
export const MAX_AUTO_HIDE_DELAY_MS = 60_000;

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

export type FloatPlaySettingsPatch = Partial<Omit<FloatPlaySettings, "schemaVersion">>;

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
    seekBackwardSeconds: boundedNumberOr(
      value.seekBackwardSeconds,
      MIN_SEEK_SECONDS,
      MAX_SEEK_SECONDS,
      DEFAULT_SETTINGS.seekBackwardSeconds
    ),
    seekForwardSeconds: boundedNumberOr(
      value.seekForwardSeconds,
      MIN_SEEK_SECONDS,
      MAX_SEEK_SECONDS,
      DEFAULT_SETTINGS.seekForwardSeconds
    ),
    volumeStep: boundedNumberOr(
      value.volumeStep,
      MIN_VOLUME_STEP,
      MAX_VOLUME_STEP,
      DEFAULT_SETTINGS.volumeStep
    ),
    autoHideEnabled: booleanOr(value.autoHideEnabled, DEFAULT_SETTINGS.autoHideEnabled),
    autoHideDelayMs: boundedNumberOr(
      value.autoHideDelayMs,
      MIN_AUTO_HIDE_DELAY_MS,
      MAX_AUTO_HIDE_DELAY_MS,
      DEFAULT_SETTINGS.autoHideDelayMs
    ),
    timeDisplayMode: timeDisplayModeOr(value.timeDisplayMode, DEFAULT_SETTINGS.timeDisplayMode)
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedNumberOr(value: unknown, minimum: number, maximum: number, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum
    ? value
    : fallback;
}

function booleanOr(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function timeDisplayModeOr(value: unknown, fallback: TimeDisplayMode): TimeDisplayMode {
  return value === "elapsed" || value === "remaining" ? value : fallback;
}
