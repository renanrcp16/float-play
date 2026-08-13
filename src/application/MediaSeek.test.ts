import { describe, expect, it } from "vitest";

import { calculateSeekTarget, seekBy, type SeekableRanges } from "./MediaSeek";

function createRanges(entries: ReadonlyArray<readonly [number, number]>): SeekableRanges {
  return {
    length: entries.length,
    start: (index) => {
      const entry = entries[index];

      if (entry === undefined) {
        throw new RangeError("Invalid seekable range index.");
      }

      return entry[0];
    },
    end: (index) => {
      const entry = entries[index];

      if (entry === undefined) {
        throw new RangeError("Invalid seekable range index.");
      }

      return entry[1];
    }
  };
}

describe("calculateSeekTarget", () => {
  it("seeks backward within the active range", () => {
    expect(calculateSeekTarget(50, -10, createRanges([[0, 100]]), 100)).toBe(40);
  });

  it("seeks forward within the active range", () => {
    expect(calculateSeekTarget(50, 10, createRanges([[0, 100]]), 100)).toBe(60);
  });

  it("clamps backward seeks to the active range start", () => {
    expect(calculateSeekTarget(5, -10, createRanges([[0, 100]]), 100)).toBe(0);
  });

  it("keeps forward seeks inside the reported range end", () => {
    expect(calculateSeekTarget(95, 10, createRanges([[0, 100]]), 100)).toBe(99.5);
  });

  it("uses the next valid range when the current time is in a gap", () => {
    expect(calculateSeekTarget(15, 1, createRanges([[0, 10], [20, 30]]), 30)).toBe(20);
  });

  it("uses the previous valid range conservatively when seeking backward from a gap", () => {
    expect(calculateSeekTarget(15, -1, createRanges([[0, 10], [20, 30]]), 30)).toBe(9.5);
  });

  it("falls back to finite duration when no seekable range exists", () => {
    expect(calculateSeekTarget(95, 10, createRanges([]), 100)).toBe(100);
  });

  it("returns null when no safe target can be determined", () => {
    expect(calculateSeekTarget(10, 10, createRanges([]), Number.POSITIVE_INFINITY)).toBeNull();
  });
});

describe("seekBy", () => {
  it("updates currentTime when a safe target exists", () => {
    const media = {
      currentTime: 50,
      duration: 100,
      seekable: createRanges([[0, 100]])
    };

    expect(seekBy(media, -10)).toBe(true);
    expect(media.currentTime).toBe(40);
  });

  it("does not update currentTime when no safe target exists", () => {
    const media = {
      currentTime: 50,
      duration: Number.POSITIVE_INFINITY,
      seekable: createRanges([])
    };

    expect(seekBy(media, 10)).toBe(false);
    expect(media.currentTime).toBe(50);
  });
});
