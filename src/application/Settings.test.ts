import { describe, expect, test } from "vitest";
import { DEFAULT_SETTINGS, SETTINGS_SCHEMA_VERSION, normalizeSettings } from "./Settings";

describe("settings normalization", () => {
  test("uses the approved v1 defaults when no compatible settings are stored", () => {
    expect(DEFAULT_SETTINGS).toMatchObject({
      seekBackwardSeconds: 5,
      seekForwardSeconds: 5,
      autoHideDelayMs: 1000
    });
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings({ schemaVersion: 2, seekBackwardSeconds: 30 })).toEqual(DEFAULT_SETTINGS);
  });

  test("preserves valid current-schema values and fills missing fields from defaults", () => {
    expect(
      normalizeSettings({
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        seekBackwardSeconds: 7,
        seekForwardSeconds: 11,
        volumeStep: 0.1,
        autoHideEnabled: false,
        autoHideDelayMs: 3200,
        timeDisplayMode: "remaining"
      })
    ).toEqual({
      ...DEFAULT_SETTINGS,
      seekBackwardSeconds: 7,
      seekForwardSeconds: 11,
      volumeStep: 0.1,
      autoHideEnabled: false,
      autoHideDelayMs: 3200,
      timeDisplayMode: "remaining"
    });
  });

  test("replaces invalid values independently with supported defaults", () => {
    expect(
      normalizeSettings({
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        seekBackwardSeconds: 0,
        seekForwardSeconds: Number.NaN,
        volumeStep: 1.5,
        autoHideEnabled: "yes",
        autoHideDelayMs: -1,
        timeDisplayMode: "unknown"
      })
    ).toEqual(DEFAULT_SETTINGS);
  });

  test("accepts zero delay and the maximum valid volume step", () => {
    expect(
      normalizeSettings({
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        autoHideDelayMs: 0,
        volumeStep: 1
      })
    ).toEqual({
      ...DEFAULT_SETTINGS,
      autoHideDelayMs: 0,
      volumeStep: 1
    });
  });
});
