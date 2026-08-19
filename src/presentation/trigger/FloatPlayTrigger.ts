const COACHMARK_COPY_ID = "floatplay-trigger-coachmark-copy";

interface FloatPlayTriggerOptions {
  readonly label: string;
  readonly iconUrl: string;
  readonly coachmarkLabel: string;
  readonly coachmarkDismissLabel: string;
  readonly onActivate: () => void;
  readonly onDismissCoachmark: () => void;
}

export interface TriggerInlineAnchor {
  readonly parent: HTMLElement;
  readonly reference: ChildNode;
  readonly position: "before" | "after";
}

type TriggerPlacement = "inline" | "fallback";

export class FloatPlayTrigger {
  private readonly lifecycle = new AbortController();
  private readonly host: HTMLDivElement;
  private readonly button: HTMLButtonElement;
  private readonly coachmark: HTMLDivElement;
  private placement: TriggerPlacement = "fallback";
  private visible = false;

  public constructor(options: FloatPlayTriggerOptions) {
    this.host = document.createElement("div");
    this.host.dataset.floatplay = "trigger";
    this.host.dataset.placement = this.placement;

    const shadowRoot = this.host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = `
      :host {
        all: initial;
      }

      .trigger-button {
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

      .trigger-button:hover {
        background: rgb(127 127 127 / 18%);
      }

      .trigger-button:active {
        background: rgb(127 127 127 / 28%);
      }

      .trigger-button:focus-visible {
        outline: 2px solid #7c8cff;
        outline-offset: 2px;
      }

      .coachmark-close:focus-visible {
        outline: 2px solid #1b2230;
        outline-offset: 2px;
      }

      .trigger-button:disabled {
        cursor: wait;
        opacity: 0.6;
      }

      .trigger-icon {
        display: block;
        width: 26px;
        height: 26px;
        pointer-events: none;
      }

      .coachmark {
        position: absolute;
        left: 50%;
        bottom: calc(100% + 10px);
        z-index: 2;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 8px;
        width: max-content;
        max-width: min(220px, calc(100vw - 32px));
        padding: 9px 8px 9px 12px;
        border-radius: 10px;
        background: #7c8cff;
        color: #1b2230;
        box-shadow: 0 8px 24px rgb(0 0 0 / 24%);
        font: 500 13px/1.35 system-ui, sans-serif;
        transform: translateX(-50%);
      }

      .coachmark[hidden] {
        display: none;
      }

      .coachmark::after {
        position: absolute;
        left: 50%;
        bottom: -5px;
        width: 10px;
        height: 10px;
        background: #7c8cff;
        content: "";
        transform: translateX(-50%) rotate(45deg);
      }

      .coachmark-copy {
        position: relative;
        z-index: 1;
        max-width: 172px;
      }

      .coachmark-close {
        position: relative;
        z-index: 1;
        display: grid;
        place-items: center;
        width: 24px;
        height: 24px;
        flex: 0 0 24px;
        padding: 0;
        border: 0;
        border-radius: 999px;
        background: transparent;
        color: #1b2230;
        cursor: pointer;
        font: 600 18px/1 system-ui, sans-serif;
      }

      .coachmark-close:hover {
        background: rgb(27 34 48 / 12%);
      }

      :host([data-placement="fallback"]) .trigger-button {
        background: rgb(18 18 18 / 88%);
        box-shadow: 0 4px 14px rgb(0 0 0 / 28%);
        backdrop-filter: blur(8px);
      }

      :host([data-placement="fallback"]) .trigger-button:hover {
        background: rgb(30 30 30 / 94%);
      }

      :host([data-placement="fallback"]) .coachmark {
        right: 0;
        left: auto;
        transform: none;
      }

      :host([data-placement="fallback"]) .coachmark::after {
        right: 15px;
        left: auto;
        transform: rotate(45deg);
      }

      @media (prefers-reduced-motion: reduce) {
        .trigger-button,
        .coachmark-close {
          transition: none;
        }
      }
    `;

    this.button = document.createElement("button");
    this.button.className = "trigger-button";
    this.button.type = "button";
    this.button.setAttribute("aria-label", options.label);
    this.button.title = options.label;

    const icon = document.createElement("img");
    icon.className = "trigger-icon";
    icon.src = options.iconUrl;
    icon.alt = "";
    icon.setAttribute("aria-hidden", "true");
    this.button.append(icon);

    this.coachmark = document.createElement("div");
    this.coachmark.className = "coachmark";
    this.coachmark.hidden = true;

    const coachmarkCopy = document.createElement("span");
    coachmarkCopy.id = COACHMARK_COPY_ID;
    coachmarkCopy.className = "coachmark-copy";
    coachmarkCopy.textContent = options.coachmarkLabel;
    coachmarkCopy.setAttribute("role", "status");
    coachmarkCopy.setAttribute("aria-live", "polite");
    coachmarkCopy.setAttribute("aria-atomic", "true");

    const coachmarkClose = document.createElement("button");
    coachmarkClose.className = "coachmark-close";
    coachmarkClose.type = "button";
    coachmarkClose.textContent = "×";
    coachmarkClose.setAttribute("aria-label", options.coachmarkDismissLabel);
    coachmarkClose.title = options.coachmarkDismissLabel;

    this.button.addEventListener("click", options.onActivate, {
      signal: this.lifecycle.signal
    });
    coachmarkClose.addEventListener(
      "click",
      (event) => {
        event.stopPropagation();
        options.onDismissCoachmark();
        this.button.focus();
      },
      { signal: this.lifecycle.signal }
    );

    this.coachmark.append(coachmarkCopy, coachmarkClose);
    shadowRoot.append(style, this.coachmark, this.button);
  }

  public mount(anchor: TriggerInlineAnchor | null = null): void {
    this.refreshPlacement(anchor);
  }

  public refreshPlacement(anchor: TriggerInlineAnchor | null): void {
    if (
      anchor !== null &&
      anchor.parent.isConnected &&
      anchor.reference.parentNode === anchor.parent
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

  public setCoachmarkVisible(visible: boolean): void {
    this.coachmark.hidden = !visible;

    if (visible) {
      this.button.setAttribute("aria-describedby", COACHMARK_COPY_ID);
    } else {
      this.button.removeAttribute("aria-describedby");
    }
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

    const correctlyPlaced =
      this.host.parentNode === anchor.parent &&
      (anchor.position === "after"
        ? this.host.previousSibling === anchor.reference
        : this.host.nextSibling === anchor.reference);

    if (!correctlyPlaced) {
      if (anchor.position === "after") {
        anchor.reference.after(this.host);
      } else {
        anchor.reference.before(this.host);
      }
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
