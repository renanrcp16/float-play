import {
  normalizeControlVisibilityConfig,
  shouldKeepControlsVisible
} from "../../application/ControlVisibility";
import type { ControlVisibilityConfig } from "../../application/ControlVisibility";

const INTERACTIVE_SELECTOR =
  "button, input, select, textarea, a[href], [contenteditable='true'], [role='button'], [role='slider']";
const CONTROL_AREA_SELECTOR =
  ".floatplay-controls, .floatplay-volume-control, .floatplay-overflow-menu";

export class PlayerControlsVisibility {
  private hideTimer: number | null = null;
  private pointerOverControls = false;
  private root: HTMLElement | null = null;
  private readonly config: ControlVisibilityConfig;

  public constructor(
    private readonly media: HTMLVideoElement,
    private readonly playerWindow: Window,
    private readonly signal: AbortSignal,
    config: ControlVisibilityConfig
  ) {
    this.config = normalizeControlVisibilityConfig(config);
  }

  public mount(): void {
    const document = this.playerWindow.document;
    const root = document.querySelector<HTMLElement>('[data-floatplay="player-shell"]');

    if (root === null || this.signal.aborted) {
      return;
    }

    this.root = root;
    this.installStyles(document);

    this.playerWindow.addEventListener(
      "pointermove",
      (event) => {
        this.showControls();
        this.pointerOverControls = isWithinControlArea(
          document.elementFromPoint(event.clientX, event.clientY)
        );
        this.scheduleHideIfNeeded();
      },
      { signal: this.signal }
    );

    this.playerWindow.addEventListener(
      "pointerout",
      (event) => {
        if (event.relatedTarget !== null) {
          return;
        }

        this.pointerOverControls = false;
        this.scheduleHideIfNeeded();
      },
      { signal: this.signal }
    );

    this.playerWindow.addEventListener(
      "keydown",
      () => {
        this.revealAndSchedule();
      },
      { signal: this.signal }
    );

    document.addEventListener(
      "focusin",
      () => {
        this.showControls();
        this.scheduleHideIfNeeded();
      },
      { signal: this.signal }
    );

    document.addEventListener(
      "focusout",
      () => {
        queueMicrotask(() => {
          if (!this.signal.aborted) {
            this.scheduleHideIfNeeded();
          }
        });
      },
      { signal: this.signal }
    );

    this.media.addEventListener(
      "play",
      () => {
        this.showControls();
        this.scheduleHideIfNeeded();
      },
      { signal: this.signal }
    );

    for (const eventName of ["pause", "ended"] as const) {
      this.media.addEventListener(
        eventName,
        () => {
          this.showControls();
          this.clearHideTimer();
        },
        { signal: this.signal }
      );
    }

    this.signal.addEventListener(
      "abort",
      () => {
        this.clearHideTimer();
        this.root = null;
      },
      { once: true }
    );

    this.showControls();
    this.scheduleHideIfNeeded();
  }

  private revealAndSchedule(): void {
    this.showControls();
    this.scheduleHideIfNeeded();
  }

  private scheduleHideIfNeeded(): void {
    this.clearHideTimer();

    if (this.shouldStayVisible()) {
      this.showControls();
      return;
    }

    this.hideTimer = this.playerWindow.setTimeout(() => {
      this.hideTimer = null;

      if (this.shouldStayVisible()) {
        this.showControls();
        return;
      }

      this.root?.setAttribute("data-floatplay-controls-hidden", "true");
    }, this.config.delayMs);
  }

  private shouldStayVisible(): boolean {
    return shouldKeepControlsVisible(this.config, {
      paused: this.media.paused,
      pointerOverControls: this.pointerOverControls,
      interactiveFocus: hasKeyboardInteractiveFocus(this.playerWindow.document)
    });
  }

  private showControls(): void {
    this.root?.removeAttribute("data-floatplay-controls-hidden");
  }

  private clearHideTimer(): void {
    if (this.hideTimer === null) {
      return;
    }

    this.playerWindow.clearTimeout(this.hideTimer);
    this.hideTimer = null;
  }

  private installStyles(document: Document): void {
    if (document.querySelector('style[data-floatplay="control-visibility-styles"]') !== null) {
      return;
    }

    const style = document.createElement("style");
    style.dataset.floatplay = "control-visibility-styles";
    style.textContent = `
      .floatplay-controls,
      .floatplay-volume-control,
      .floatplay-overflow-menu {
        transition: opacity 140ms ease;
      }

      .floatplay-player-shell[data-floatplay-controls-hidden="true"] .floatplay-controls,
      .floatplay-player-shell[data-floatplay-controls-hidden="true"] .floatplay-volume-control,
      .floatplay-player-shell[data-floatplay-controls-hidden="true"] .floatplay-overflow-menu {
        opacity: 0;
        pointer-events: none;
      }

      .floatplay-player-shell[data-floatplay-controls-hidden="true"] .floatplay-controls *,
      .floatplay-player-shell[data-floatplay-controls-hidden="true"] .floatplay-volume-control *,
      .floatplay-player-shell[data-floatplay-controls-hidden="true"] .floatplay-overflow-menu * {
        pointer-events: none !important;
      }

      @media (prefers-reduced-motion: reduce) {
        .floatplay-controls,
        .floatplay-volume-control,
        .floatplay-overflow-menu {
          transition: none;
        }
      }
    `;
    document.head.append(style);
  }
}

function isWithinControlArea(target: EventTarget | null): boolean {
  const candidate = target as { closest?: (selector: string) => Element | null } | null;
  const controlArea = candidate?.closest?.(CONTROL_AREA_SELECTOR);
  return controlArea !== null && controlArea !== undefined;
}

function hasKeyboardInteractiveFocus(document: Document): boolean {
  const candidate = document.activeElement as {
    closest?: (selector: string) => Element | null;
  } | null;
  const interactive = candidate?.closest?.(INTERACTIVE_SELECTOR);

  return interactive?.matches(":focus-visible") ?? false;
}
