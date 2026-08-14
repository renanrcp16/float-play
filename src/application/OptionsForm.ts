import {
  SETTINGS_SCHEMA_VERSION,
  type FloatPlaySettings,
  type TimeDisplayMode
} from "./Settings";

export interface OptionsFormValues {
  readonly seekBackwardSeconds: number;
  readonly seekForwardSeconds: number;
  readonly volumeStepPercent: number;
  readonly autoHideEnabled: boolean;
  readonly autoHideDelaySeconds: number;
  readonly timeDisplayMode: string;
}

export function settingsToOptionsFormValues(settings: FloatPlaySettings): OptionsFormValues {
  return {
    seekBackwardSeconds: settings.seekBackwardSeconds,
    seekForwardSeconds: settings.seekForwardSeconds,
    volumeStepPercent: settings.volumeStep * 100,
    autoHideEnabled: settings.autoHideEnabled,
    autoHideDelaySeconds: settings.autoHideDelayMs / 1000,
    timeDisplayMode: settings.timeDisplayMode
  };
}

export function optionsFormValuesToSettings(values: OptionsFormValues): FloatPlaySettings | null {
  if (
    !isPositiveFinite(values.seekBackwardSeconds) ||
    !isPositiveFinite(values.seekForwardSeconds) ||
    !isVolumePercent(values.volumeStepPercent) ||
    !isNonNegativeFinite(values.autoHideDelaySeconds) ||
    !isTimeDisplayMode(values.timeDisplayMode)
  ) {
    return null;
  }

  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    seekBackwardSeconds: values.seekBackwardSeconds,
    seekForwardSeconds: values.seekForwardSeconds,
    volumeStep: values.volumeStepPercent / 100,
    autoHideEnabled: values.autoHideEnabled,
    autoHideDelayMs: values.autoHideDelaySeconds * 1000,
    timeDisplayMode: values.timeDisplayMode
  };
}

function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function isNonNegativeFinite(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function isVolumePercent(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value <= 100;
}

function isTimeDisplayMode(value: string): value is TimeDisplayMode {
  return value === "elapsed" || value === "remaining";
}
