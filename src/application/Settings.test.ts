import { describe, expect, test } from "vitest";
import {
  DEFAULT_SETTINGS,
  MAX_AUTO_HIDE_DELAY_MS,
  MAX_SEEK_SECONDS,
  MAX_VOLUME_STEP,
  MIN_AUTO_HIDE_DELAY_MS,
  MIN_SEEK_SECONDS,
  MIN_VOLUME_STEP,
  SETTINGS_SCHEMA_VERSION,
  normalizeSettings
} from "./Settings";

describe("settings normalization", () => {
  test("uses the approved defaults when no compatible settings are stored", () => {
    expect(DEFAULT_SETTINGS).toMatchObject({
      seekBackwardSeconds: 5,
      seekForwardSeconds: 5,
      autoHideDelayMs: 1000,
      pipVideoClickTogglesPlayback: false
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
        autoHideDelayMs: 3000,
        timeDisplayMode: "remaining",
        pipVideoClickTogglesPlayback: true
      })
    ).toEqual({
      ...DEFAULT_SETTINGS,
      seekBackwardSeconds: 7,
      seekForwardSeconds: 11,
      volumeStep: 0.1,
      autoHideEnabled: false,
      autoHideDelayMs: 3000,
      timeDisplayMode: "remaining",
      pipVideoClickTogglesPlayback: true
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
        timeDisplayMode: "unknown",
        pipVideoClickTogglesPlayback: "yes"
      })
    ).toEqual(DEFAULT_SETTINGS);
  });

  test("rejects values that do not align with whole user-facing steps", () => {
    expect(
      normalizeSettings({
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        seekBackwardSeconds: 7.5,
        seekForwardSeconds: 8.5,
        volumeStep: 0.055,
        autoHideDelayMs: 1500
      })
    ).toEqual(DEFAULT_SETTINGS);
  });

  test("accepts the supported boundary values", () => {
    expect(
      normalizeSettings({
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        seekBackwardSeconds: MIN_SEEK_SECONDS,
        seekForwardSeconds: MAX_SEEK_SECONDS,
        volumeStep: MIN_VOLUME_STEP,
        autoHideDelayMs: MIN_AUTO_HIDE_DELAY_MS
      })
    ).toEqual({
      ...DEFAULT_SETTINGS,
      seekBackwardSeconds: MIN_SEEK_SECONDS,
      seekForwardSeconds: MAX_SEEK_SECONDS,
      volumeStep: MIN_VOLUME_STEP,
      autoHideDelayMs: MIN_AUTO_HIDE_DELAY_MS
    });

    expect(
      normalizeSettings({
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        volumeStep: MAX_VOLUME_STEP,
        autoHideDelayMs: MAX_AUTO_HIDE_DELAY_MS
      })
    ).toEqual({
      ...DEFAULT_SETTINGS,
      volumeStep: MAX_VOLUME_STEP,
      autoHideDelayMs: MAX_AUTO_HIDE_DELAY_MS
    });
  });

  test("rejects finite values outside the supported upper and lower bounds", () => {
    expect(
      normalizeSettings({
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        seekBackwardSeconds: MIN_SEEK_SECONDS - 1,
        seekForwardSeconds: MAX_SEEK_SECONDS + 1,
        volumeStep: MIN_VOLUME_STEP / 2,
        autoHideDelayMs: MAX_AUTO_HIDE_DELAY_MS + 1000
      })
    ).toEqual(DEFAULT_SETTINGS);
  });
});
