export const PLAYBACK_SPEED_PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

export function formatPlaybackRate(rate: number): string {
  if (!Number.isFinite(rate) || rate <= 0) {
    return "1×";
  }

  return `${Number(rate.toFixed(2))}×`;
}

export function isPlaybackSpeedPreset(rate: number): boolean {
  return PLAYBACK_SPEED_PRESETS.some((preset) => Math.abs(preset - rate) < 0.001);
}
