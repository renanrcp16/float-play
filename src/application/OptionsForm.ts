import {
  MAX_AUTO_HIDE_DELAY_MS,
  MAX_SEEK_SECONDS,
  MAX_VOLUME_STEP,
  MIN_AUTO_HIDE_DELAY_MS,
  MIN_SEEK_SECONDS,
  MIN_VOLUME_STEP,
  type FloatPlaySettings,
  type FloatPlaySettingsPatch
} from "./Settings";

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
    !isWithinRange(values.seekBackwardSeconds, MIN_SEEK_SECONDS, MAX_SEEK_SECONDS) ||
    !isWithinRange(values.seekForwardSeconds, MIN_SEEK_SECONDS, MAX_SEEK_SECONDS) ||
    !isWithinRange(values.volumeStepPercent, MIN_VOLUME_STEP * 100, MAX_VOLUME_STEP * 100) ||
    !isWithinRange(
      values.autoHideDelaySeconds,
      MIN_AUTO_HIDE_DELAY_MS / 1000,
      MAX_AUTO_HIDE_DELAY_MS / 1000
    )
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

function isWithinRange(value: number, minimum: number, maximum: number): boolean {
  return Number.isFinite(value) && value >= minimum && value <= maximum;
}
