import { togglePlayback } from "../../application/MediaPlayback";
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
    private readonly originElement: HTMLElement,
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

    this.originElement.addEventListener(
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
    if (event.button !== 0 || this.isInteractiveTarget(event)) {
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
      if (target === this.originElement) {
        return false;
      }

      if (target instanceof Element && target.matches(INTERACTIVE_SELECTOR)) {
        return true;
      }
    }

    return false;
  }
}
