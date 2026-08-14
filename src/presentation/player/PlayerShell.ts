import { seekBy } from "../../application/MediaSeek";
import { togglePlayback } from "../../application/MediaPlayback";
import type { TimeDisplayMode } from "../../application/Settings";
import type { Logger } from "../../shared/Logger";
import { TimelineControl } from "./TimelineControl";

export interface PlayerPlaybackLabels {
  readonly play: string;
  readonly pause: string;
  readonly backward: string;
  readonly forward: string;
  readonly timeline: string;
}

export interface PlayerPlaybackConfig {
  readonly backwardSeconds: number;
  readonly forwardSeconds: number;
  readonly timeDisplayMode: TimeDisplayMode;
}

type NavigationDirection = "backward" | "forward";

export class PlayerShell {
  private readonly lifecycle = new AbortController();
  private mounted = false;
  private playbackButton: HTMLButtonElement | null = null;
  private timelineControl: TimelineControl | null = null;

  public constructor(
    private readonly media: HTMLVideoElement,
    private readonly playerWindow: Window,
    sessionSignal: AbortSignal,
    private readonly labels: PlayerPlaybackLabels,
    private readonly config: PlayerPlaybackConfig,
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

    const buttonRow = document.createElement("div");
    buttonRow.className = "floatplay-button-row";

    const backwardButton = this.createNavigationButton(document, this.labels.backward, "backward");
    const playbackButton = document.createElement("button");
    playbackButton.type = "button";
    playbackButton.className = "floatplay-playback-button";
    const forwardButton = this.createNavigationButton(document, this.labels.forward, "forward");

    const timelineControl = new TimelineControl(
      this.media,
      document,
      this.lifecycle.signal,
      this.labels.timeline,
      this.config.timeDisplayMode,
      this.logger
    );

    buttonRow.append(backwardButton, playbackButton, forwardButton);
    controls.append(timelineControl.create(), buttonRow);
    root.append(this.media, controls);
    document.body.replaceChildren(root);

    backwardButton.addEventListener(
      "click",
      () => {
        this.navigate(-this.config.backwardSeconds);
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
        this.navigate(this.config.forwardSeconds);
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
    this.timelineControl = timelineControl;
    this.mounted = true;
    this.installStyles(document);
    this.updatePlaybackButton();
  }

  public dispose(): void {
    if (this.lifecycle.signal.aborted) {
      return;
    }

    this.timelineControl?.dispose();
    this.lifecycle.abort();
    this.playbackButton = null;
    this.timelineControl = null;
    this.mounted = false;
  }

  private createNavigationButton(
    document: Document,
    label: string,
    direction: NavigationDirection
  ): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "floatplay-playback-button floatplay-navigation-button";
    button.setAttribute("aria-label", label);
    button.title = label;
    button.append(this.createNavigationIcon(document, direction));
    return button;
  }

  private createNavigationIcon(document: Document, direction: NavigationDirection): SVGSVGElement {
    const svgNamespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNamespace, "svg");
    svg.classList.add("floatplay-navigation-icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "15");
    svg.setAttribute("height", "15");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");

    const arrow = document.createElementNS(svgNamespace, "path");
    const curve = document.createElementNS(svgNamespace, "path");

    if (direction === "backward") {
      arrow.setAttribute("d", "M9 14 4 9l5-5");
      curve.setAttribute("d", "M4 9h10.5A5.5 5.5 0 0 1 20 14.5 5.5 5.5 0 0 1 14.5 20H11");
    } else {
      arrow.setAttribute("d", "m15 14 5-5-5-5");
      curve.setAttribute("d", "M20 9H9.5A5.5 5.5 0 0 0 4 14.5 5.5 5.5 0 0 0 9.5 20H13");
    }

    svg.append(arrow, curve);
    return svg;
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
    svg.classList.add("floatplay-playback-icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "21");
    svg.setAttribute("height", "21");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("aria-hidden", "true");

    if (showPlayIcon) {
      const path = document.createElementNS(svgNamespace, "path");
      path.setAttribute("d", "M6.5 5v14l11-7z");
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
        outline: none;
      }

      .floatplay-controls {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px;
        pointer-events: none;
      }

      .floatplay-button-row {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 29px;
        gap: 8px;
      }

      .floatplay-playback-button {
        display: grid;
        place-items: center;
        flex: 0 0 29px;
        width: 29px;
        height: 29px;
        padding: 0;
        border: 0;
        border-radius: 999px;
        box-sizing: border-box;
        line-height: 0;
        color: #fff;
        background: rgb(0 0 0 / 68%);
        cursor: pointer;
        pointer-events: auto;
        transition: background-color 100ms ease;
      }

      .floatplay-playback-button:hover {
        background: rgb(0 0 0 / 58%);
      }

      .floatplay-playback-button:active {
        background: rgb(0 0 0 / 48%);
      }

      .floatplay-playback-button:focus-visible,
      .floatplay-timeline:focus-visible {
        outline: 2px solid #fff;
        outline-offset: 2px;
      }

      .floatplay-playback-icon,
      .floatplay-navigation-icon {
        display: block;
        place-self: center;
        margin: 0;
        pointer-events: none;
      }

      .floatplay-playback-icon {
        fill: currentColor;
      }

      .floatplay-navigation-icon {
        flex: none;
      }

      .floatplay-timeline-group {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        pointer-events: auto;
      }

      .floatplay-timeline {
        --floatplay-timeline-progress: 0%;
        flex: 1;
        min-width: 0;
        height: 20px;
        margin: 0;
        appearance: none;
        background: transparent;
        cursor: pointer;
      }

      .floatplay-timeline::-webkit-slider-runnable-track {
        height: 4px;
        border-radius: 999px;
        background: linear-gradient(to right, #fff 0 var(--floatplay-timeline-progress), rgb(255 255 255 / 35%) var(--floatplay-timeline-progress) 100%);
      }

      .floatplay-timeline::-webkit-slider-thumb {
        width: 12px;
        height: 12px;
        margin-top: -4px;
        appearance: none;
        border: 0;
        border-radius: 999px;
        background: #fff;
      }

      .floatplay-timeline:hover::-webkit-slider-runnable-track {
        background: linear-gradient(to right, #fff 0 var(--floatplay-timeline-progress), rgb(255 255 255 / 48%) var(--floatplay-timeline-progress) 100%);
      }

      .floatplay-timeline:disabled {
        cursor: default;
        opacity: 0.5;
      }

      .floatplay-time-display {
        flex: none;
        color: #fff;
        font: 500 12px/1.2 system-ui, sans-serif;
        font-variant-numeric: tabular-nums;
        text-shadow: 0 1px 2px rgb(0 0 0 / 75%);
        user-select: none;
      }

      @media (prefers-reduced-motion: reduce) {
        .floatplay-playback-button {
          transition: none;
        }
      }
    `;

    document.head.append(style);
  }
}
