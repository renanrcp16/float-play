import {
  formatTimelineTimeDisplay,
  getMediaTimelineState,
  seekTimelineTo
} from "../../application/MediaTimeline";
import type { TimeDisplayMode } from "../../application/Settings";
import type { Logger } from "../../shared/Logger";

export class TimelineControl {
  private readonly lifecycle = new AbortController();
  private input: HTMLInputElement | null = null;
  private timeDisplay: HTMLButtonElement | null = null;
  private displayMode: TimeDisplayMode;

  public constructor(
    private readonly media: HTMLVideoElement,
    private readonly document: Document,
    sessionSignal: AbortSignal,
    private readonly label: string,
    private readonly timeDisplayToggleLabel: string,
    initialDisplayMode: TimeDisplayMode,
    private readonly onDisplayModeChange: (mode: TimeDisplayMode) => void,
    private readonly logger: Logger
  ) {
    this.displayMode = initialDisplayMode;
    sessionSignal.addEventListener("abort", () => this.dispose(), {
      once: true,
      signal: this.lifecycle.signal
    });
  }

  public create(): HTMLElement {
    const root = this.document.createElement("div");
    root.className = "floatplay-timeline-group";

    const input = this.document.createElement("input");
    input.type = "range";
    input.className = "floatplay-timeline";
    input.min = "0";
    input.max = "1";
    input.step = "0.1";
    input.value = "0";
    input.setAttribute("aria-label", this.label);
    input.title = this.label;

    const timeDisplay = this.document.createElement("button");
    timeDisplay.type = "button";
    timeDisplay.className = "floatplay-time-display";
    timeDisplay.setAttribute("aria-label", this.timeDisplayToggleLabel);
    timeDisplay.title = this.timeDisplayToggleLabel;

    input.addEventListener("input", () => this.seekFromInput(), { signal: this.lifecycle.signal });
    timeDisplay.addEventListener("click", () => this.toggleDisplayMode(), { signal: this.lifecycle.signal });

    for (const eventName of ["timeupdate", "durationchange", "progress", "loadedmetadata", "seeked"] as const) {
      this.media.addEventListener(eventName, () => this.update(), { signal: this.lifecycle.signal });
    }

    this.input = input;
    this.timeDisplay = timeDisplay;
    root.append(input, timeDisplay);
    this.update();
    return root;
  }

  public dispose(): void {
    if (!this.lifecycle.signal.aborted) this.lifecycle.abort();
    this.input = null;
    this.timeDisplay = null;
  }

  private seekFromInput(): void {
    const input = this.input;
    if (input === null) return;

    try {
      if (!seekTimelineTo(this.media, Number(input.value))) {
        this.logger.debug("No safe timeline seek target is currently available.");
      }
    } catch (error) {
      this.logger.error("Unable to seek media from the timeline.", error);
    }

    this.update();
  }

  private toggleDisplayMode(): void {
    this.displayMode = this.displayMode === "elapsed" ? "remaining" : "elapsed";
    this.update();
    this.onDisplayModeChange(this.displayMode);
  }

  private update(): void {
    const input = this.input;
    const timeDisplay = this.timeDisplay;
    if (input === null || timeDisplay === null) return;

    const state = getMediaTimelineState(this.media);
    if (state === null) {
      input.disabled = true;
      input.value = "0";
      input.style.setProperty("--floatplay-timeline-progress", "0%");
      timeDisplay.textContent = "0:00 / 0:00";
      return;
    }

    input.disabled = false;
    input.min = state.start.toString();
    input.max = state.end.toString();
    input.value = state.current.toString();

    const total = state.end - state.start;
    const elapsed = state.current - state.start;
    const progress = total > 0 ? (elapsed / total) * 100 : 0;
    const displayText = formatTimelineTimeDisplay(elapsed, total, this.displayMode);

    input.style.setProperty("--floatplay-timeline-progress", `${Math.min(Math.max(progress, 0), 100)}%`);
    input.setAttribute("aria-valuetext", displayText);
    timeDisplay.textContent = displayText;
  }
}
