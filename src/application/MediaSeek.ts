export const DEFAULT_SEEK_SECONDS = 10;
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
  const activeRange = findActiveSeekRange(currentTime, seekable);

  if (activeRange !== null) {
    if (deltaSeconds > 0) {
      const guardedEnd = getGuardedRangeEnd(activeRange);
      return clamp(requestedTime, activeRange.start, guardedEnd);
    }

    return clamp(requestedTime, activeRange.start, activeRange.end);
  }

  if (Number.isFinite(duration) && duration >= 0) {
    return clamp(requestedTime, 0, duration);
  }

  return null;
}

function findActiveSeekRange(currentTime: number, seekable: SeekableRanges): SeekRange | null {
  for (let index = 0; index < seekable.length; index += 1) {
    const start = seekable.start(index);
    const end = seekable.end(index);

    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
      continue;
    }

    if (currentTime >= start && currentTime <= end) {
      return { start, end };
    }
  }

  return null;
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
