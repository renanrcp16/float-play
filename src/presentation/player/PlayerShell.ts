import { DEFAULT_SEEK_SECONDS, seekBy } from "../../application/MediaSeek";
import { togglePlayback } from "../../application/MediaPlayback";
import type { Logger } from "../../shared/Logger";

export interface PlayerPlaybackLabels {
  readonly play: string;
  readonly pause: string;
  readonly backward: string;
  readonly forward: string;
}

export class PlayerShell {
  private readonly lifecycle = new AbortController();
  private mounted = false;
  private playbackButton: HTMLButtonElement | null = null;

  public constructor(
    private readonly media: HTMLVideoElement,
    private readonly playerWindow: Window,
    sessionSignal: AbortSignal,
    private readonly labels: PlayerPlaybackLabels,
    private readonly logger: Logger
  ) {
    sessionSignal.addEventListener(
      "abort",
      () => {
        this.dispose();
      },
      {
        once: true,
        signal: this.lifecycle.signal
      }
    );
  }

  public mount(): void {
    if (this.mounted || this.lifecycle.signal.aborted) {
      return;
    }

    const document = this.playerWindow.document;
    const root = document.createElement("div");
    root.dataset.floatplay = "player-shell";
    root.className = "floatplay-player-shell";

    const controls = document.createElement("div");
    controls.className = "floatplay-controls";

    const backwardButton = this.createNavigationButton(document, this.labels.backward, `-${DEFAULT_SEEK_SECONDS}`);
    const playbackButton = document.createElement("button");
    playbackButton.type = "button";
    playbackButton.className = "floatplay-playback-button";
    const forwardButton = this.createNavigationButton(document, this.labels.forward, `+${DEFAULT_SEEK_SECONDS}`);

    controls.append(backwardButton, playbackButton, forwardButton);
    root.append(this.media, controls);
    document.body.replaceChildren(root);

    backwardButton.addEventListener(
      "click",
      () => {
        this.navigate(-DEFAULT_SEEK_SECONDS);
      },
      { signal: this.lifecycle.signal }
    );

    playbackButton.addEventListener(
      "click",
      () => {
        this.togglePlayback();
      },
      { signal: this.lifecycle.signal }
    );

    forwardButton.addEventListener(
      "click",
      () => {
        this.navigate(DEFAULT_SEEK_SECONDS);
      },
      { signal: this.lifecycle.signal }
    );

    for (const eventName of ["play", "pause", "ended"] as const) {
      this.media.addEventListener(
        eventName,
        () => {
          this.updatePlaybackButton();
        },
        { signal: this.lifecycle.signal }
      );
    }

    this.playbackButton = playbackButton;
    this.mounted = true;
    this.installStyles(document);
    this.updatePlaybackButton();
  }

  public dispose(): void {
    if (this.lifecycle.signal.aborted) {
      return;
    }

    this.lifecycle.abort();
    this.playbackButton = null;
    this.mounted = false;
  }

  private createNavigationButton(document: Document, label: string, text: string): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "floatplay-playback-button floatplay-navigation-button";
    button.setAttribute("aria-label", label);
    button.title = label;
    button.textContent = text;
    return button;
  }

  private navigate(deltaSeconds: number): void {
    try {
      if (!seekBy(this.media, deltaSeconds)) {
        this.logger.debug("No safe media navigation target is currently available.");
      }
    } catch (error) {
      this.logger.error("Unable to navigate media from the player window.", error);
    }
  }

  private togglePlayback(): void {
    void togglePlayback(this.media).catch((error: unknown) => {
      this.logger.error("Unable to toggle media playback from the player window.", error);
    });
  }

  private updatePlaybackButton(): void {
    const button = this.playbackButton;

    if (button === null) {
      return;
    }

    const isPaused = this.media.paused;
    const label = isPaused ? this.labels.play : this.labels.pause;

    button.setAttribute("aria-label", label);
    button.title = label;
    button.replaceChildren(this.createPlaybackIcon(button.ownerDocument, isPaused));
  }

  private createPlaybackIcon(document: Document, showPlayIcon: boolean): SVGSVGElement {
    const svgNamespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNamespace, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("aria-hidden", "true");

    if (showPlayIcon) {
      const path = document.createElementNS(svgNamespace, "path");
      path.setAttribute("d", "M8 5v14l11-7z");
      svg.append(path);
      return svg;
    }

    const left = document.createElementNS(svgNamespace, "path");
    left.setAttribute("d", "M7 5h4v14H7z");
    const right = document.createElementNS(svgNamespace, "path");
    right.setAttribute("d", "M13 5h4v14h-4z");
    svg.append(left, right);

    return svg;
  }

  private installStyles(document: Document): void {
    const style = document.createElement("style");
    style.dataset.floatplay = "player-shell-styles";
    style.textContent = `
      .floatplay-player-shell {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #000;
      }

      .floatplay-player-shell > video {
        display: block;
        width: 100% !important;
        height: 100% !important;
        max-width: none !important;
        max-height: none !important;
        object-fit: contain !important;
      }

      .floatplay-controls {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: flex-end;
        gap: 8px;
        padding: 12px;
        pointer-events: none;
      }

      .floatplay-playback-button {
        display: inline-grid;
        width: 40px;
        height: 40px;
        padding: 0;
        place-items: center;
        border: 0;
        border-radius: 999px;
        color: #fff;
        background: rgb(0 0 0 / 68%);
        cursor: pointer;
        pointer-events: auto;
      }

      .floatplay-playback-button:hover {
        background: rgb(0 0 0 / 82%);
      }

      .floatplay-playback-button:focus-visible {
        outline: 2px solid #fff;
        outline-offset: 2px;
      }

      .floatplay-navigation-button {
        font: 700 12px/1 system-ui, sans-serif;
      }

      .floatplay-playback-button svg {
        fill: currentColor;
        pointer-events: none;
      }
    `;

    document.head.append(style);
  }
}
