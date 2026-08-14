import type { TimeDisplayMode } from "./Settings";

export interface TimelineRanges {
  readonly length: number;
  start(index: number): number;
  end(index: number): number;
}

export interface TimelineMedia {
  currentTime: number;
  readonly duration: number;
  readonly seekable: TimelineRanges;
}

export interface MediaTimelineState {
  readonly start: number;
  readonly end: number;
  readonly safeEnd: number;
  readonly current: number;
}

const EDGE_GUARD_SECONDS = 0.5;

export function getMediaTimelineState(media: TimelineMedia): MediaTimelineState | null {
  const ranges = readRanges(media.seekable);
  const range = ranges.find(([start, end]) => media.currentTime >= start && media.currentTime <= end) ?? ranges.at(-1);

  if (range !== undefined) {
    const [start, end] = range;
    return {
      start,
      end,
      safeEnd: end - start > EDGE_GUARD_SECONDS ? end - EDGE_GUARD_SECONDS : end,
      current: clamp(media.currentTime, start, end)
    };
  }

  if (Number.isFinite(media.duration) && media.duration > 0) {
    return { start: 0, end: media.duration, safeEnd: media.duration, current: clamp(media.currentTime, 0, media.duration) };
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

function readRanges(ranges: TimelineRanges): Array<readonly [number, number]> {
  const result: Array<readonly [number, number]> = [];

  for (let index = 0; index < ranges.length; index += 1) {
    const start = ranges.start(index);
    const end = ranges.end(index);
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) result.push([start, end]);
  }

  return result;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}
