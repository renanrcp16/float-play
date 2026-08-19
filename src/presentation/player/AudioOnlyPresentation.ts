import type { Logger } from "../../shared/Logger";

export const AUDIO_ONLY_COMPACT_WIDTH = 250;
export const AUDIO_ONLY_COMPACT_HEIGHT = 120;
export const AUDIO_ONLY_CLASS = "floatplay-audio-only";

interface ViewportSize {
  readonly width: number;
  readonly height: number;
}

export class AudioOnlyPresentation {
  private enabled = false;
  private videoViewport: ViewportSize | null = null;
  private style: HTMLStyleElement | null = null;

  public constructor(
    private readonly playerWindow: Window,
    private readonly logger: Logger
  ) {}

  public setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) {
      return;
    }

    const shell = this.playerWindow.document.querySelector<HTMLElement>(".floatplay-player-shell");

    if (enabled) {
      this.videoViewport = {
        width: this.playerWindow.innerWidth,
        height: this.playerWindow.innerHeight
      };
      this.installStyles();
      shell?.classList.add(AUDIO_ONLY_CLASS);
      this.resizeToAudioOnly();
    } else {
      shell?.classList.remove(AUDIO_ONLY_CLASS);
      this.restoreVideoViewport();
      this.style?.remove();
      this.style = null;
    }

    this.enabled = enabled;
  }

  public dispose(): void {
    this.playerWindow.document
      .querySelector<HTMLElement>(".floatplay-player-shell")
      ?.classList.remove(AUDIO_ONLY_CLASS);
    this.style?.remove();
    this.style = null;
    this.videoViewport = null;
    this.enabled = false;
  }

  private resizeToAudioOnly(): void {
    const target = resolveAudioOnlyViewport(
      this.playerWindow.innerWidth,
      this.playerWindow.innerHeight
    );
    const delta = calculateViewportResizeDelta(
      this.playerWindow.innerWidth,
      this.playerWindow.innerHeight,
      target.width,
      target.height
    );

    if (delta.width === 0 && delta.height === 0) {
      return;
    }

    try {
      this.playerWindow.resizeBy(delta.width, delta.height);
    } catch (error) {
      this.logger.error("Unable to compact the Picture-in-Picture window for Audio-only mode.", error);
    }
  }

  private restoreVideoViewport(): void {
    const target = this.videoViewport;
    this.videoViewport = null;

    if (target === null) {
      return;
    }

    const delta = calculateViewportResizeDelta(
      this.playerWindow.innerWidth,
      this.playerWindow.innerHeight,
      target.width,
      target.height
    );

    if (delta.width === 0 && delta.height === 0) {
      return;
    }

    try {
      this.playerWindow.resizeBy(delta.width, delta.height);
    } catch (error) {
      this.logger.error("Unable to restore the Picture-in-Picture window from Audio-only mode.", error);
    }
  }

  private installStyles(): void {
    if (this.style !== null) {
      return;
    }

    const style = this.playerWindow.document.createElement("style");
    style.dataset.floatplay = "audio-only-styles";
    style.textContent = `
      .floatplay-player-shell.${AUDIO_ONLY_CLASS} > video {
        opacity: 0 !important;
        pointer-events: none !important;
        cursor: default !important;
        filter: none !important;
        transition: none !important;
      }
    `;
    this.playerWindow.document.head.append(style);
    this.style = style;
  }
}

export function resolveAudioOnlyViewport(currentWidth: number, currentHeight: number): ViewportSize {
  return {
    width: resolveCompactDimension(currentWidth, AUDIO_ONLY_COMPACT_WIDTH),
    height: resolveCompactDimension(currentHeight, AUDIO_ONLY_COMPACT_HEIGHT)
  };
}

export function calculateViewportResizeDelta(
  currentWidth: number,
  currentHeight: number,
  targetWidth: number,
  targetHeight: number
): ViewportSize {
  return {
    width: Math.round(targetWidth - currentWidth),
    height: Math.round(targetHeight - currentHeight)
  };
}

function resolveCompactDimension(current: number, compact: number): number {
  if (!Number.isFinite(current) || current <= 0) {
    return compact;
  }

  return Math.min(current, compact);
}
