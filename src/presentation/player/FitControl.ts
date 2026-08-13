import { calculateAspectAdjustment } from "../../application/PipAspectFit";
import type { Logger } from "../../shared/Logger";

export class FitControl {
  public constructor(
    private readonly media: HTMLVideoElement,
    private readonly playerWindow: Window,
    private readonly label: string,
    private readonly signal: AbortSignal,
    private readonly logger: Logger
  ) {}

  public create(document: Document): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "floatplay-playback-button";
    button.setAttribute("aria-label", this.label);
    button.title = this.label;
    button.append(this.createIcon(document));
    button.addEventListener("click", () => this.fit(), { signal: this.signal });
    return button;
  }

  private fit(): void {
    const adjustment = calculateAspectAdjustment(
      this.playerWindow.innerWidth,
      this.playerWindow.innerHeight,
      this.media.videoWidth,
      this.media.videoHeight
    );

    if (adjustment === null || (adjustment.width === 0 && adjustment.height === 0)) return;

    try {
      this.playerWindow.resizeBy(adjustment.width, adjustment.height);
    } catch (error) {
      this.logger.error("Unable to fit the Picture-in-Picture window to the media aspect ratio.", error);
    }
  }

  private createIcon(document: Document): SVGSVGElement {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.classList.add("floatplay-navigation-icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "15");
    svg.setAttribute("height", "15");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");

    for (const pathData of [
      "M8 3H5a2 2 0 0 0-2 2v3",
      "M16 3h3a2 2 0 0 1 2 2v3",
      "M21 16v3a2 2 0 0 1-2 2h-3",
      "M8 21H5a2 2 0 0 1-2-2v-3"
    ]) {
      const path = document.createElementNS(ns, "path");
      path.setAttribute("d", pathData);
      svg.append(path);
    }

    return svg;
  }
}
