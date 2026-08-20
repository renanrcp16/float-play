import { adjustVolume, setMediaVolume } from "../../application/MediaVolume";
import type { VolumeMirror } from "../../application/MediaVolume";
import { getDisplayedVolume, resolveVolumeInput } from "../../application/VolumeSemantics";
import type { Logger } from "../../shared/Logger";

export interface VolumeControlLabels {
  readonly volume: string;
  readonly mute: string;
  readonly unmute: string;
}

export type VolumeControlLayout = "inline" | "compact";
export const COMPACT_VOLUME_MAX_WIDTH = 320;

export function resolveVolumeControlLayout(viewportWidth: number): VolumeControlLayout {
  return Number.isFinite(viewportWidth) && viewportWidth <= COMPACT_VOLUME_MAX_WIDTH
    ? "compact"
    : "inline";
}

export class VolumeControl {
  private sliderInteractionStartVolume: number | null = null;

  public constructor(
    private readonly media: HTMLVideoElement,
    private readonly playerWindow: Window,
    private readonly signal: AbortSignal,
    private readonly labels: VolumeControlLabels,
    private readonly volumeMirror: VolumeMirror,
    private readonly volumeStep: number,
    private readonly logger: Logger
  ) {}

  public mount(): void {
    const document = this.playerWindow.document;
    const controls = document.querySelector<HTMLElement>(".floatplay-controls");
    const buttonRow = controls?.querySelector<HTMLElement>(".floatplay-button-row") ?? null;

    if (controls === null || buttonRow === null || this.signal.aborted) {
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
    controls.insertBefore(root, buttonRow);

    const syncLayout = (): void => {
      const layout = resolveVolumeControlLayout(this.playerWindow.innerWidth);
      root.dataset.layout = layout;
      controls.dataset.floatplayVolumeLayout = layout;
    };

    syncLayout();
    this.playerWindow.addEventListener("resize", syncLayout, { signal: this.signal });

    button.addEventListener("click", () => this.setMuted(!this.media.muted), { signal: this.signal });
    root.addEventListener(
      "wheel",
      (event) => {
        if (event.deltaY === 0) {
          return;
        }

        event.preventDefault();
        const direction = event.deltaY < 0 ? 1 : -1;
        this.setVolume(adjustVolume(this.media.volume, direction, this.volumeStep));
      },
      { passive: false, signal: this.signal }
    );

    slider.addEventListener(
      "pointerdown",
      () => {
        this.sliderInteractionStartVolume = this.media.volume;
      },
      { signal: this.signal }
    );

    const clearSliderInteraction = (): void => {
      this.sliderInteractionStartVolume = null;
    };

    this.playerWindow.addEventListener("pointerup", clearSliderInteraction, { signal: this.signal });
    this.playerWindow.addEventListener("pointercancel", clearSliderInteraction, { signal: this.signal });

    slider.addEventListener(
      "input",
      () => {
        this.setVolume(slider.valueAsNumber);
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
    this.signal.addEventListener(
      "abort",
      () => {
        root.remove();
        delete controls.dataset.floatplayVolumeLayout;
      },
      { once: true }
    );
    sync();
  }

  private setVolume(value: number): void {
    const resolution = resolveVolumeInput(
      this.media.volume,
      value,
      this.sliderInteractionStartVolume ?? undefined
    );

    if (resolution.muted) {
      this.media.muted = true;
      this.media.volume = resolution.volume;
      this.volumeMirror.setVolume(resolution.volume);
      this.volumeMirror.setMuted(true);
      return;
    }

    setMediaVolume(this.media, resolution.volume);
    this.volumeMirror.setVolume(this.media.volume);
    this.volumeMirror.setMuted(this.media.muted);
  }

  private setMuted(muted: boolean): void {
    this.media.muted = muted;
    this.volumeMirror.setMuted(muted);
  }

  private syncUi(document: Document, button: HTMLButtonElement, slider: HTMLInputElement): void {
    const buttonLabel = this.media.muted ? this.labels.unmute : this.labels.mute;
    const displayedVolume = getDisplayedVolume(this.media.volume, this.media.muted);

    slider.value = displayedVolume.toString();
    slider.style.setProperty("--floatplay-volume-progress", `${Math.round(displayedVolume * 100)}%`);
    button.setAttribute("aria-label", buttonLabel);
    button.title = buttonLabel;
    button.replaceChildren(this.createIcon(document, this.media.muted, displayedVolume));
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

    const speaker = document.createElementNS(namespace, "path");
    speaker.setAttribute("d", "M11 5 6 9H3v6h3l5 4V5Z");
    svg.append(speaker);

    if (muted) {
      for (const data of ["m16 9 5 5", "m21 9-5 5"]) {
        const path = document.createElementNS(namespace, "path");
        path.setAttribute("d", data);
        svg.append(path);
      }
      return svg;
    }

    if (volume === 0) {
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
      .floatplay-volume-slider-wrap { box-sizing: border-box; display: flex; align-items: center; width: 0; opacity: 0; overflow: hidden; pointer-events: none; transition: width 120ms ease, opacity 100ms ease; }
      .floatplay-volume-control:hover .floatplay-volume-slider-wrap,
      .floatplay-volume-control:focus-within .floatplay-volume-slider-wrap { width: 72px; opacity: 1; pointer-events: auto; }
      .floatplay-volume-slider { --floatplay-volume-progress: 0%; width: 72px; height: 20px; margin: 0; appearance: none; background: transparent; cursor: pointer; }
      .floatplay-volume-slider::-webkit-slider-runnable-track { height: 4px; border-radius: 999px; background: linear-gradient(to right, #fff 0 var(--floatplay-volume-progress), rgb(255 255 255 / 35%) var(--floatplay-volume-progress) 100%); }
      .floatplay-volume-slider::-webkit-slider-thumb { width: 10px; height: 10px; margin-top: -3px; appearance: none; border: 0; border-radius: 999px; background: #fff; }
      .floatplay-volume-slider:focus-visible { outline: 2px solid #fff; outline-offset: 2px; border-radius: 999px; }

      .floatplay-volume-control[data-layout="compact"] .floatplay-volume-slider-wrap {
        position: absolute;
        left: 0;
        bottom: 35px;
        width: 0;
        padding: 0;
        border-radius: 999px;
        background: rgb(0 0 0 / 78%);
        box-shadow: 0 2px 8px rgb(0 0 0 / 35%);
        backdrop-filter: blur(6px);
      }

      .floatplay-volume-control[data-layout="compact"]:hover .floatplay-volume-slider-wrap,
      .floatplay-volume-control[data-layout="compact"]:focus-within .floatplay-volume-slider-wrap {
        width: 124px;
        padding: 4px 10px;
      }

      .floatplay-volume-control[data-layout="compact"] .floatplay-volume-slider {
        width: 104px;
        flex: 0 0 104px;
      }

      .floatplay-controls[data-floatplay-volume-layout="compact"]:has(.floatplay-volume-control:hover) .floatplay-timeline-group,
      .floatplay-controls[data-floatplay-volume-layout="compact"]:has(.floatplay-volume-control:focus-within) .floatplay-timeline-group {
        opacity: 0;
        pointer-events: none;
      }

      @media (prefers-reduced-motion: reduce) { .floatplay-volume-slider-wrap { transition: none; } }
    `;
    document.head.append(style);
  }
}
