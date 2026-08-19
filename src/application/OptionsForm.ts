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
  readonly pipVideoClickTogglesPlayback: boolean;
}

export function settingsToOptionsFormValues(settings: FloatPlaySettings): OptionsFormValues {
  return {
    seekBackwardSeconds: settings.seekBackwardSeconds,
    seekForwardSeconds: settings.seekForwardSeconds,
    volumeStepPercent: settings.volumeStep * 100,
    autoHideEnabled: settings.autoHideEnabled,
    autoHideDelaySeconds: settings.autoHideDelayMs / 1000,
    pipVideoClickTogglesPlayback: settings.pipVideoClickTogglesPlayback
  };
}

export function optionsFormValuesToSettingsPatch(
  values: OptionsFormValues
): FloatPlaySettingsPatch | null {
  if (
    !isWholeNumberWithinRange(values.seekBackwardSeconds, MIN_SEEK_SECONDS, MAX_SEEK_SECONDS) ||
    !isWholeNumberWithinRange(values.seekForwardSeconds, MIN_SEEK_SECONDS, MAX_SEEK_SECONDS) ||
    !isWholeNumberWithinRange(
      values.volumeStepPercent,
      MIN_VOLUME_STEP * 100,
      MAX_VOLUME_STEP * 100
    ) ||
    !isWholeNumberWithinRange(
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
    autoHideDelayMs: values.autoHideDelaySeconds * 1000,
    pipVideoClickTogglesPlayback: values.pipVideoClickTogglesPlayback
  };
}

function isWholeNumberWithinRange(value: number, minimum: number, maximum: number): boolean {
  return Number.isInteger(value) && value >= minimum && value <= maximum;
}
