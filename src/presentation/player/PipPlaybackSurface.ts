import { togglePlayback } from "../../application/MediaPlayback";
import type { Logger } from "../../shared/Logger";

interface PipVideoClickState {
  readonly enabled: boolean;
  readonly button: number;
}

interface HoverClassTarget {
  readonly classList: {
    toggle(token: string, force?: boolean): boolean;
  };
}

export const PIP_VIDEO_CLICKABLE_CLASS = "floatplay-pip-video-clickable";
export const PIP_VIDEO_HOVERED_CLASS = "floatplay-pip-video-hovered";
export const PIP_VIDEO_HOVER_OVERLAY_CLASS = "floatplay-pip-video-hover-overlay";

export class PipPlaybackSurface {
  private readonly lifecycle = new AbortController();
  private mounted = false;
  private previousCursor: string | null = null;
  private hoverStyle: HTMLStyleElement | null = null;
  private hoverOverlay: HTMLDivElement | null = null;

  public constructor(
    private readonly media: HTMLVideoElement,
    private readonly enabled: boolean,
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
    if (this.mounted || this.lifecycle.signal.aborted || !this.enabled) {
      return;
    }

    this.previousCursor = this.media.style.cursor;
    this.media.style.cursor = resolvePipVideoCursor(this.enabled);
    this.media.classList.add(PIP_VIDEO_CLICKABLE_CLASS);

    const overlay = this.installHoverFeedback();
    this.installInteractionListeners(overlay);

    this.mounted = true;
  }

  public dispose(): void {
    if (this.lifecycle.signal.aborted) {
      return;
    }

    if (this.previousCursor !== null) {
      this.media.style.cursor = this.previousCursor;
      this.previousCursor = null;
    }

    if (this.hoverOverlay !== null) {
      setPipVideoHoverFeedback(this.hoverOverlay, false);
      this.hoverOverlay.remove();
      this.hoverOverlay = null;
    }

    this.media.classList.remove(PIP_VIDEO_CLICKABLE_CLASS);
    this.hoverStyle?.remove();
    this.hoverStyle = null;
    this.lifecycle.abort();
    this.mounted = false;
  }

  private installInteractionListeners(overlay: HTMLDivElement): void {
    const document = this.media.ownerDocument;
    const signal = this.lifecycle.signal;
    const clearHover = () => {
      setPipVideoHoverFeedback(overlay, false);
    };

    overlay.addEventListener(
      "mouseenter",
      () => {
        setPipVideoHoverFeedback(overlay, true);
      },
      { signal }
    );
    overlay.addEventListener("mouseleave", clearHover, { signal });

    overlay.addEventListener(
      "click",
      (event) => {
        if (!shouldToggleFromPipVideoClick({ enabled: this.enabled, button: event.button })) {
          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        void togglePlayback(this.media).catch((error: unknown) => {
          this.logger.error("Unable to toggle media playback from the PiP video surface.", error);
        });
      },
      {
        capture: true,
        signal
      }
    );

    document.documentElement.addEventListener("mouseleave", clearHover, { signal });
    document.addEventListener(
      "mouseout",
      (event) => {
        if (shouldClearPipVideoHoverOnPointerOut(event.relatedTarget)) {
          clearHover();
        }
      },
      { capture: true, signal }
    );
    document.defaultView?.addEventListener("blur", clearHover, { signal });
  }

  private installHoverFeedback(): HTMLDivElement {
    const document = this.media.ownerDocument;
    const overlay = document.createElement("div");
    overlay.className = PIP_VIDEO_HOVER_OVERLAY_CLASS;
    overlay.setAttribute("aria-hidden", "true");
    this.media.insertAdjacentElement("afterend", overlay);

    const style = document.createElement("style");
    style.dataset.floatplay = "pip-video-click-feedback";
    style.textContent = `
      .floatplay-player-shell > .${PIP_VIDEO_HOVER_OVERLAY_CLASS} {
        position: absolute;
        inset: 0;
        background: rgb(0 0 0 / 22%);
        opacity: 0;
        cursor: pointer;
        pointer-events: auto;
        transition: opacity 120ms ease;
      }

      .floatplay-player-shell > .${PIP_VIDEO_HOVER_OVERLAY_CLASS}.${PIP_VIDEO_HOVERED_CLASS} {
        opacity: 1;
      }

      .floatplay-player-shell.floatplay-audio-only > .${PIP_VIDEO_HOVER_OVERLAY_CLASS} {
        display: none;
      }

      @media (prefers-reduced-motion: reduce) {
        .floatplay-player-shell > .${PIP_VIDEO_HOVER_OVERLAY_CLASS} {
          transition: none;
        }
      }
    `;

    document.head.append(style);
    this.hoverOverlay = overlay;
    this.hoverStyle = style;
    return overlay;
  }
}

export function shouldToggleFromPipVideoClick(state: PipVideoClickState): boolean {
  return state.enabled && state.button === 0;
}

export function resolvePipVideoCursor(enabled: boolean): string {
  return enabled ? "pointer" : "";
}

export function setPipVideoHoverFeedback(target: HoverClassTarget, hovered: boolean): void {
  target.classList.toggle(PIP_VIDEO_HOVERED_CLASS, hovered);
}

export function shouldClearPipVideoHoverOnPointerOut(relatedTarget: EventTarget | null): boolean {
  return relatedTarget === null;
}
