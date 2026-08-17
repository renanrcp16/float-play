export const LIVE_EDGE_GUARD_SECONDS = 0.5;

export interface MediaTimeRanges {
  readonly length: number;
  start(index: number): number;
  end(index: number): number;
}

export interface MediaSeekableRange {
  readonly start: number;
  readonly end: number;
}

export function readSeekableRanges(ranges: MediaTimeRanges): MediaSeekableRange[] {
  const result: MediaSeekableRange[] = [];

  for (let index = 0; index < ranges.length; index += 1) {
    const start = ranges.start(index);
    const end = ranges.end(index);

    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
      continue;
    }

    result.push({ start, end });
  }

  return result;
}

export function findContainingSeekableRange(
  time: number,
  ranges: readonly MediaSeekableRange[]
): MediaSeekableRange | null {
  return ranges.find((range) => time >= range.start && time <= range.end) ?? null;
}

export function getSafeSeekableEnd(range: MediaSeekableRange): number {
  const rangeLength = range.end - range.start;

  if (rangeLength <= LIVE_EDGE_GUARD_SECONDS) {
    return range.end;
  }

  return range.end - LIVE_EDGE_GUARD_SECONDS;
}
