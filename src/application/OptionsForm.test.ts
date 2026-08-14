import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS } from "./Settings";
import { optionsFormValuesToSettings, settingsToOptionsFormValues } from "./OptionsForm";

describe("options form conversions", () => {
  it("converts stored settings into user-facing units", () => {
    expect(settingsToOptionsFormValues({
      ...DEFAULT_SETTINGS,
      volumeStep: 0.1,
      autoHideDelayMs: 1250,
      timeDisplayMode: "remaining"
    })).toEqual({
      seekBackwardSeconds: 10,
      seekForwardSeconds: 10,
      volumeStepPercent: 10,
      autoHideEnabled: true,
      autoHideDelaySeconds: 1.25,
      timeDisplayMode: "remaining"
    });
  });

  it("converts valid form values back into persisted units", () => {
    expect(optionsFormValuesToSettings({
      seekBackwardSeconds: 7,
      seekForwardSeconds: 13,
      volumeStepPercent: 10,
      autoHideEnabled: false,
      autoHideDelaySeconds: 1.5,
      timeDisplayMode: "elapsed"
    })).toEqual({
      schemaVersion: 1,
      seekBackwardSeconds: 7,
      seekForwardSeconds: 13,
      volumeStep: 0.1,
      autoHideEnabled: false,
      autoHideDelayMs: 1500,
      timeDisplayMode: "elapsed"
    });
  });

  it("rejects invalid user-facing values", () => {
    expect(optionsFormValuesToSettings({
      seekBackwardSeconds: 0,
      seekForwardSeconds: 10,
      volumeStepPercent: 101,
      autoHideEnabled: true,
      autoHideDelaySeconds: -1,
      timeDisplayMode: "unknown"
    })).toBeNull();
  });
});
