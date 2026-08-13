interface SpikeTriggerOptions {
  onActivate: () => void;
}

export class SpikeTrigger {
  private readonly lifecycle = new AbortController();
  private readonly host: HTMLDivElement;
  private readonly button: HTMLButtonElement;

  public constructor(options: SpikeTriggerOptions) {
    this.host = document.createElement("div");
    this.host.dataset.floatplay = "spike-trigger";

    const shadowRoot = this.host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = `
      :host {
        all: initial;
      }

      button {
        box-sizing: border-box;
        border: 1px solid rgba(255, 255, 255, 0.24);
        border-radius: 999px;
        padding: 8px 12px;
        background: rgba(18, 18, 18, 0.88);
        color: #fff;
        font: 600 12px/1.2 system-ui, sans-serif;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
        backdrop-filter: blur(8px);
      }

      button:hover {
        background: rgba(30, 30, 30, 0.94);
      }

      button:focus-visible {
        outline: 2px solid #fff;
        outline-offset: 2px;
      }

      button:disabled {
        cursor: wait;
        opacity: 0.65;
      }
    `;

    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.textContent = "Open FloatPlay PiP";
    this.button.setAttribute("aria-label", "Open FloatPlay Picture-in-Picture");
    this.button.addEventListener("click", options.onActivate, {
      signal: this.lifecycle.signal
    });

    shadowRoot.append(style, this.button);
  }

  public mount(): void {
    if (this.host.isConnected) {
      return;
    }

    Object.assign(this.host.style, {
      position: "fixed",
      right: "24px",
      bottom: "24px",
      zIndex: "2147483647"
    });

    document.documentElement.append(this.host);
  }

  public setVisible(visible: boolean): void {
    this.host.style.display = visible ? "block" : "none";
  }

  public setBusy(busy: boolean): void {
    this.button.disabled = busy;
  }

  public dispose(): void {
    this.lifecycle.abort();
    this.host.remove();
  }
}
