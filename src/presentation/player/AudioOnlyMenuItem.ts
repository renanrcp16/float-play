export interface AudioOnlyMenuItem {
  readonly element: HTMLButtonElement;
  setEnabled(enabled: boolean): void;
}

export interface AudioOnlyLabels {
  readonly audioOnly: string;
  readonly showVideo: string;
}

export function createAudioOnlyMenuItem(
  document: Document,
  initialEnabled: boolean,
  labels: AudioOnlyLabels,
  signal: AbortSignal,
  onChange: (enabled: boolean) => void
): AudioOnlyMenuItem {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "floatplay-overflow-menu-item";
  button.dataset.floatplayCloseOverflow = "true";

  let enabled = initialEnabled;

  const render = (): void => {
    const label = enabled ? labels.showVideo : labels.audioOnly;
    button.setAttribute("aria-pressed", enabled ? "true" : "false");
    button.setAttribute("aria-label", label);
    button.title = label;
    button.replaceChildren(createIcon(document, enabled), createLabel(document, label));
  };

  button.addEventListener(
    "click",
    () => {
      enabled = !enabled;
      render();
      onChange(enabled);
    },
    { signal }
  );

  render();

  return {
    element: button,
    setEnabled(nextEnabled: boolean): void {
      if (enabled === nextEnabled) {
        return;
      }

      enabled = nextEnabled;
      render();
    }
  };
}

function createLabel(document: Document, label: string): HTMLSpanElement {
  const text = document.createElement("span");
  text.className = "floatplay-overflow-menu-item-label";
  text.textContent = label;
  return text;
}

function createIcon(document: Document, enabled: boolean): SVGSVGElement {
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

  if (enabled) {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "3");
    rect.setAttribute("y", "5");
    rect.setAttribute("width", "18");
    rect.setAttribute("height", "12");
    rect.setAttribute("rx", "2");
    const stand = document.createElementNS("http://www.w3.org/2000/svg", "path");
    stand.setAttribute("d", "M8 21h8M12 17v4");
    icon.append(rect, stand);
    return icon;
  }

  const headband = document.createElementNS("http://www.w3.org/2000/svg", "path");
  headband.setAttribute("d", "M4 14v-2a8 8 0 0 1 16 0v2");
  const left = document.createElementNS("http://www.w3.org/2000/svg", "path");
  left.setAttribute("d", "M4 14a2 2 0 0 1 2-2h1v7H6a2 2 0 0 1-2-2z");
  const right = document.createElementNS("http://www.w3.org/2000/svg", "path");
  right.setAttribute("d", "M20 14a2 2 0 0 0-2-2h-1v7h1a2 2 0 0 0 2-2z");
  icon.append(headband, left, right);
  return icon;
}
