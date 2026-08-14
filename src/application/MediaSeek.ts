export const DEFAULT_SEEK_SECONDS = 5;
const LIVE_EDGE_GUARD_SECONDS = 0.5;

export interface SeekableRanges {
  readonly length: number;
  start(index: number): number;
  end(index: number): number;
}

export interface SeekMedia {
  currentTime: number;
  readonly duration: number;
  readonly seekable: SeekableRanges;
}

interface SeekRange {
  readonly start: number;
  readonly end: number;
}

export function seekBy(media: SeekMedia, deltaSeconds: number): boolean {
  const target = calculateSeekTarget(media.currentTime, deltaSeconds, media.seekable, media.duration);

  if (target === null) {
    return false;
  }

  media.currentTime = target;
  return true;
}

export function calculateSeekTarget(
  currentTime: number,
  deltaSeconds: number,
  seekable: SeekableRanges,
  duration: number
): number | null {
  if (!Number.isFinite(currentTime) || !Number.isFinite(deltaSeconds) || deltaSeconds === 0) {
    return null;
  }

  const requestedTime = currentTime + deltaSeconds;
  const ranges = readSeekRanges(seekable);

  if (ranges.length > 0) {
    const activeRange = findContainingRange(currentTime, ranges);

    if (activeRange !== null) {
      return clampWithinRange(requestedTime, deltaSeconds, activeRange);
    }

    const requestedRange = findContainingRange(requestedTime, ranges);

    if (requestedRange !== null) {
      return clampWithinRange(requestedTime, deltaSeconds, requestedRange);
    }

    if (deltaSeconds > 0) {
      const nextRange = ranges.find((range) => range.start > currentTime);
      return nextRange?.start ?? null;
    }

    for (let index = ranges.length - 1; index >= 0; index -= 1) {
      const range = ranges[index];

      if (range !== undefined && range.end < currentTime) {
        return getGuardedRangeEnd(range);
      }
    }

    return null;
  }

  if (Number.isFinite(duration) && duration >= 0) {
    return clamp(requestedTime, 0, duration);
  }

  return null;
}

function readSeekRanges(seekable: SeekableRanges): SeekRange[] {
  const ranges: SeekRange[] = [];

  for (let index = 0; index < seekable.length; index += 1) {
    const start = seekable.start(index);
    const end = seekable.end(index);

    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
      continue;
    }

    ranges.push({ start, end });
  }

  return ranges;
}

function findContainingRange(time: number, ranges: readonly SeekRange[]): SeekRange | null {
  return ranges.find((range) => time >= range.start && time <= range.end) ?? null;
}

function clampWithinRange(requestedTime: number, deltaSeconds: number, range: SeekRange): number {
  const maximum = deltaSeconds > 0 ? getGuardedRangeEnd(range) : range.end;
  return clamp(requestedTime, range.start, maximum);
}

function getGuardedRangeEnd(range: SeekRange): number {
  const rangeLength = range.end - range.start;

  if (rangeLength <= LIVE_EDGE_GUARD_SECONDS) {
    return range.end;
  }

  return range.end - LIVE_EDGE_GUARD_SECONDS;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
