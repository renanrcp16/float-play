import { describe, expect, test } from "vitest";
import {
  AUDIO_ONLY_COMPACT_HEIGHT,
  AUDIO_ONLY_COMPACT_WIDTH,
  AUDIO_ONLY_MENU_HEIGHT,
  calculateViewportResizeDelta,
  resolveAudioOnlyViewportSize
} from "./AudioOnlyPresentation";

describe("Audio-only presentation sizing", () => {
  test("uses the compact viewport while controls are visible", () => {
    expect(resolveAudioOnlyViewportSize(false)).toEqual({
      width: AUDIO_ONLY_COMPACT_WIDTH,
      height: AUDIO_ONLY_COMPACT_HEIGHT
    });
  });

  test("temporarily expands vertically while the overflow menu is open", () => {
    expect(resolveAudioOnlyViewportSize(true)).toEqual({
      width: AUDIO_ONLY_COMPACT_WIDTH,
      height: AUDIO_ONLY_MENU_HEIGHT
    });
  });

  test("calculates the exact delta needed to move between compact and menu sizes", () => {
    expect(calculateViewportResizeDelta(250, 80, 250, 180)).toEqual({
      width: 0,
      height: 100
    });
    expect(calculateViewportResizeDelta(250, 180, 250, 80)).toEqual({
      width: 0,
      height: -100
    });
  });

  test("calculates the exact delta needed to restore a previous video viewport", () => {
    expect(calculateViewportResizeDelta(250, 80, 480, 270)).toEqual({
      width: 230,
      height: 190
    });
  });
});
