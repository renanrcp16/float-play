import {
  formatTimelineTimeDisplay,
  getLiveTimelineLabel,
  getMediaTimelineState,
  getNextTimeDisplayMode,
  isLiveTimelineMedia,
  seekTimelineTo,
  type MediaTimelineState
} from "../../application/MediaTimeline";
import type { TimeDisplayMode } from "../../application/Settings";
import type { Logger } from "../../shared/Logger";

export interface TimelineMirror {
  getTimelineState(media: HTMLVideoElement): MediaTimelineState | null;
  seekTimelineTo(media: HTMLVideoElement, time: number): boolean;
  isLiveMedia?(media: HTMLVideoElement): boolean;
}

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
    private readonly logger: Logger,
    private readonly timelineMirror?: TimelineMirror
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
    timeDisplay.addEventListener("click", () => this.activateTimeDisplay(), { signal: this.lifecycle.signal });

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

    this.seekTo(Number(input.value));
  }

  private activateTimeDisplay(): void {
    if (this.isLive()) {
      const state = this.getTimelineState();
      if (state !== null) this.seekTo(state.end);
      return;
    }

    this.displayMode = getNextTimeDisplayMode(this.displayMode);
    this.update();
    this.onDisplayModeChange(this.displayMode);
  }

  private seekTo(target: number): void {
    try {
      const didSeek = this.timelineMirror?.seekTimelineTo(this.media, target) ?? seekTimelineTo(this.media, target);
      if (!didSeek) this.logger.debug("No safe timeline seek target is currently available.");
    } catch (error) {
      this.logger.error("Unable to seek media from the timeline.", error);
    }

    this.update();
  }

  private update(): void {
    const input = this.input;
    const timeDisplay = this.timeDisplay;
    if (input === null || timeDisplay === null) return;

    const state = this.getTimelineState();
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
    const isLive = this.isLive();
    const liveLabel = isLive ? getLiveTimelineLabel(this.getDocumentLanguage()) : undefined;
    const displayText = formatTimelineTimeDisplay(elapsed, total, isLive ? "elapsed" : this.displayMode, liveLabel);
    const actionLabel = liveLabel ?? this.timeDisplayToggleLabel;

    input.style.setProperty("--floatplay-timeline-progress", `${Math.min(Math.max(progress, 0), 100)}%`);
    input.setAttribute("aria-valuetext", displayText);
    timeDisplay.setAttribute("aria-label", actionLabel);
    timeDisplay.title = actionLabel;
    timeDisplay.textContent = displayText;
  }

  private getTimelineState(): MediaTimelineState | null {
    return this.timelineMirror?.getTimelineState(this.media) ?? getMediaTimelineState(this.media);
  }

  private isLive(): boolean {
    return this.timelineMirror?.isLiveMedia?.(this.media) ?? isLiveTimelineMedia(this.media);
  }

  private getDocumentLanguage(): string {
    return this.document.documentElement.lang || this.document.defaultView?.navigator.language || "en";
  }
}
