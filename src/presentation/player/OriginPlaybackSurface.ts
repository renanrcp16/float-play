import { togglePlayback } from "../../application/MediaPlayback";
import type { Logger } from "../../shared/Logger";

const INTERACTIVE_SELECTOR = [
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "summary",
  "label",
  "[contenteditable='true']",
  "[role='button']",
  "[role='checkbox']",
  "[role='link']",
  "[role='menuitem']",
  "[role='slider']",
  "[role='switch']"
].join(",");

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
  readonly bounds: OriginSurfaceBounds;
  readonly interactiveTarget: boolean;
}

export class OriginPlaybackSurface {
  private readonly lifecycle = new AbortController();
  private mounted = false;

  public constructor(
    private readonly media: HTMLVideoElement,
    private readonly originDocument: Document,
    private readonly originBounds: OriginSurfaceBounds,
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

    this.originDocument.addEventListener(
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
        bounds: this.originBounds,
        interactiveTarget: this.isInteractiveTarget(event)
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

  private isInteractiveTarget(event: MouseEvent): boolean {
    for (const target of event.composedPath()) {
      if (target instanceof Element && target.matches(INTERACTIVE_SELECTOR)) {
        return true;
      }
    }

    return false;
  }
}

export function shouldToggleFromOriginSurface(state: OriginSurfaceClickState): boolean {
  return (
    state.button === 0 &&
    !state.interactiveTarget &&
    isPointWithinBounds(state.x, state.y, state.bounds)
  );
}

export function isPointWithinBounds(x: number, y: number, bounds: OriginSurfaceBounds): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return false;
  }

  return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
}
