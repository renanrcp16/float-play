import { describe, expect, test } from "vitest";
import { formatPlaybackRate, PLAYBACK_SPEED_PRESETS } from "./PlaybackSpeed";

describe("playback speed rules", () => {
  test("exposes the v1 preset range", () => {
    expect(PLAYBACK_SPEED_PRESETS).toEqual([0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]);
    expect(PLAYBACK_SPEED_PRESETS).not.toContain(4);
  });

  test("formats preset and external playback rates", () => {
    expect(formatPlaybackRate(1)).toBe("1×");
    expect(formatPlaybackRate(1.25)).toBe("1.25×");
    expect(formatPlaybackRate(4)).toBe("4×");
  });
});
