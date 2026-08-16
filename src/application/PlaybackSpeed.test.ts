import { describe, expect, test } from "vitest";
import {
  formatPlaybackRate,
  PLAYBACK_SPEED_PRESETS,
  setMediaPlaybackRate
} from "./PlaybackSpeed";

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

  test("applies valid playback rates directly to media", () => {
    const media = { playbackRate: 1 };

    expect(setMediaPlaybackRate(media, 1.5)).toBe(true);
    expect(media.playbackRate).toBe(1.5);
  });

  test("rejects invalid playback rates without mutating media", () => {
    const media = { playbackRate: 1 };

    expect(setMediaPlaybackRate(media, Number.NaN)).toBe(false);
    expect(setMediaPlaybackRate(media, 0)).toBe(false);
    expect(media.playbackRate).toBe(1);
  });

  test("fails closed when media rejects a playback rate", () => {
    const media = {
      get playbackRate(): number {
        return 1;
      },
      set playbackRate(_value: number) {
        throw new RangeError("unsupported rate");
      }
    };

    expect(setMediaPlaybackRate(media, 1.5)).toBe(false);
  });
});
