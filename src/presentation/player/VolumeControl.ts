import { adjustVolume, setMediaVolume, toggleMuted } from "../../application/MediaVolume";
import type { Logger } from "../../shared/Logger";

export interface VolumeControlLabels {
  readonly volume: string;
  readonly mute: string;
  readonly unmute: string;
}

export class VolumeControl {
  public constructor(
    private readonly media: HTMLVideoElement,
    private readonly playerWindow: Window,
    private readonly signal: AbortSignal,
    private readonly labels: VolumeControlLabels,
    private readonly logger: Logger
  ) {}

  public mount(): void {
    const document = this.playerWindow.document;
    const playerRoot = document.querySelector<HTMLElement>('[data-floatplay="player-shell"]');

    if (playerRoot === null || this.signal.aborted) {
      return;
    }

    this.installStyles(document);

    const root = document.createElement("div");
    root.className = "floatplay-volume-control";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "floatplay-playback-button floatplay-volume-button";

    const sliderWrap = document.createElement("div");
    sliderWrap.className = "floatplay-volume-slider-wrap";

    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "floatplay-volume-slider";
    slider.min = "0";
    slider.max = "1";
    slider.step = "0.01";
    slider.setAttribute("aria-label", this.labels.volume);

    sliderWrap.append(slider);
    root.append(button, sliderWrap);
    playerRoot.append(root);

    button.addEventListener("click", () => toggleMuted(this.media), { signal: this.signal });
    button.addEventListener(
      "wheel",
      (event) => {
        if (event.deltaY === 0) {
          return;
        }

        event.preventDefault();
        const direction = event.deltaY < 0 ? 1 : -1;
        setMediaVolume(this.media, adjustVolume(this.media.volume, direction));
      },
      { passive: false, signal: this.signal }
    );

    slider.addEventListener(
      "input",
      () => {
        setMediaVolume(this.media, slider.valueAsNumber);
      },
      { signal: this.signal }
    );

    const sync = (): void => {
      try {
        this.syncUi(document, button, slider);
      } catch (error) {
        this.logger.error("Unable to synchronize the player volume control.", error);
      }
    };

    this.media.addEventListener("volumechange", sync, { signal: this.signal });
    this.signal.addEventListener("abort", () => root.remove(), { once: true });
    sync();
  }

  private syncUi(document: Document, button: HTMLButtonElement, slider: HTMLInputElement): void {
    const isMuted = this.media.muted;
    const effectiveMuted = isMuted || this.media.volume === 0;
    const buttonLabel = isMuted ? this.labels.unmute : this.labels.mute;

    slider.value = this.media.volume.toString();
    slider.style.setProperty("--floatplay-volume-progress", `${Math.round(this.media.volume * 100)}%`);
    button.setAttribute("aria-label", buttonLabel);
    button.title = buttonLabel;
    button.replaceChildren(this.createIcon(document, effectiveMuted, this.media.volume));
  }

  private createIcon(document: Document, muted: boolean, volume: number): SVGSVGElement {
    const namespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(namespace, "svg");
    svg.classList.add("floatplay-volume-icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "17");
    svg.setAttribute("height", "17");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");

    for (const data of ["M11 5 6 9H3v6h3l5 4V5Z"]) {
      const path = document.createElementNS(namespace, "path");
      path.setAttribute("d", data);
      svg.append(path);
    }

    if (muted) {
      for (const data of ["m16 9 5 5", "m21 9-5 5"]) {
        const path = document.createElementNS(namespace, "path");
        path.setAttribute("d", data);
        svg.append(path);
      }
      return svg;
    }

    const wave = document.createElementNS(namespace, "path");
    wave.setAttribute("d", volume > 0.5 ? "M15.5 8.5a5 5 0 0 1 0 7M18 6a8 8 0 0 1 0 12" : "M15.5 9.5a3.5 3.5 0 0 1 0 5");
    svg.append(wave);
    return svg;
  }

  private installStyles(document: Document): void {
    if (document.querySelector('style[data-floatplay="volume-control-styles"]') !== null) {
      return;
    }

    const style = document.createElement("style");
    style.dataset.floatplay = "volume-control-styles";
    style.textContent = `
      .floatplay-volume-control { position: absolute; left: 12px; bottom: 12px; z-index: 3; display: flex; align-items: center; gap: 6px; pointer-events: auto; }
      .floatplay-volume-icon { display: block; place-self: center; pointer-events: none; }
      .floatplay-volume-slider-wrap { display: flex; align-items: center; width: 0; opacity: 0; overflow: hidden; pointer-events: none; transition: width 120ms ease, opacity 100ms ease; }
      .floatplay-volume-control:hover .floatplay-volume-slider-wrap,
      .floatplay-volume-control:focus-within .floatplay-volume-slider-wrap { width: 72px; opacity: 1; pointer-events: auto; }
      .floatplay-volume-slider { --floatplay-volume-progress: 0%; width: 72px; height: 20px; margin: 0; appearance: none; background: transparent; cursor: pointer; }
      .floatplay-volume-slider::-webkit-slider-runnable-track { height: 4px; border-radius: 999px; background: linear-gradient(to right, #fff 0 var(--floatplay-volume-progress), rgb(255 255 255 / 35%) var(--floatplay-volume-progress) 100%); }
      .floatplay-volume-slider::-webkit-slider-thumb { width: 10px; height: 10px; margin-top: -3px; appearance: none; border: 0; border-radius: 999px; background: #fff; }
      .floatplay-volume-slider:focus-visible { outline: 2px solid #fff; outline-offset: 2px; border-radius: 999px; }
      @media (prefers-reduced-motion: reduce) { .floatplay-volume-slider-wrap { transition: none; } }
    `;
    document.head.append(style);
  }
}
