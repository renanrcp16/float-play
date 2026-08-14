import { calculateAspectAdjustment } from "../../application/PipAspectFit";
import type { Logger } from "../../shared/Logger";

export function createFitMenuItem(
  document: Document,
  media: HTMLVideoElement,
  playerWindow: Window,
  label: string,
  signal: AbortSignal,
  logger: Logger
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "floatplay-overflow-menu-item";
  button.dataset.floatplayCloseOverflow = "true";

  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.classList.add("floatplay-overflow-menu-item-icon");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", "16");
  icon.setAttribute("height", "16");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "2");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");

  for (const data of ["M8 3H5a2 2 0 0 0-2 2v3", "M16 3h3a2 2 0 0 1 2 2v3", "M21 16v3a2 2 0 0 1-2 2h-3", "M8 21H5a2 2 0 0 1-2-2v-3"]) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", data);
    icon.append(path);
  }

  const text = document.createElement("span");
  text.className = "floatplay-overflow-menu-item-label";
  text.textContent = label;
  button.append(icon, text);

  button.addEventListener("click", () => {
    const adjustment = calculateAspectAdjustment(playerWindow.innerWidth, playerWindow.innerHeight, media.videoWidth, media.videoHeight);
    if (adjustment === null || (adjustment.width === 0 && adjustment.height === 0)) return;
    try {
      playerWindow.resizeBy(adjustment.width, adjustment.height);
    } catch (error) {
      logger.error("Unable to fit the Picture-in-Picture window to the media aspect ratio.", error);
    }
  }, { signal });

  return button;
}
