import {
  findContainingSeekableRange,
  getSafeSeekableEnd,
  readSeekableRanges,
  type MediaTimeRanges
} from "./MediaSeekableRange";
import type { TimeDisplayMode } from "./Settings";

export interface TimelineMedia {
  currentTime: number;
  readonly duration: number;
  readonly seekable: MediaTimeRanges;
}

export interface MediaTimelineState {
  readonly start: number;
  readonly end: number;
  readonly safeEnd: number;
  readonly current: number;
}

export function getMediaTimelineState(media: TimelineMedia): MediaTimelineState | null {
  const ranges = readSeekableRanges(media.seekable).filter((range) => range.end > range.start);
  const range = findContainingSeekableRange(media.currentTime, ranges) ?? ranges.at(-1);

  if (range !== undefined && range !== null) {
    return {
      start: range.start,
      end: range.end,
      safeEnd: getSafeSeekableEnd(range),
      current: clamp(media.currentTime, range.start, range.end)
    };
  }

  if (Number.isFinite(media.duration) && media.duration > 0) {
    return {
      start: 0,
      end: media.duration,
      safeEnd: media.duration,
      current: clamp(media.currentTime, 0, media.duration)
    };
  }

  return null;
}

export function seekTimelineTo(media: TimelineMedia, time: number): boolean {
  const state = getMediaTimelineState(media);

  if (state === null || !Number.isFinite(time)) {
    return false;
  }

  media.currentTime = clamp(time, state.start, state.safeEnd);
  return true;
}

export function formatMediaTime(seconds: number): string {
  const value = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const remainder = value % 60;
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(remainder)}` : `${minutes}:${pad(remainder)}`;
}

export function formatTimelineTimeDisplay(
  elapsedSeconds: number,
  totalSeconds: number,
  mode: TimeDisplayMode
): string {
  const elapsed = Number.isFinite(elapsedSeconds) ? Math.max(elapsedSeconds, 0) : 0;
  const total = Number.isFinite(totalSeconds) ? Math.max(totalSeconds, 0) : 0;
  const primary =
    mode === "remaining"
      ? `-${formatMediaTime(Math.max(total - elapsed, 0))}`
      : formatMediaTime(elapsed);

  return `${primary} / ${formatMediaTime(total)}`;
}

export function getNextTimeDisplayMode(mode: TimeDisplayMode): TimeDisplayMode {
  return mode === "elapsed" ? "remaining" : "elapsed";
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}
