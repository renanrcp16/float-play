import { describe, expect, it } from "vitest";

import {
  findContainingSeekableRange,
  getSafeSeekableEnd,
  readSeekableRanges,
  type MediaTimeRanges
} from "./MediaSeekableRange";

function ranges(entries: ReadonlyArray<readonly [number, number]>): MediaTimeRanges {
  return {
    length: entries.length,
    start: (index) => entries[index]?.[0] ?? Number.NaN,
    end: (index) => entries[index]?.[1] ?? Number.NaN
  };
}

describe("readSeekableRanges", () => {
  it("keeps finite ordered ranges, including zero-length ranges", () => {
    expect(readSeekableRanges(ranges([[0, 10], [15, 15]]))).toEqual([
      { start: 0, end: 10 },
      { start: 15, end: 15 }
    ]);
  });

  it("rejects non-finite and reversed ranges", () => {
    expect(
      readSeekableRanges(
        ranges([
          [Number.NaN, 10],
          [0, Number.POSITIVE_INFINITY],
          [20, 10],
          [30, 40]
        ])
      )
    ).toEqual([{ start: 30, end: 40 }]);
  });
});

describe("findContainingSeekableRange", () => {
  it("finds the range containing the requested time", () => {
    const available = readSeekableRanges(ranges([[0, 10], [20, 40]]));
    expect(findContainingSeekableRange(25, available)).toEqual({ start: 20, end: 40 });
  });

  it("returns null when the time is in a gap", () => {
    const available = readSeekableRanges(ranges([[0, 10], [20, 40]]));
    expect(findContainingSeekableRange(15, available)).toBeNull();
  });
});

describe("getSafeSeekableEnd", () => {
  it("keeps a short range end unchanged", () => {
    expect(getSafeSeekableEnd({ start: 10, end: 10.5 })).toBe(10.5);
  });

  it("keeps longer ranges half a second away from the exact end", () => {
    expect(getSafeSeekableEnd({ start: 0, end: 100 })).toBe(99.5);
  });
});
