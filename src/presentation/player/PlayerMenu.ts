const OVERFLOW_PANEL_ID = "floatplay-overflow-panel";
const AUDIO_ONLY_CLASS = "floatplay-audio-only";
const OVERFLOW_OPEN_ATTRIBUTE = "data-floatplay-overflow-open";

export class PlayerMenu {
  private panel: HTMLDivElement | null = null;
  private trigger: HTMLButtonElement | null = null;

  public constructor(
    private readonly document: Document,
    private readonly signal: AbortSignal,
    private readonly label: string,
    private readonly items: readonly HTMLElement[],
    private readonly onOpenChange: (open: boolean) => void = () => {}
  ) {}

  public create(): HTMLDivElement {
    this.installStyles();

    const root = this.document.createElement("div");
    root.className = "floatplay-overflow-menu";

    const trigger = this.document.createElement("button");
    trigger.type = "button";
    trigger.className = "floatplay-playback-button floatplay-overflow-trigger";
    trigger.setAttribute("aria-label", this.label);
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", OVERFLOW_PANEL_ID);
    trigger.title = this.label;
    trigger.append(this.createTriggerIcon());

    const panel = this.document.createElement("div");
    panel.id = OVERFLOW_PANEL_ID;
    panel.className = "floatplay-overflow-panel";
    panel.hidden = true;
    panel.append(...this.items);

    trigger.addEventListener("click", () => this.toggle(), { signal: this.signal });
    panel.addEventListener(
      "click",
      (event) => {
        const target = event.target as { closest?: (selector: string) => Element | null } | null;
        const closeTarget = target?.closest?.('[data-floatplay-close-overflow="true"]');

        if (closeTarget !== null && closeTarget !== undefined) {
          this.close(true);
        }
      },
      { signal: this.signal, capture: true }
    );

    this.document.addEventListener(
      "pointerdown",
      (event) => {
        if (event.target === null) {
          return;
        }

        const target = event.target as Node;
        if (!root.contains(target) && !panel.contains(target)) {
          this.close(false);
        }
      },
      { signal: this.signal }
    );

    this.document.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "Escape" || panel.hidden) {
          return;
        }

