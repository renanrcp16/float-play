export interface AspectAdjustment {
  readonly width: number;
  readonly height: number;
}

export function calculateAspectAdjustment(
  viewportWidth: number,
  viewportHeight: number,
  mediaWidth: number,
  mediaHeight: number
): AspectAdjustment | null {
  if (
    !Number.isFinite(viewportWidth) ||
    !Number.isFinite(viewportHeight) ||
    !Number.isFinite(mediaWidth) ||
    !Number.isFinite(mediaHeight) ||
    viewportWidth <= 0 ||
    viewportHeight <= 0 ||
    mediaWidth <= 0 ||
    mediaHeight <= 0
  ) {
    return null;
  }

  const aspectRatio = mediaWidth / mediaHeight;

  if (aspectRatio >= 1) {
    return {
      width: Math.round(viewportHeight * aspectRatio) - viewportWidth,
      height: 0
    };
  }

  return {
    width: 0,
    height: Math.round(viewportWidth / aspectRatio) - viewportHeight
  };
}
