import { describe, expect, test } from "vitest";
import {
  DEFAULT_CONTROL_VISIBILITY_CONFIG,
  normalizeControlVisibilityConfig,
  shouldKeepControlsVisible
} from "./ControlVisibility";

describe("control visibility rules", () => {
  test("keeps controls visible while paused or actively interacting", () => {
    expect(
      shouldKeepControlsVisible(DEFAULT_CONTROL_VISIBILITY_CONFIG, {
        paused: true,
        pointerOverControls: false,
        interactiveFocus: false
      })
    ).toBe(true);

    expect(
      shouldKeepControlsVisible(DEFAULT_CONTROL_VISIBILITY_CONFIG, {
        paused: false,
        pointerOverControls: true,
        interactiveFocus: false
      })
    ).toBe(true);

    expect(
      shouldKeepControlsVisible(DEFAULT_CONTROL_VISIBILITY_CONFIG, {
        paused: false,
        pointerOverControls: false,
        interactiveFocus: true
      })
    ).toBe(true);
  });

  test("allows controls to hide only during inactive playback", () => {
    expect(
      shouldKeepControlsVisible(DEFAULT_CONTROL_VISIBILITY_CONFIG, {
        paused: false,
        pointerOverControls: false,
        interactiveFocus: false
      })
    ).toBe(false);
  });

  test("keeps controls visible when auto-hide is disabled", () => {
    expect(
      shouldKeepControlsVisible(
        { enabled: false, delayMs: 2500 },
        { paused: false, pointerOverControls: false, interactiveFocus: false }
      )
    ).toBe(true);
  });

  test("normalizes invalid delay values to the default", () => {
    expect(normalizeControlVisibilityConfig({ enabled: true, delayMs: Number.NaN })).toEqual(
      DEFAULT_CONTROL_VISIBILITY_CONFIG
    );
  });
});
