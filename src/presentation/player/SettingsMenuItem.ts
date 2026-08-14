import type { OptionsPageLauncher } from "../../application/OptionsPage";
import type { Logger } from "../../shared/Logger";

export function createSettingsMenuItem(
  document: Document,
  launcher: OptionsPageLauncher,
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

  const paths = [
    "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
    "M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.17.37.38.71.6 1 .3.3.7.47 1.1.4h.1v4h-.1c-.4-.07-.8.1-1.1.4-.22.29-.43.63-.6 1Z"
  ];

  for (const data of paths) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", data);
    icon.append(path);
  }

  const text = document.createElement("span");
  text.className = "floatplay-overflow-menu-item-label";
  text.textContent = label;
  button.append(icon, text);

  button.addEventListener(
    "click",
    () => {
      void launcher.open().catch((error: unknown) => {
        logger.error("Unable to open the FloatPlay options page.", error);
      });
    },
    { signal }
  );

  return button;
}
