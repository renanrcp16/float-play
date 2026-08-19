import { describe, expect, test } from "vitest";
import {
  AUDIO_ONLY_COMPACT_HEIGHT,
  AUDIO_ONLY_COMPACT_WIDTH,
  calculateViewportResizeDelta,
  resolveAudioOnlyViewport
} from "./AudioOnlyPresentation";

describe("Audio-only presentation sizing", () => {
  test("compacts both dimensions without enlarging an already smaller window", () => {
    expect(resolveAudioOnlyViewport(480, 270)).toEqual({
      width: AUDIO_ONLY_COMPACT_WIDTH,
      height: AUDIO_ONLY_COMPACT_HEIGHT
    });
    expect(resolveAudioOnlyViewport(220, 100)).toEqual({
      width: 220,
      height: 100
    });
  });

  test("falls back to compact dimensions for invalid viewport measurements", () => {
    expect(resolveAudioOnlyViewport(0, Number.NaN)).toEqual({
      width: AUDIO_ONLY_COMPACT_WIDTH,
      height: AUDIO_ONLY_COMPACT_HEIGHT
    });
  });

  test("calculates the exact delta needed to restore a previous video viewport", () => {
    expect(calculateViewportResizeDelta(250, 120, 480, 270)).toEqual({
      width: 230,
      height: 150
    });
    expect(calculateViewportResizeDelta(220, 100, 480, 270)).toEqual({
      width: 260,
      height: 170
    });
  });
});
