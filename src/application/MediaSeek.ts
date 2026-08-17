import {
  findContainingSeekableRange,
  getSafeSeekableEnd,
  readSeekableRanges,
  type MediaSeekableRange,
  type MediaTimeRanges
} from "./MediaSeekableRange";

export const DEFAULT_SEEK_SECONDS = 5;

export interface SeekMedia {
  currentTime: number;
  readonly duration: number;
  readonly seekable: MediaTimeRanges;
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
  seekable: MediaTimeRanges,
  duration: number
): number | null {
  if (!Number.isFinite(currentTime) || !Number.isFinite(deltaSeconds) || deltaSeconds === 0) {
    return null;
  }

  const requestedTime = currentTime + deltaSeconds;
  const ranges = readSeekableRanges(seekable);

  if (ranges.length > 0) {
    const activeRange = findContainingSeekableRange(currentTime, ranges);

    if (activeRange !== null) {
      return clampWithinRange(requestedTime, deltaSeconds, activeRange);
    }

    const requestedRange = findContainingSeekableRange(requestedTime, ranges);

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
        return getSafeSeekableEnd(range);
      }
    }

    return null;
  }

  if (Number.isFinite(duration) && duration >= 0) {
    return clamp(requestedTime, 0, duration);
  }

  return null;
}

function clampWithinRange(
  requestedTime: number,
  deltaSeconds: number,
  range: MediaSeekableRange
): number {
  const maximum = deltaSeconds > 0 ? getSafeSeekableEnd(range) : range.end;
  return clamp(requestedTime, range.start, maximum);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
