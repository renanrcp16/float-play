interface SpikeTriggerOptions {
  readonly openLabel: string;
  readonly dismissLabel: string;
  readonly onActivate: () => void;
  readonly onDismiss: () => void;
}

export interface TriggerAnchorBounds {
  readonly right: number;
  readonly bottom: number;
}

export interface TriggerViewport {
  readonly width: number;
  readonly height: number;
}

export interface TriggerPosition {
  readonly right: number;
  readonly bottom: number;
}

const HORIZONTAL_INSET = 16;
const NATIVE_CONTROLS_CLEARANCE = 64;

export class SpikeTrigger {
  private readonly lifecycle = new AbortController();
  private readonly host: HTMLDivElement;
  private readonly openButton: HTMLButtonElement;
  private readonly dismissButton: HTMLButtonElement;

  public constructor(options: SpikeTriggerOptions) {
    this.host = document.createElement("div");
    this.host.dataset.floatplay = "spike-trigger";

    const shadowRoot = this.host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = `
      :host {
        all: initial;
      }

      .trigger {
        display: flex;
        align-items: stretch;
        overflow: hidden;
        border: 1px solid rgb(27 34 48 / 28%);
        border-radius: 999px;
        background: #7c8cff;
        color: #1b2230;
        box-shadow: 0 5px 18px rgb(0 0 0 / 38%);
      }

      button {
        box-sizing: border-box;
        border: 0;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-family: system-ui, sans-serif;
      }

      button:hover {
        background: #b4beff;
      }

      button:active {
        background: rgb(180 190 255 / 78%);
      }

      button:focus-visible {
        position: relative;
        z-index: 1;
        outline: 2px solid #1b2230;
        outline-offset: -3px;
      }

      button:disabled {
        cursor: wait;
        opacity: 0.6;
      }

      .open {
        display: flex;
        align-items: center;
        gap: 7px;
        min-height: 36px;
        padding: 8px 12px 8px 13px;
        font-size: 13px;
        font-weight: 650;
        line-height: 1.2;
        white-space: nowrap;
      }

      .open svg {
        width: 15px;
        height: 15px;
        flex: none;
        fill: currentColor;
        pointer-events: none;
      }

      .dismiss {
        display: grid;
        place-items: center;
        width: 34px;
        min-height: 36px;
        padding: 0;
        border-left: 1px solid rgb(27 34 48 / 22%);
      }

      .dismiss svg {
        width: 14px;
        height: 14px;
        fill: none;
        stroke: currentColor;
        stroke-linecap: round;
        stroke-width: 2;
        pointer-events: none;
      }

      @media (prefers-reduced-motion: reduce) {
        button {
          transition: none;
        }
      }
    `;

    const trigger = document.createElement("div");
    trigger.className = "trigger";

    this.openButton = document.createElement("button");
    this.openButton.type = "button";
    this.openButton.className = "open";
    this.openButton.setAttribute("aria-label", options.openLabel);
    this.openButton.title = options.openLabel;
    this.openButton.append(createOpenIcon(), document.createTextNode(options.openLabel));
    this.openButton.addEventListener("click", options.onActivate, {
      signal: this.lifecycle.signal
    });

    this.dismissButton = document.createElement("button");
    this.dismissButton.type = "button";
    this.dismissButton.className = "dismiss";
    this.dismissButton.setAttribute("aria-label", options.dismissLabel);
    this.dismissButton.title = options.dismissLabel;
    this.dismissButton.append(createDismissIcon());
    this.dismissButton.addEventListener("click", options.onDismiss, {
      signal: this.lifecycle.signal
    });

    trigger.append(this.openButton, this.dismissButton);
    shadowRoot.append(style, trigger);
  }

  public mount(): void {
    if (this.host.isConnected) {
      return;
    }

    Object.assign(this.host.style, {
      position: "fixed",
      zIndex: "2147483647"
    });

    document.documentElement.append(this.host);
  }

  public setAnchorBounds(bounds: TriggerAnchorBounds): void {
    const position = calculateTriggerPosition(bounds, {
      width: window.innerWidth,
      height: window.innerHeight
    });

    this.host.style.right = `${position.right}px`;
    this.host.style.bottom = `${position.bottom}px`;
  }

  public setVisible(visible: boolean): void {
    this.host.style.display = visible ? "block" : "none";
  }

  public setBusy(busy: boolean): void {
    this.openButton.disabled = busy;
    this.dismissButton.disabled = busy;
  }

  public dispose(): void {
    this.lifecycle.abort();
    this.host.remove();
  }
}

export function calculateTriggerPosition(
  bounds: TriggerAnchorBounds,
  viewport: TriggerViewport
): TriggerPosition {
  const viewportWidth = finitePositiveOr(viewport.width, HORIZONTAL_INSET * 2);
  const viewportHeight = finitePositiveOr(viewport.height, NATIVE_CONTROLS_CLEARANCE * 2);
  const visibleRight = clamp(finiteOr(bounds.right, viewportWidth), 0, viewportWidth);
  const visibleBottom = clamp(finiteOr(bounds.bottom, viewportHeight), 0, viewportHeight);

  return {
    right: Math.max(viewportWidth - visibleRight + HORIZONTAL_INSET, HORIZONTAL_INSET),
    bottom: Math.max(
      viewportHeight - visibleBottom + NATIVE_CONTROLS_CLEARANCE,
      NATIVE_CONTROLS_CLEARANCE
    )
  };
}

function createOpenIcon(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M8 5.5v13l10-6.5L8 5.5Z");
  svg.append(path);
  return svg;
}

function createDismissIcon(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");

  for (const data of ["M6 6l12 12", "M18 6 6 18"]) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", data);
    svg.append(path);
  }

  return svg;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function finitePositiveOr(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
