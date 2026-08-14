import type { PlaybackRateMirror } from "../../application/PlaybackSpeed";
import {
  formatPlaybackRate,
  PLAYBACK_SPEED_PRESETS
} from "../../application/PlaybackSpeed";

const PLAYBACK_RATE_EPSILON = 0.001;

export function createSpeedMenuItem(
  document: Document,
  media: HTMLVideoElement,
  playbackRateMirror: PlaybackRateMirror,
  label: string,
  signal: AbortSignal
): HTMLDivElement {
  installStyles(document);

  const root = document.createElement("div");
  root.className = "floatplay-speed-menu";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "floatplay-overflow-menu-item floatplay-speed-trigger";
  trigger.setAttribute("aria-haspopup", "true");
  trigger.setAttribute("aria-expanded", "false");

  const icon = createSpeedIcon(document);
  const labelText = document.createElement("span");
  labelText.className = "floatplay-overflow-menu-item-label";
  labelText.textContent = label;

  const currentValue = document.createElement("span");
  currentValue.className = "floatplay-speed-current";

  const chevron = document.createElement("span");
  chevron.className = "floatplay-speed-chevron";
  chevron.setAttribute("aria-hidden", "true");
  chevron.textContent = "›";

  trigger.append(icon, labelText, currentValue, chevron);

  const presets = document.createElement("div");
  presets.className = "floatplay-speed-presets";
  presets.hidden = true;

  let pendingPlaybackRate: number | null = null;

  const closePresets = (): void => {
    pendingPlaybackRate = null;
    presets.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    trigger.focus();
  };

  const presetButtons = PLAYBACK_SPEED_PRESETS.map((preset) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "floatplay-speed-preset";
    button.textContent = formatPlaybackRate(preset);
    button.setAttribute("aria-pressed", "false");

    button.addEventListener(
      "click",
      () => {
        if (Math.abs(media.playbackRate - preset) < PLAYBACK_RATE_EPSILON) {
          closePresets();
          return;
        }

        pendingPlaybackRate = preset;
        playbackRateMirror.setPlaybackRate(preset);
      },
      { signal }
    );

    presets.append(button);
    return { button, preset };
  });

  const sync = (): void => {
    const formattedRate = formatPlaybackRate(media.playbackRate);
    currentValue.textContent = formattedRate;
    trigger.setAttribute("aria-label", `${label}: ${formattedRate}`);

    for (const { button, preset } of presetButtons) {
      const selected = Math.abs(media.playbackRate - preset) < PLAYBACK_RATE_EPSILON;
      button.setAttribute("aria-pressed", selected ? "true" : "false");
      button.classList.toggle("is-selected", selected);
    }

    if (
      pendingPlaybackRate !== null &&
      Math.abs(media.playbackRate - pendingPlaybackRate) < PLAYBACK_RATE_EPSILON
    ) {
      closePresets();
    }
  };

  trigger.addEventListener(
    "click",
    () => {
      const nextOpen = presets.hidden;
      presets.hidden = !nextOpen;
      trigger.setAttribute("aria-expanded", nextOpen ? "true" : "false");

      if (nextOpen) {
        const selected = presets.querySelector<HTMLButtonElement>(
          '.floatplay-speed-preset[aria-pressed="true"]'
        );
        (selected ?? presetButtons[0]?.button)?.focus();
      }
    },
    { signal }
  );

  media.addEventListener("ratechange", sync, { signal });
  sync();

  root.append(trigger, presets);
  return root;
}

function createSpeedIcon(document: Document): SVGSVGElement {
  const namespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(namespace, "svg");
  svg.classList.add("floatplay-overflow-menu-item-icon");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  for (const data of ["M5 17a8 8 0 1 1 14 0", "m12 14 4-4", "M12 18h.01"]) {
    const path = document.createElementNS(namespace, "path");
    path.setAttribute("d", data);
    svg.append(path);
  }

  return svg;
}

function installStyles(document: Document): void {
  if (document.querySelector('style[data-floatplay="speed-menu-styles"]') !== null) {
    return;
  }

  const style = document.createElement("style");
  style.dataset.floatplay = "speed-menu-styles";
  style.textContent = `
    .floatplay-speed-menu { width: 100%; }
    .floatplay-speed-trigger { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; }
    .floatplay-speed-current { color: rgb(255 255 255 / 72%); font: 500 12px/1 system-ui, sans-serif; }
    .floatplay-speed-chevron { color: rgb(255 255 255 / 72%); font: 600 18px/1 system-ui, sans-serif; transform-origin: center; }
    .floatplay-speed-trigger[aria-expanded="true"] .floatplay-speed-chevron { transform: rotate(90deg); }
    .floatplay-speed-presets { display: grid; gap: 2px; padding: 2px 4px 6px 30px; }
    .floatplay-speed-presets[hidden] { display: none; }
    .floatplay-speed-preset { min-height: 30px; padding: 6px 10px; border: 0; border-radius: 7px; color: rgb(255 255 255 / 82%); background: transparent; cursor: pointer; font: 500 12px/1.2 system-ui, sans-serif; text-align: left; }
    .floatplay-speed-preset:hover { background: rgb(255 255 255 / 10%); }
    .floatplay-speed-preset:active { background: rgb(255 255 255 / 16%); }
    .floatplay-speed-preset:focus-visible { outline: 2px solid #fff; outline-offset: -2px; }
    .floatplay-speed-preset.is-selected { color: #fff; background: rgb(255 255 255 / 10%); }
    @media (prefers-reduced-motion: reduce) { .floatplay-speed-chevron { transition: none; } }
  `;
  document.head.append(style);
}
