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
  test("uses the compact viewport while the overflow menu is closed", () => {
    expect(resolveAudioOnlyViewportSize(false)).toEqual({
      width: AUDIO_ONLY_COMPACT_WIDTH,
      height: AUDIO_ONLY_COMPACT_HEIGHT
    });
  });

  test("expands modestly while the overflow menu is open", () => {
    expect(resolveAudioOnlyViewportSize(true)).toEqual({
      width: AUDIO_ONLY_MENU_WIDTH,
      height: AUDIO_ONLY_MENU_HEIGHT
    });
  });

  test("calculates the exact delta between compact and menu viewports", () => {
    expect(calculateViewportResizeDelta(250, 104, 300, 144)).toEqual({
      width: 50,
      height: 40
    });
    expect(calculateViewportResizeDelta(300, 144, 250, 104)).toEqual({
      width: -50,
      height: -40
    });
  });

  test("calculates the exact delta needed to restore a previous video viewport", () => {
    expect(calculateViewportResizeDelta(250, 104, 480, 270)).toEqual({
      width: 230,
      height: 166
    });
  });
});
