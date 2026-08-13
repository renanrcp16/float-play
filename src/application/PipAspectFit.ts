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

  const ratio = mediaWidth / mediaHeight;
  const widthAdjustment = Math.round(viewportHeight * ratio) - viewportWidth;
  const heightAdjustment = Math.round(viewportWidth / ratio) - viewportHeight;

  return Math.abs(widthAdjustment) <= Math.abs(heightAdjustment)
    ? { width: widthAdjustment, height: 0 }
    : { width: 0, height: heightAdjustment };
}
