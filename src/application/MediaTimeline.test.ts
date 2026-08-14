import { describe, expect, it } from "vitest";

import {
  formatMediaTime,
  formatTimelineTimeDisplay,
  getMediaTimelineState,
  seekTimelineTo,
  type TimelineRanges
} from "./MediaTimeline";

function ranges(entries: ReadonlyArray<readonly [number, number]>): TimelineRanges {
  return {
    length: entries.length,
    start: (index) => entries[index]?.[0] ?? Number.NaN,
    end: (index) => entries[index]?.[1] ?? Number.NaN
  };
}

describe("getMediaTimelineState", () => {
  it("uses finite duration when seekable ranges are unavailable", () => {
    expect(getMediaTimelineState({ currentTime: 25, duration: 100, seekable: ranges([]) })).toEqual({
      start: 0,
      end: 100,
      safeEnd: 100,
      current: 25
    });
  });

  it("uses the seekable range containing current playback", () => {
    expect(getMediaTimelineState({ currentTime: 25, duration: 100, seekable: ranges([[0, 10], [20, 40]]) })).toEqual({
      start: 20,
      end: 40,
      safeEnd: 39.5,
      current: 25
    });
  });

  it("falls back to the latest valid seekable range", () => {
    expect(getMediaTimelineState({ currentTime: 15, duration: 100, seekable: ranges([[0, 10], [20, 40]]) })?.start).toBe(20);
  });

  it("returns null when no timeline can be determined", () => {
    expect(getMediaTimelineState({ currentTime: 0, duration: Number.POSITIVE_INFINITY, seekable: ranges([]) })).toBeNull();
  });
});

describe("seekTimelineTo", () => {
  it("seeks directly inside the active range", () => {
    const media = { currentTime: 20, duration: 100, seekable: ranges([[0, 100]]) };
    expect(seekTimelineTo(media, 45)).toBe(true);
    expect(media.currentTime).toBe(45);
  });

  it("keeps timeline seeks away from the exact seekable end", () => {
    const media = { currentTime: 95, duration: 100, seekable: ranges([[0, 100]]) };
    expect(seekTimelineTo(media, 100)).toBe(true);
    expect(media.currentTime).toBe(99.5);
  });
});

describe("formatMediaTime", () => {
  it("formats minute-based media time", () => {
    expect(formatMediaTime(65.9)).toBe("1:05");
  });

  it("formats hour-based media time", () => {
    expect(formatMediaTime(3661)).toBe("1:01:01");
  });
});

describe("formatTimelineTimeDisplay", () => {
  it("shows elapsed time by default", () => {
    expect(formatTimelineTimeDisplay(65, 300, "elapsed")).toBe("1:05 / 5:00");
  });

  it("shows remaining time without changing total duration", () => {
    expect(formatTimelineTimeDisplay(65, 300, "remaining")).toBe("-3:55 / 5:00");
  });
});
