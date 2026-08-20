import { togglePlayback } from "../../application/MediaPlayback";
import type { Logger } from "../../shared/Logger";
import { eventPathHasInteractiveElementBefore } from "../InteractiveElement";

interface OriginSurfaceBounds {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

interface OriginSurfacePointerState {
  readonly x: number;
  readonly y: number;
  readonly bounds: OriginSurfaceBounds | null;
  readonly interactiveTarget: boolean;
}

interface OriginSurfaceClickState extends OriginSurfacePointerState {
  readonly button: number;
}

interface OriginClickSurface {
  readonly element: HTMLElement;
  readonly bounds: OriginSurfaceBounds;
}

export class OriginPlaybackSurface {
  private readonly lifecycle = new AbortController();
  private mounted = false;
  private cursorTarget: HTMLElement | null = null;
  private cursorTargetPreviousValue = "";

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

    const document = this.originElement.ownerDocument;

    document.addEventListener(
      "click",
      (event) => {
        this.handleClick(event);
      },
      {
        capture: true,
        signal: this.lifecycle.signal
      }
    );

    document.addEventListener(
      "pointermove",
      (event) => {
        this.handlePointerMove(event);
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

    this.restoreCursorTarget();
    this.lifecycle.abort();
    this.mounted = false;
  }

  private handleClick(event: MouseEvent): void {
    const path = event.composedPath();
    const surface = resolveOriginClickSurface(this.originElement, path);

    if (
      !shouldToggleFromOriginSurface({
        button: event.button,
        x: event.clientX,
        y: event.clientY,
        bounds: surface?.bounds ?? null,
        interactiveTarget:
          surface !== null && eventPathHasInteractiveElementBefore(path, surface.element)
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

  private handlePointerMove(event: PointerEvent): void {
    const path = event.composedPath();
    const surface = resolveOriginClickSurface(this.originElement, path);
    const shouldShowPointer = shouldShowPointerFromOriginSurface({
      x: event.clientX,
      y: event.clientY,
      bounds: surface?.bounds ?? null,
      interactiveTarget:
        surface !== null && eventPathHasInteractiveElementBefore(path, surface.element)
    });

    this.setCursorTarget(shouldShowPointer ? surface?.element ?? null : null);
  }

  private setCursorTarget(target: HTMLElement | null): void {
    if (this.cursorTarget === target) {
      return;
    }

    this.restoreCursorTarget();

    if (target === null) {
      return;
    }

    this.cursorTarget = target;
    this.cursorTargetPreviousValue = target.style.cursor;
    target.style.cursor = "pointer";
  }

  private restoreCursorTarget(): void {
    if (this.cursorTarget === null) {
      return;
    }

    this.cursorTarget.style.cursor = this.cursorTargetPreviousValue;
    this.cursorTarget = null;
    this.cursorTargetPreviousValue = "";
  }
}

export function resolveOriginClickSurface(
  originElement: HTMLElement,
  path: readonly EventTarget[]
): OriginClickSurface | null {
  if (!originElement.isConnected) {
    return null;
  }

  let candidate: HTMLElement | null = originElement;

  while (candidate !== null) {
    if (path.includes(candidate)) {
      const bounds = getCurrentBounds(candidate);

      if (bounds !== null) {
        return { element: candidate, bounds };
      }
    }

    candidate = candidate.parentElement;
  }

  return null;
}

export function shouldShowPointerFromOriginSurface(state: OriginSurfacePointerState): boolean {
  return (
    !state.interactiveTarget &&
    state.bounds !== null &&
    isPointWithinBounds(state.x, state.y, state.bounds)
  );
}

export function shouldToggleFromOriginSurface(state: OriginSurfaceClickState): boolean {
  return state.button === 0 && shouldShowPointerFromOriginSurface(state);
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

function getCurrentBounds(element: HTMLElement): OriginSurfaceBounds | null {
  if (!element.isConnected) {
    return null;
  }

  const rect = element.getBoundingClientRect();

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
