interface SpikeTriggerOptions {
  readonly label: string;
  readonly iconUrl: string;
  readonly onActivate: () => void;
}

export interface TriggerInlineAnchor {
  readonly parent: HTMLElement;
  readonly before: ChildNode;
}

type TriggerPlacement = "inline" | "fallback";

export class SpikeTrigger {
  private readonly lifecycle = new AbortController();
  private readonly host: HTMLDivElement;
  private readonly button: HTMLButtonElement;
  private placement: TriggerPlacement = "fallback";
  private visible = false;

  public constructor(options: SpikeTriggerOptions) {
    this.host = document.createElement("div");
    this.host.dataset.floatplay = "spike-trigger";
    this.host.dataset.placement = this.placement;

    const shadowRoot = this.host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = `
      :host {
        all: initial;
      }

      button {
        box-sizing: border-box;
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        padding: 7px;
        border: 0;
        border-radius: 999px;
        background: transparent;
        cursor: pointer;
      }

      button:hover {
        background: rgb(127 127 127 / 18%);
      }

      button:active {
        background: rgb(127 127 127 / 28%);
      }

      button:focus-visible {
        outline: 2px solid #7c8cff;
        outline-offset: 2px;
      }

      button:disabled {
        cursor: wait;
        opacity: 0.6;
      }

      img {
        display: block;
        width: 26px;
        height: 26px;
        pointer-events: none;
      }

      :host([data-placement="fallback"]) button {
        background: rgb(18 18 18 / 88%);
        box-shadow: 0 4px 14px rgb(0 0 0 / 28%);
        backdrop-filter: blur(8px);
      }

      :host([data-placement="fallback"]) button:hover {
        background: rgb(30 30 30 / 94%);
      }

      @media (prefers-reduced-motion: reduce) {
        button {
          transition: none;
        }
      }
    `;

    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.setAttribute("aria-label", options.label);
    this.button.title = options.label;

    const icon = document.createElement("img");
    icon.src = options.iconUrl;
    icon.alt = "";
    icon.setAttribute("aria-hidden", "true");
    this.button.append(icon);

    this.button.addEventListener("click", options.onActivate, {
      signal: this.lifecycle.signal
    });

    shadowRoot.append(style, this.button);
  }

  public mount(anchor: TriggerInlineAnchor | null = null): void {
    this.refreshPlacement(anchor);
  }

  public refreshPlacement(anchor: TriggerInlineAnchor | null): void {
    if (
      anchor !== null &&
      anchor.parent.isConnected &&
      anchor.before.parentNode === anchor.parent
    ) {
      this.mountInline(anchor);
      return;
    }

    this.mountFallback();
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
    this.applyVisibility();
  }

  public setBusy(busy: boolean): void {
    this.button.disabled = busy;
  }

  public dispose(): void {
    this.lifecycle.abort();
    this.host.remove();
  }

  private mountInline(anchor: TriggerInlineAnchor): void {
    this.placement = "inline";
    this.host.dataset.placement = this.placement;

    if (this.host.parentNode !== anchor.parent || this.host.nextSibling !== anchor.before) {
      anchor.parent.insertBefore(this.host, anchor.before);
    }

    Object.assign(this.host.style, {
      position: "relative",
      right: "",
      bottom: "",
      zIndex: "1",
      flex: "0 0 auto",
      alignSelf: "center",
      marginInline: "8px 4px"
    });

    this.applyVisibility();
  }

  private mountFallback(): void {
    this.placement = "fallback";
    this.host.dataset.placement = this.placement;

    if (this.host.parentNode !== document.documentElement) {
      document.documentElement.append(this.host);
    }

    Object.assign(this.host.style, {
      position: "fixed",
      right: "24px",
      bottom: "24px",
      zIndex: "2147483647",
      flex: "",
      alignSelf: "",
      marginInline: ""
    });

    this.applyVisibility();
  }

  private applyVisibility(): void {
    this.host.style.display = this.visible
      ? this.placement === "inline"
        ? "inline-flex"
        : "block"
      : "none";
  }
}
