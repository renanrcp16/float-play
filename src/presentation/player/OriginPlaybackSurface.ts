import { togglePlayback } from "../../application/MediaPlayback";
import type { MediaBounds } from "../../infrastructure/pip/DocumentPipManager";
import type { Logger } from "../../shared/Logger";

const INTERACTIVE_SELECTOR = [
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "summary",
  "label",
  "[contenteditable='true']",
  "[role='button']",
  "[role='checkbox']",
  "[role='link']",
  "[role='menuitem']",
  "[role='slider']",
  "[role='switch']"
].join(",");

export class OriginPlaybackSurface {
  private readonly lifecycle = new AbortController();
  private mounted = false;

  public constructor(
    private readonly media: HTMLVideoElement,
    private readonly originDocument: Document,
    private readonly originBounds: MediaBounds,
    sessionSignal: AbortSignal,
    private readonly logger: Logger
  ) {
    sessionSignal.addEventListener(
      "abort",
      () => {
        this.dispose();
      },
      { once: true }
    );
  }

  public mount(): void {
    if (this.mounted || this.lifecycle.signal.aborted) {
      return;
    }

    this.originDocument.addEventListener(
      "click",
      (event) => {
        this.handleClick(event);
      },
      {
        capture: true,
        signal: this.lifecycle.signal
      }
    );

    this.mounted = true;
  }

  public dispose(): void {
    if (this.lifecycle.signal.aborted) {
      return;
    }

    this.lifecycle.abort();
    this.mounted = false;
  }

  private handleClick(event: MouseEvent): void {
    if (
      event.button !== 0 ||
      !isPointWithinBounds(event.clientX, event.clientY, this.originBounds) ||
      this.isInteractiveTarget(event)
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    void togglePlayback(this.media).catch((error: unknown) => {
      this.logger.error("Unable to toggle media playback from the YouTube origin surface.", error);
    });
  }

  private isInteractiveTarget(event: MouseEvent): boolean {
    for (const target of event.composedPath()) {
      if (target instanceof Element && target.matches(INTERACTIVE_SELECTOR)) {
        return true;
      }
    }

    return false;
  }
}

export function isPointWithinBounds(x: number, y: number, bounds: MediaBounds): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return false;
  }

  return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
}
