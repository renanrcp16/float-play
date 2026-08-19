import type { Logger } from "../../shared/Logger";

export const AUDIO_ONLY_COMPACT_WIDTH = 250;
export const AUDIO_ONLY_COMPACT_HEIGHT = 80;
export const AUDIO_ONLY_MENU_HEIGHT = 180;
export const AUDIO_ONLY_CLASS = "floatplay-audio-only";

export interface ViewportSize {
  readonly width: number;
  readonly height: number;
}

export class AudioOnlyPresentation {
  private enabled = false;
  private menuOpen = false;
  private videoViewport: ViewportSize | null = null;
  private style: HTMLStyleElement | null = null;

  public constructor(
    private readonly playerWindow: Window,
    private readonly logger: Logger
  ) {}

  public setEnabled(enabled: boolean, restoreViewport?: ViewportSize): void {
    if (this.enabled === enabled) {
      return;
    }

    const shell = this.playerWindow.document.querySelector<HTMLElement>(".floatplay-player-shell");

    if (enabled) {
      this.videoViewport = restoreViewport ?? {
        width: this.playerWindow.innerWidth,
        height: this.playerWindow.innerHeight
      };
      this.installStyles();
      shell?.classList.add(AUDIO_ONLY_CLASS);
      this.enabled = true;
      this.resizeToAudioTarget();
      return;
    }

    shell?.classList.remove(AUDIO_ONLY_CLASS);
    this.enabled = false;
    this.restoreVideoViewport();
    this.style?.remove();
    this.style = null;
  }

  public setMenuOpen(open: boolean): void {
    if (this.menuOpen === open) {
      return;
    }

    this.menuOpen = open;

    if (this.enabled) {
      this.resizeToAudioTarget();
    }
  }

  public dispose(): void {
    this.playerWindow.document
      .querySelector<HTMLElement>(".floatplay-player-shell")
      ?.classList.remove(AUDIO_ONLY_CLASS);
    this.style?.remove();
    this.style = null;
    this.videoViewport = null;
    this.enabled = false;
    this.menuOpen = false;
  }

  private resizeToAudioTarget(): void {
    const target = resolveAudioOnlyViewportSize(this.menuOpen);
    this.resizeTo(target, "Unable to resize the Picture-in-Picture window for Audio-only mode.");
  }

  private restoreVideoViewport(): void {
    const target = this.videoViewport;
    this.videoViewport = null;

    if (target !== null) {
      this.resizeTo(target, "Unable to restore the Picture-in-Picture window from Audio-only mode.");
    }
  }

  private resizeTo(target: ViewportSize, errorMessage: string): void {
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
      this.logger.error(errorMessage, error);
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

export function resolveAudioOnlyViewportSize(menuOpen: boolean): ViewportSize {
  return {
    width: AUDIO_ONLY_COMPACT_WIDTH,
    height: menuOpen ? AUDIO_ONLY_MENU_HEIGHT : AUDIO_ONLY_COMPACT_HEIGHT
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
