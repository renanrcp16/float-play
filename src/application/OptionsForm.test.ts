import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS, MAX_AUTO_HIDE_DELAY_MS, MAX_SEEK_SECONDS } from "./Settings";
import { optionsFormValuesToSettingsPatch, settingsToOptionsFormValues } from "./OptionsForm";

describe("options form conversions", () => {
  it("converts stored settings into user-facing units", () => {
    expect(settingsToOptionsFormValues({
      ...DEFAULT_SETTINGS,
      volumeStep: 0.1,
      autoHideDelayMs: 1250,
      timeDisplayMode: "remaining"
    })).toEqual({
      seekBackwardSeconds: 5,
      seekForwardSeconds: 5,
      volumeStepPercent: 10,
      autoHideEnabled: true,
      autoHideDelaySeconds: 1.25
    });
  });

  it("converts valid form values into only the settings owned by the options page", () => {
    expect(optionsFormValuesToSettingsPatch({
      seekBackwardSeconds: 7,
      seekForwardSeconds: 13,
      volumeStepPercent: 10,
      autoHideEnabled: false,
      autoHideDelaySeconds: 1.5
    })).toEqual({
      seekBackwardSeconds: 7,
      seekForwardSeconds: 13,
      volumeStep: 0.1,
      autoHideEnabled: false,
      autoHideDelayMs: 1500
    });
  });

  it("rejects invalid user-facing values", () => {
    expect(optionsFormValuesToSettingsPatch({
      seekBackwardSeconds: 0,
      seekForwardSeconds: 10,
      volumeStepPercent: 101,
      autoHideEnabled: true,
      autoHideDelaySeconds: -1
    })).toBeNull();
  });

  it("rejects finite values above the supported seek and auto-hide limits", () => {
    expect(optionsFormValuesToSettingsPatch({
      seekBackwardSeconds: MAX_SEEK_SECONDS + 0.1,
      seekForwardSeconds: 10,
      volumeStepPercent: 5,
      autoHideEnabled: true,
      autoHideDelaySeconds: MAX_AUTO_HIDE_DELAY_MS / 1000 + 0.1
    })).toBeNull();
  });
});
