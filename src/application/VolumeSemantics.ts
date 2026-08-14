import { clampVolume } from "./MediaVolume";

export interface VolumeInputResolution {
  readonly volume: number;
  readonly muted: boolean;
}

export function getDisplayedVolume(volume: number, muted: boolean): number {
  return muted ? 0 : clampVolume(volume);
}

export function resolveVolumeInput(
  currentVolume: number,
  requestedVolume: number,
  interactionStartVolume?: number
): VolumeInputResolution {
  const nextVolume = clampVolume(requestedVolume);

  if (nextVolume > 0) {
    return {
      volume: nextVolume,
      muted: false
    };
  }

  const preservedVolume = clampVolume(interactionStartVolume ?? currentVolume);

  return {
    volume: preservedVolume,
    muted: true
  };
}
