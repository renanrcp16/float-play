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

const LIVE_SEEK_RECONCILE_TOLERANCE_SECONDS = 2;

export interface TimelineMirror {
  getTimelineState(media: HTMLVideoElement): MediaTimelineState | null;
  seekTimelineTo(media: HTMLVideoElement, time: number): boolean;
  isLiveMedia?(media: HTMLVideoElement): boolean;
}

export interface PendingLiveSeekState {
  readonly target: number;
  readonly anchorMediaTime: number | null;
}

export type TimeDisplayActivation = "seek-live" | "toggle-display-mode";

export class TimelineControl {
  private readonly lifecycle = new AbortController();
  private input: HTMLInputElement | null = null;
  private timeDisplay: HTMLButtonElement | null = null;
  private displayMode: TimeDisplayMode;
  private renderedLive = false;
  private pendingLiveSeek: PendingLiveSeekState | null = null;

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
      this.media.addEventListener(
        eventName,
        () => {
          if (eventName === "seeked") {
            this.anchorPendingLiveSeek();
          }
          this.update();
        },
        { signal: this.lifecycle.signal }
      );
    }

    this.input = input;
    this.timeDisplay = timeDisplay;
    root.append(input, timeDisplay);
    this.update();
    return root;
  }

  public dispose(): void {
    if (!this.lifecycle.signal.aborted) this.lifecycle.abort();
    this.pendingLiveSeek = null;
    this.input = null;
    this.timeDisplay = null;
  }

  private seekFromInput(): void {
    const input = this.input;
    if (input === null) return;

    this.seekTo(Number(input.value));
  }

  private activateTimeDisplay(): void {
    if (resolveTimeDisplayActivation(this.renderedLive) === "seek-live") {
      const state = this.getTimelineState();
      if (state !== null) this.seekTo(state.safeEnd);
      return;
    }

    this.displayMode = getNextTimeDisplayMode(this.displayMode);
    this.update();
    this.onDisplayModeChange(this.displayMode);
  }

  private seekTo(target: number): void {
    const stateBeforeSeek = this.getTimelineState();
    const trackLiveSeek = this.renderedLive && stateBeforeSeek !== null;
    const safeTarget = stateBeforeSeek === null
      ? target
      : clampTimelineCurrent(target, stateBeforeSeek);
    let didSeek = false;

    try {
      didSeek = this.timelineMirror?.seekTimelineTo(this.media, safeTarget) ?? seekTimelineTo(this.media, safeTarget);
      if (!didSeek) this.logger.debug("No safe timeline seek target is currently available.");
    } catch (error) {
      this.logger.error("Unable to seek media from the timeline.", error);
    }

    if (didSeek && trackLiveSeek) {
      this.pendingLiveSeek = {
        target: safeTarget,
        anchorMediaTime: null
      };
      this.renderPendingLiveSeek(stateBeforeSeek);
      return;
    }

    this.pendingLiveSeek = null;
    this.update();
  }

  private renderPendingLiveSeek(state: MediaTimelineState): void {
    const pending = this.pendingLiveSeek;

    if (pending === null) {
      return;
    }

    this.renderState(state, clampTimelineCurrent(pending.target, state), true);
  }

  private anchorPendingLiveSeek(): void {
    const pending = this.pendingLiveSeek;

    if (pending === null || !Number.isFinite(this.media.currentTime)) {
      return;
    }

    this.pendingLiveSeek = {
      ...pending,
      anchorMediaTime: this.media.currentTime
    };
  }

  private update(): void {
    const state = this.getTimelineState();

    if (state === null) {
      this.pendingLiveSeek = null;
      this.renderUnavailableState();
      return;
    }

    let displayedCurrent = resolvePendingLiveSeekCurrent(
      state,
      this.pendingLiveSeek,
      this.media.currentTime
    );

    if (
      this.pendingLiveSeek !== null &&
      hasLiveSeekReconciled(state.current, displayedCurrent)
    ) {
      this.pendingLiveSeek = null;
      displayedCurrent = state.current;
    }

    this.renderState(
      state,
      displayedCurrent,
      this.pendingLiveSeek !== null || this.isLive()
    );
  }

  private renderUnavailableState(): void {
    const input = this.input;
    const timeDisplay = this.timeDisplay;
    if (input === null || timeDisplay === null) return;

    this.renderedLive = false;
    input.disabled = true;
    input.value = "0";
    input.style.setProperty("--floatplay-timeline-progress", "0%");
    timeDisplay.setAttribute("aria-label", this.timeDisplayToggleLabel);
    timeDisplay.title = this.timeDisplayToggleLabel;
    timeDisplay.textContent = "0:00 / 0:00";
  }

  private renderState(
    state: MediaTimelineState,
    displayedCurrent: number,
    isLive: boolean
  ): void {
    const input = this.input;
    const timeDisplay = this.timeDisplay;
    if (input === null || timeDisplay === null) return;

    input.disabled = false;
    input.min = state.start.toString();
    input.max = state.end.toString();
    input.value = displayedCurrent.toString();

    const total = state.end - state.start;
    const elapsed = displayedCurrent - state.start;
    const progress = total > 0 ? (elapsed / total) * 100 : 0;
    this.renderedLive = isLive;
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

export function resolveTimeDisplayActivation(renderedLive: boolean): TimeDisplayActivation {
  return renderedLive ? "seek-live" : "toggle-display-mode";
}

export function resolvePendingLiveSeekCurrent(
  state: MediaTimelineState,
  pending: PendingLiveSeekState | null,
  mediaCurrentTime: number
): number {
  if (pending === null) {
    return state.current;
  }

  const mediaDelta =
    pending.anchorMediaTime !== null && Number.isFinite(mediaCurrentTime)
      ? mediaCurrentTime - pending.anchorMediaTime
      : 0;

  return clampTimelineCurrent(pending.target + mediaDelta, state);
}

export function hasLiveSeekReconciled(
  authoritativeCurrent: number,
  displayedCurrent: number,
  toleranceSeconds = LIVE_SEEK_RECONCILE_TOLERANCE_SECONDS
): boolean {
  return (
    Number.isFinite(authoritativeCurrent) &&
    Number.isFinite(displayedCurrent) &&
    Math.abs(authoritativeCurrent - displayedCurrent) <= toleranceSeconds
  );
}

function clampTimelineCurrent(value: number, state: MediaTimelineState): number {
  return Math.min(Math.max(value, state.start), state.safeEnd);
}
