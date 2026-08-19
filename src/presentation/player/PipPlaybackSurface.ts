import { togglePlayback } from "../../application/MediaPlayback";
import type { Logger } from "../../shared/Logger";

interface PipVideoClickState {
  readonly enabled: boolean;
  readonly button: number;
}

export const PIP_VIDEO_CLICKABLE_CLASS = "floatplay-pip-video-clickable";

export class PipPlaybackSurface {
  private readonly lifecycle = new AbortController();
  private mounted = false;
  private previousCursor: string | null = null;

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

    this.media.addEventListener(
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
        signal: this.lifecycle.signal
      }
    );

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

    this.media.classList.remove(PIP_VIDEO_CLICKABLE_CLASS);
    this.lifecycle.abort();
    this.mounted = false;
  }
}

export function shouldToggleFromPipVideoClick(state: PipVideoClickState): boolean {
  return state.enabled && state.button === 0;
}

export function resolvePipVideoCursor(enabled: boolean): string {
  return enabled ? "pointer" : "";
}
