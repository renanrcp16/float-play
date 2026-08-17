export const DEFAULT_VOLUME_STEP = 0.05;

export interface VolumeMirror {
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
}

export function clampVolume(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

export function adjustVolume(currentVolume: number, direction: -1 | 1, step = DEFAULT_VOLUME_STEP): number {
  const safeStep = Number.isFinite(step) && step > 0 ? step : DEFAULT_VOLUME_STEP;
  return clampVolume(currentVolume + direction * safeStep);
}

export function setMediaVolume(media: HTMLMediaElement, value: number): void {
  const nextVolume = clampVolume(value);
  media.volume = nextVolume;

  if (nextVolume > 0 && media.muted) {
    media.muted = false;
  }
}
