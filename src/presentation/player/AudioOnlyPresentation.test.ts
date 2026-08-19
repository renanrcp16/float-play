import { describe, expect, test } from "vitest";
import {
  AUDIO_ONLY_COMPACT_HEIGHT,
  AUDIO_ONLY_COMPACT_WIDTH,
  AUDIO_ONLY_MENU_HEIGHT,
  AUDIO_ONLY_MENU_WIDTH,
  calculateViewportResizeDelta,
  resolveAudioOnlyViewportSize
} from "./AudioOnlyPresentation";

describe("Audio-only presentation sizing", () => {
  test("uses the compact viewport during normal Audio-only playback", () => {
    expect(resolveAudioOnlyViewportSize(false)).toEqual({
      width: AUDIO_ONLY_COMPACT_WIDTH,
      height: AUDIO_ONLY_COMPACT_HEIGHT
    });
  });

  test("temporarily expands both dimensions while the overflow menu is open", () => {
    expect(resolveAudioOnlyViewportSize(true)).toEqual({
      width: AUDIO_ONLY_MENU_WIDTH,
      height: AUDIO_ONLY_MENU_HEIGHT
    });
  });

  test("calculates the exact delta needed to move between compact and menu sizes", () => {
    expect(calculateViewportResizeDelta(250, 80, 320, 250)).toEqual({
      width: 70,
      height: 170
    });
    expect(calculateViewportResizeDelta(320, 250, 250, 80)).toEqual({
      width: -70,
      height: -170
    });
  });

  test("calculates the exact delta needed to restore a previous video viewport", () => {
    expect(calculateViewportResizeDelta(250, 80, 480, 270)).toEqual({
      width: 230,
      height: 190
    });
  });
});
