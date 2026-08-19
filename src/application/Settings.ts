import { DEFAULT_CONTROL_VISIBILITY_CONFIG } from "./ControlVisibility";
import { DEFAULT_SEEK_SECONDS } from "./MediaSeek";
import { DEFAULT_VOLUME_STEP } from "./MediaVolume";

export const SETTINGS_SCHEMA_VERSION = 1 as const;
export const MIN_SEEK_SECONDS = 1;
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
  readonly pipVideoClickTogglesPlayback: boolean;
  readonly audioOnlyEnabled: boolean;
}

export type FloatPlaySettingsPatch = Partial<Omit<FloatPlaySettings, "schemaVersion">>;

export const DEFAULT_SETTINGS: FloatPlaySettings = {
  schemaVersion: SETTINGS_SCHEMA_VERSION,
  seekBackwardSeconds: DEFAULT_SEEK_SECONDS,
  seekForwardSeconds: DEFAULT_SEEK_SECONDS,
  volumeStep: DEFAULT_VOLUME_STEP,
  autoHideEnabled: DEFAULT_CONTROL_VISIBILITY_CONFIG.enabled,
  autoHideDelayMs: DEFAULT_CONTROL_VISIBILITY_CONFIG.delayMs,
  timeDisplayMode: "elapsed",
  pipVideoClickTogglesPlayback: false,
  audioOnlyEnabled: false
};

export function normalizeSettings(value: unknown): FloatPlaySettings {
  if (!isRecord(value) || value.schemaVersion !== SETTINGS_SCHEMA_VERSION) {
    return { ...DEFAULT_SETTINGS };
  }

  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    seekBackwardSeconds: boundedSteppedNumberOr(
      value.seekBackwardSeconds,
      MIN_SEEK_SECONDS,
      MAX_SEEK_SECONDS,
      1,
      DEFAULT_SETTINGS.seekBackwardSeconds
    ),
    seekForwardSeconds: boundedSteppedNumberOr(
      value.seekForwardSeconds,
      MIN_SEEK_SECONDS,
      MAX_SEEK_SECONDS,
      1,
      DEFAULT_SETTINGS.seekForwardSeconds
    ),
    volumeStep: boundedSteppedNumberOr(
      value.volumeStep,
      MIN_VOLUME_STEP,
      MAX_VOLUME_STEP,
      0.01,
      DEFAULT_SETTINGS.volumeStep
    ),
    autoHideEnabled: booleanOr(value.autoHideEnabled, DEFAULT_SETTINGS.autoHideEnabled),
    autoHideDelayMs: boundedSteppedNumberOr(
      value.autoHideDelayMs,
      MIN_AUTO_HIDE_DELAY_MS,
      MAX_AUTO_HIDE_DELAY_MS,
      1000,
      DEFAULT_SETTINGS.autoHideDelayMs
    ),
    timeDisplayMode: timeDisplayModeOr(value.timeDisplayMode, DEFAULT_SETTINGS.timeDisplayMode),
    pipVideoClickTogglesPlayback: booleanOr(
      value.pipVideoClickTogglesPlayback,
      DEFAULT_SETTINGS.pipVideoClickTogglesPlayback
    ),
    audioOnlyEnabled: booleanOr(value.audioOnlyEnabled, DEFAULT_SETTINGS.audioOnlyEnabled)
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedSteppedNumberOr(
  value: unknown,
  minimum: number,
  maximum: number,
  step: number,
  fallback: number
): number {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum &&
    isStepAligned(value, minimum, step)
    ? value
    : fallback;
}

function isStepAligned(value: number, minimum: number, step: number): boolean {
  const units = (value - minimum) / step;
  return Math.abs(units - Math.round(units)) < 1e-9;
}

function booleanOr(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function timeDisplayModeOr(value: unknown, fallback: TimeDisplayMode): TimeDisplayMode {
  return value === "elapsed" || value === "remaining" ? value : fallback;
}