        event.preventDefault();
        this.close(true);
      },
      { signal: this.signal }
    );

    this.signal.addEventListener(
      "abort",
      () => {
        this.getPlayerShell()?.removeAttribute(OVERFLOW_OPEN_ATTRIBUTE);
        panel.remove();
      },
      { once: true }
    );

    root.append(trigger);
    this.getPlayerShell()?.append(panel);
    this.trigger = trigger;
    this.panel = panel;
    return root;
  }

  private toggle(): void {
    if (this.panel === null || this.trigger === null) {
      return;
    }

    if (this.panel.hidden) {
      this.open();
    } else {
      this.close(false);
    }
  }

  private open(): void {
    if (this.panel === null || this.trigger === null || !this.panel.hidden) {
      return;
    }

    const shell = this.getPlayerShell();
    if (shell?.classList.contains(AUDIO_ONLY_CLASS) === true) {
      shell.setAttribute(OVERFLOW_OPEN_ATTRIBUTE, "true");
    }

    this.onOpenChange(true);
    this.panel.hidden = false;
    this.trigger.setAttribute("aria-expanded", "true");
    this.panel.querySelector<HTMLButtonElement>("button:not([disabled])")?.focus({ preventScroll: true });
  }

  private close(restoreFocus: boolean): void {
    if (this.panel === null || this.trigger === null || this.panel.hidden) {
      return;
    }

    this.panel.hidden = true;
    this.trigger.setAttribute("aria-expanded", "false");
    this.getPlayerShell()?.removeAttribute(OVERFLOW_OPEN_ATTRIBUTE);
    this.onOpenChange(false);

    if (restoreFocus && this.trigger.isConnected) {
      this.trigger.focus({ preventScroll: true });
    }
  }

  private getPlayerShell(): HTMLElement | null {
    return this.document.querySelector<HTMLElement>(".floatplay-player-shell");
  }

  private createTriggerIcon(): SVGSVGElement {
    const svg = this.document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("floatplay-navigation-icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "15");
    svg.setAttribute("height", "15");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("fill", "currentColor");

    for (const cx of [6, 12, 18]) {
      const circle = this.document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", cx.toString());
      circle.setAttribute("cy", "12");
      circle.setAttribute("r", "1.7");
      svg.append(circle);
    }

    return svg;
  }

  private installStyles(): void {
    if (this.document.querySelector('style[data-floatplay="overflow-menu-styles"]') !== null) {
      return;
    }

    const style = this.document.createElement("style");
    style.dataset.floatplay = "overflow-menu-styles";
    style.textContent = `
      .floatplay-overflow-menu { position: absolute; right: 12px; bottom: 12px; z-index: 5; pointer-events: auto; }
      .floatplay-overflow-panel { position: absolute; right: 12px; bottom: 48px; z-index: 4; width: max-content; min-width: 190px; max-width: min(260px, calc(100% - 24px)); max-height: min(240px, calc(100% - 60px)); overflow-y: auto; overscroll-behavior: contain; padding: 6px; border: 1px solid rgb(255 255 255 / 12%); border-radius: 10px; box-sizing: border-box; contain: layout paint; background: rgb(18 18 18 / 96%); box-shadow: 0 8px 24px rgb(0 0 0 / 35%); pointer-events: auto; }
      .floatplay-overflow-panel[hidden] { display: none !important; }
      .floatplay-overflow-menu-item { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 36px; padding: 8px 10px; border: 0; border-radius: 8px; box-sizing: border-box; color: #fff; background: transparent; cursor: pointer; text-align: left; }
      .floatplay-overflow-menu-item[hidden] { display: none; }
      .floatplay-overflow-menu-item:hover { background: rgb(255 255 255 / 10%); }
      .floatplay-overflow-menu-item:active { background: rgb(255 255 255 / 16%); }
      .floatplay-overflow-menu-item:focus-visible { outline: 2px solid #fff; outline-offset: -2px; }
      .floatplay-overflow-menu-item-icon { display: block; flex: none; pointer-events: none; }
      .floatplay-overflow-menu-item-label { min-width: 0; overflow: hidden; color: inherit; font: 500 12px/1.3 system-ui, sans-serif; text-overflow: ellipsis; white-space: nowrap; }

      .floatplay-player-shell.${AUDIO_ONLY_CLASS}[${OVERFLOW_OPEN_ATTRIBUTE}="true"] .floatplay-overflow-menu {
        z-index: 7;
      }

      .floatplay-player-shell.${AUDIO_ONLY_CLASS}[${OVERFLOW_OPEN_ATTRIBUTE}="true"] > .floatplay-overflow-panel {
        inset: 0;
        z-index: 6;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 1px;
        width: 100%;
        min-width: 0;
        max-width: none;
        height: 100%;
        max-height: none;
        overflow: hidden;
        padding: 4px 48px 4px 6px;
        border: 0;
        border-radius: 0;
        box-shadow: none;
        contain: strict;
        background: rgb(18 18 18 / 99%);
      }

      .floatplay-player-shell.${AUDIO_ONLY_CLASS}[${OVERFLOW_OPEN_ATTRIBUTE}="true"] .floatplay-overflow-trigger {
        background: rgb(255 255 255 / 10%);
      }

      .floatplay-player-shell.${AUDIO_ONLY_CLASS}[${OVERFLOW_OPEN_ATTRIBUTE}="true"] .floatplay-overflow-menu-item {
        min-height: 24px;
        height: 24px;
        gap: 7px;
        padding: 3px 7px;
        border-radius: 6px;
      }

      .floatplay-player-shell.${AUDIO_ONLY_CLASS}[${OVERFLOW_OPEN_ATTRIBUTE}="true"] .floatplay-overflow-menu-item-icon {
        width: 14px;
        height: 14px;
      }

      .floatplay-player-shell.${AUDIO_ONLY_CLASS}[${OVERFLOW_OPEN_ATTRIBUTE}="true"] .floatplay-speed-chevron {
        font-size: 15px;
      }

      .floatplay-player-shell.${AUDIO_ONLY_CLASS}[${OVERFLOW_OPEN_ATTRIBUTE}="true"] .floatplay-speed-presets {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 2px;
        padding: 2px 0 0;
      }

      .floatplay-player-shell.${AUDIO_ONLY_CLASS}[${OVERFLOW_OPEN_ATTRIBUTE}="true"] .floatplay-speed-preset {
        min-height: 22px;
        height: 22px;
        padding: 2px;
        font-size: 10px;
        text-align: center;
      }

      .floatplay-player-shell.${AUDIO_ONLY_CLASS}[${OVERFLOW_OPEN_ATTRIBUTE}="true"] > .floatplay-overflow-panel:has(.floatplay-speed-trigger[aria-expanded="true"]) > :not(.floatplay-speed-menu) {
        display: none;
      }
    `;
    this.document.head.append(style);
  }
}
