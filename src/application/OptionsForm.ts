import type { FloatPlaySettings, FloatPlaySettingsPatch } from "./Settings";

export interface OptionsFormValues {
  readonly seekBackwardSeconds: number;
  readonly seekForwardSeconds: number;
  readonly volumeStepPercent: number;
  readonly autoHideEnabled: boolean;
  readonly autoHideDelaySeconds: number;
}

export function settingsToOptionsFormValues(settings: FloatPlaySettings): OptionsFormValues {
  return {
    seekBackwardSeconds: settings.seekBackwardSeconds,
    seekForwardSeconds: settings.seekForwardSeconds,
    volumeStepPercent: settings.volumeStep * 100,
    autoHideEnabled: settings.autoHideEnabled,
    autoHideDelaySeconds: settings.autoHideDelayMs / 1000
  };
}

export function optionsFormValuesToSettingsPatch(
  values: OptionsFormValues
): FloatPlaySettingsPatch | null {
  if (
    !isPositiveFinite(values.seekBackwardSeconds) ||
    !isPositiveFinite(values.seekForwardSeconds) ||
    !isVolumePercent(values.volumeStepPercent) ||
    !isNonNegativeFinite(values.autoHideDelaySeconds)
  ) {
    return null;
  }

  return {
    seekBackwardSeconds: values.seekBackwardSeconds,
    seekForwardSeconds: values.seekForwardSeconds,
    volumeStep: values.volumeStepPercent / 100,
    autoHideEnabled: values.autoHideEnabled,
    autoHideDelayMs: values.autoHideDelaySeconds * 1000
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
