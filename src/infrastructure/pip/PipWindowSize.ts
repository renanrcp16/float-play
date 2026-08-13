export interface PipWindowSize {
  readonly width: number;
  readonly height: number;
}

const TARGET_LONG_SIDE = 480;
const FALLBACK_SIZE: PipWindowSize = {
  width: 480,
  height: 270
};

export function calculateInitialPipSize(mediaWidth: number, mediaHeight: number): PipWindowSize {
  if (
    !Number.isFinite(mediaWidth) ||
    !Number.isFinite(mediaHeight) ||
    mediaWidth <= 0 ||
    mediaHeight <= 0
  ) {
    return FALLBACK_SIZE;
  }

  const aspectRatio = mediaWidth / mediaHeight;

  if (aspectRatio >= 1) {
    return {
      width: TARGET_LONG_SIDE,
      height: Math.max(1, Math.round(TARGET_LONG_SIDE / aspectRatio))
    };
  }

  return {
    width: Math.max(1, Math.round(TARGET_LONG_SIDE * aspectRatio)),
    height: TARGET_LONG_SIDE
  };
}
