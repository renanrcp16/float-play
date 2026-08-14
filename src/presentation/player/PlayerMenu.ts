export class PlayerMenu {
  private panel: HTMLDivElement | null = null;
  private trigger: HTMLButtonElement | null = null;

  public constructor(
    private readonly document: Document,
    private readonly signal: AbortSignal,
    private readonly label: string,
    private readonly items: readonly HTMLElement[]
  ) {}

  public create(): HTMLDivElement {
    this.installStyles();

    const root = this.document.createElement("div");
    root.className = "floatplay-overflow-menu";

    const trigger = this.document.createElement("button");
    trigger.type = "button";
    trigger.className = "floatplay-playback-button floatplay-overflow-trigger";
    trigger.setAttribute("aria-label", this.label);
    trigger.setAttribute("aria-haspopup", "true");
    trigger.setAttribute("aria-expanded", "false");
    trigger.title = this.label;
    trigger.append(this.createTriggerIcon());

    const panel = this.document.createElement("div");
    panel.className = "floatplay-overflow-panel";
    panel.hidden = true;
    panel.append(...this.items);

    trigger.addEventListener("click", () => this.toggle(), { signal: this.signal });
    panel.addEventListener("click", (event) => {
      const target = event.target as { closest?: (selector: string) => Element | null } | null;
      if (target?.closest?.('[data-floatplay-close-overflow="true"]') !== null) this.close();
    }, { signal: this.signal });

    this.document.addEventListener("pointerdown", (event) => {
      if (event.target === null || !root.contains(event.target as Node)) this.close();
    }, { signal: this.signal });

    this.document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || panel.hidden) return;
      event.preventDefault();
      this.close();
      trigger.focus();
    }, { signal: this.signal });

    root.addEventListener("focusout", () => {
      queueMicrotask(() => {
        if (!root.contains(this.document.activeElement)) this.close();
      });
    }, { signal: this.signal });

    root.append(trigger, panel);
    this.trigger = trigger;
    this.panel = panel;
    return root;
  }

  private toggle(): void {
    if (this.panel === null || this.trigger === null) return;
    if (this.panel.hidden) this.open();
    else this.close();
  }

  private open(): void {
    if (this.panel === null || this.trigger === null) return;
    this.panel.hidden = false;
    this.trigger.setAttribute("aria-expanded", "true");
    this.panel.querySelector<HTMLButtonElement>("button:not([disabled])")?.focus();
  }

  private close(): void {
    if (this.panel === null || this.trigger === null) return;
    this.panel.hidden = true;
    this.trigger.setAttribute("aria-expanded", "false");
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
    if (this.document.querySelector('style[data-floatplay="overflow-menu-styles"]') !== null) return;
    const style = this.document.createElement("style");
    style.dataset.floatplay = "overflow-menu-styles";
    style.textContent = `
      .floatplay-overflow-menu { position: absolute; right: 12px; bottom: 12px; z-index: 3; pointer-events: auto; }
      .floatplay-overflow-panel { position: absolute; right: 0; bottom: 36px; width: max-content; min-width: 190px; max-width: min(260px, calc(100vw - 24px)); max-height: min(240px, calc(100vh - 84px)); overflow-y: auto; overscroll-behavior: contain; padding: 6px; border: 1px solid rgb(255 255 255 / 12%); border-radius: 10px; box-sizing: border-box; background: rgb(18 18 18 / 96%); box-shadow: 0 8px 24px rgb(0 0 0 / 35%); }
      .floatplay-overflow-menu-item { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 36px; padding: 8px 10px; border: 0; border-radius: 8px; box-sizing: border-box; color: #fff; background: transparent; cursor: pointer; text-align: left; }
      .floatplay-overflow-menu-item:hover { background: rgb(255 255 255 / 10%); }
      .floatplay-overflow-menu-item:active { background: rgb(255 255 255 / 16%); }
      .floatplay-overflow-menu-item:focus-visible { outline: 2px solid #fff; outline-offset: -2px; }
      .floatplay-overflow-menu-item-icon { display: block; flex: none; pointer-events: none; }
      .floatplay-overflow-menu-item-label { min-width: 0; overflow: hidden; color: inherit; font: 500 12px/1.3 system-ui, sans-serif; text-overflow: ellipsis; white-space: nowrap; }
    `;
    this.document.head.append(style);
  }
}
