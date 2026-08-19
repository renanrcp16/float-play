import { describe, expect, test } from "vitest";
import {
  AUDIO_ONLY_COMPACT_HEIGHT,
  AUDIO_ONLY_COMPACT_WIDTH,
  calculateViewportResizeDelta,
  resolveAudioOnlyViewportSize
} from "./AudioOnlyPresentation";

describe("Audio-only presentation sizing", () => {
  test("uses one fixed compact viewport while Audio-only mode is active", () => {
    expect(resolveAudioOnlyViewportSize()).toEqual({
      width: AUDIO_ONLY_COMPACT_WIDTH,
      height: AUDIO_ONLY_COMPACT_HEIGHT
    });
  });

  test("calculates the exact delta needed to restore a previous video viewport", () => {
    expect(calculateViewportResizeDelta(250, 80, 480, 270)).toEqual({
      width: 230,
      height: 190
    });
  });
});
