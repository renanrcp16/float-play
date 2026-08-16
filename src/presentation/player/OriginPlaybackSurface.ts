import { togglePlayback } from "../../application/MediaPlayback";
import type { Logger } from "../../shared/Logger";
import { eventPathHasInteractiveElement } from "../InteractiveElement";

interface OriginSurfaceBounds {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

interface OriginSurfaceClickState {
  readonly button: number;
  readonly x: number;
  readonly y: number;
  readonly bounds: OriginSurfaceBounds | null;
  readonly interactiveTarget: boolean;
}

export class OriginPlaybackSurface {
  private readonly lifecycle = new AbortController();
  private mounted = false;

  public constructor(
    private readonly media: HTMLVideoElement,
    private readonly originElement: HTMLElement,
    sessionSignal: AbortSignal,
    private readonly logger: Logger
  ) {
    sessionSignal.addEventListener(
      "abort",
      () => {
        this.dispose();
      },
      { once: true }
    );
  }

  public mount(): void {
    if (this.mounted || this.lifecycle.signal.aborted) {
      return;
    }

    this.originElement.ownerDocument.addEventListener(
      "click",
      (event) => {
        this.handleClick(event);
      },
      {
        capture: true,
        signal: this.lifecycle.signal
      }
    );

    this.mounted = true;
  }

  public dispose(): void {
    if (this.lifecycle.signal.aborted) {
      return;
    }

    this.lifecycle.abort();
    this.mounted = false;
  }

  private handleClick(event: MouseEvent): void {
    if (
      !shouldToggleFromOriginSurface({
        button: event.button,
        x: event.clientX,
        y: event.clientY,
        bounds: this.getCurrentBounds(),
        interactiveTarget: eventPathHasInteractiveElement(event.composedPath())
      })
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    void togglePlayback(this.media).catch((error: unknown) => {
      this.logger.error("Unable to toggle media playback from the YouTube origin surface.", error);
    });
  }

  private getCurrentBounds(): OriginSurfaceBounds | null {
    if (!this.originElement.isConnected) {
      return null;
    }

    const rect = this.originElement.getBoundingClientRect();

    if (
      !Number.isFinite(rect.left) ||
      !Number.isFinite(rect.top) ||
      !Number.isFinite(rect.right) ||
      !Number.isFinite(rect.bottom) ||
      rect.width <= 0 ||
      rect.height <= 0
    ) {
      return null;
    }

    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom
    };
  }
}

export function shouldToggleFromOriginSurface(state: OriginSurfaceClickState): boolean {
  return (
    state.button === 0 &&
    !state.interactiveTarget &&
    state.bounds !== null &&
    isPointWithinBounds(state.x, state.y, state.bounds)
  );
}

export function isPointWithinBounds(x: number, y: number, bounds: OriginSurfaceBounds): boolean {
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(bounds.left) ||
    !Number.isFinite(bounds.top) ||
    !Number.isFinite(bounds.right) ||
    !Number.isFinite(bounds.bottom) ||
    bounds.right < bounds.left ||
    bounds.bottom < bounds.top
  ) {
    return false;
  }

  return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
}
