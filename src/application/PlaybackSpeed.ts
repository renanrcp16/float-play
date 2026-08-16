export interface PlaybackRateMirror {
  setPlaybackRate(playbackRate: number): void;
}

export interface PlaybackRateMedia {
  playbackRate: number;
}

export const PLAYBACK_SPEED_PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

export function formatPlaybackRate(rate: number): string {
  if (!Number.isFinite(rate) || rate <= 0) {
    return "1×";
  }

  return `${Number(rate.toFixed(2))}×`;
}

export function setMediaPlaybackRate(media: PlaybackRateMedia, playbackRate: number): boolean {
  if (!Number.isFinite(playbackRate) || playbackRate <= 0) {
    return false;
  }

  try {
    media.playbackRate = playbackRate;
    return Math.abs(media.playbackRate - playbackRate) < 0.001;
  } catch {
    return false;
  }
}
