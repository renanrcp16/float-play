import { describe, expect, test } from "vitest";
import {
  AUDIO_ONLY_COMPACT_HEIGHT,
  calculateViewportResizeDelta,
  resolveAudioOnlyHeight
} from "./AudioOnlyPresentation";

describe("Audio-only presentation sizing", () => {
  test("compacts a normal video viewport without enlarging an already smaller window", () => {
    expect(resolveAudioOnlyHeight(270)).toBe(AUDIO_ONLY_COMPACT_HEIGHT);
    expect(resolveAudioOnlyHeight(120)).toBe(120);
  });

  test("falls back to the compact height for invalid viewport measurements", () => {
    expect(resolveAudioOnlyHeight(0)).toBe(AUDIO_ONLY_COMPACT_HEIGHT);
    expect(resolveAudioOnlyHeight(Number.NaN)).toBe(AUDIO_ONLY_COMPACT_HEIGHT);
  });

  test("calculates the exact delta needed to restore a previous video viewport", () => {
    expect(calculateViewportResizeDelta(480, 160, 480, 270)).toEqual({
      width: 0,
      height: 110
    });
    expect(calculateViewportResizeDelta(420, 160, 480, 270)).toEqual({
      width: 60,
      height: 110
    });
  });
});
