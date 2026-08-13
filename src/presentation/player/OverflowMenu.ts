export class OverflowMenu {
  private panel: HTMLDivElement | null = null;
  private trigger: HTMLButtonElement | null = null;

  public constructor(
    private readonly document: Document,
    private readonly signal: AbortSignal,
    private readonly label: string,
    private readonly items: readonly HTMLButtonElement[]
  ) {}

  public create(): HTMLDivElement {
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
    for (const item of this.items) {
      item.addEventListener("click", () => this.close(), { signal: this.signal });
    }

    this.document.addEventListener(
      "pointerdown",
      (event) => {
        if (event.target instanceof Node && !root.contains(event.target)) this.close();
      },
      { signal: this.signal }
    );

    this.document.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "Escape" || panel.hidden) return;
        event.preventDefault();
        this.close();
        trigger.focus();
      },
      { signal: this.signal }
    );

    root.addEventListener(
      "focusout",
      () => {
        queueMicrotask(() => {
          if (!root.contains(this.document.activeElement)) this.close();
        });
      },
      { signal: this.signal }
    );

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
    this.items[0]?.focus();
  }

  private close(): void {
    if (this.panel === null || this.trigger === null) return;
    this.panel.hidden = true;
    this.trigger.setAttribute("aria-expanded", "false");
  }

  private createTriggerIcon(): SVGSVGElement {
    const namespace = "http://www.w3.org/2000/svg";
    const svg = this.document.createElementNS(namespace, "svg");
    svg.classList.add("floatplay-navigation-icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "15");
    svg.setAttribute("height", "15");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("fill", "currentColor");

    for (const cx of [6, 12, 18]) {
      const circle = this.document.createElementNS(namespace, "circle");
      circle.setAttribute("cx", cx.toString());
      circle.setAttribute("cy", "12");
      circle.setAttribute("r", "1.7");
      svg.append(circle);
    }

    return svg;
  }
}
