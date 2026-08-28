import {
  getMediaTimelineState,
  isLiveTimelineMedia,
  seekTimelineTo as seekMediaTimelineTo,
  type MediaTimelineState
} from "../../application/MediaTimeline";
import {
  createMutedBridgeMessage,
  createPlaybackRateBridgeMessage,
  createSeekBridgeMessage,
  createTrackNavigationBridgeMessage,
  createVolumeBridgeMessage,
  type YouTubePlayerBridgeMessage,
  type YouTubeTrackDirection
} from "./YouTubePlayerBridgeProtocol";

const YOUTUBE_WATCH_TIMELINE_SELECTOR = '.ytp-progress-bar[role="slider"], .ytp-progress-bar';
const YOUTUBE_WATCH_TIMELINE_ATTRIBUTES = [
  "aria-valuemin",
  "aria-valuemax",
  "aria-valuenow"
] as const;

interface PageLocation {
  readonly hostname: string;
  readonly pathname: string;
}

interface SliderLikeElement extends HTMLElement {
  value?: number | string;
  immediateValue?: number | string;
  max?: number | string;
}

export type YouTubeSurface = "youtube-watch" | "youtube-music";
export type TriggerAnchorPosition = "before" | "after";

export interface YouTubeTriggerAnchor {
  readonly parent: HTMLElement;
  readonly reference: ChildNode;
  readonly position: TriggerAnchorPosition;
  readonly compact?: boolean;
}

interface ViewportRect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

export class YouTubeAdapter {
  public isSupportedPage(location: PageLocation = window.location): boolean {
    return classifyYouTubeSurface(location) !== null;
  }

  public isAudioOnlyRequired(location: PageLocation = window.location): boolean {
    return classifyYouTubeSurface(location) === "youtube-music";
  }

  public isLiveMedia(media: HTMLVideoElement, root: ParentNode = document): boolean {
    return isLiveTimelineMedia(media) || hasYouTubeLivePlaybackSignal(root);
  }

  public findTriggerAnchor(root: ParentNode = document): YouTubeTriggerAnchor | null {
    if (this.isAudioOnlyRequired()) {
      return this.findMusicTriggerAnchor(root);
    }

    const metadata = root.querySelector("ytd-watch-metadata");
    const owner = metadata?.querySelector("#owner");
    const subscriptionArea = owner?.querySelector(
      "#subscribe-button, ytd-subscribe-button-renderer, yt-subscribe-button-view-model"
    );
    const parent = subscriptionArea?.parentElement ?? null;

    if (!(owner instanceof HTMLElement) || !(subscriptionArea instanceof HTMLElement) || parent === null) {
      return null;
    }

    return {
      parent,
      reference: subscriptionArea,
      position: "after"
    };
  }

  public findActiveMedia(root: ParentNode = document): HTMLVideoElement | null {
    const surface = classifyYouTubeSurface(window.location);

    if (surface === null) {
      return null;
    }

    if (surface === "youtube-music") {
      const musicCandidates = Array.from(
        root.querySelectorAll("ytmusic-player video, #movie_player video")
      ).filter(
        (video): video is HTMLVideoElement => video instanceof HTMLVideoElement && video.isConnected
      );

      return selectYouTubeMusicMedia(musicCandidates);
    }

    const candidates = Array.from(root.querySelectorAll("video"))
      .filter((video): video is HTMLVideoElement => video instanceof HTMLVideoElement && video.isConnected)
      .map((video) => ({ video, area: this.getVisibleArea(video) }))
      .filter(({ area }) => area > 0)
      .sort((left, right) => right.area - left.area);

    return candidates[0]?.video ?? null;
  }

  public getTimelineState(
    media: HTMLVideoElement,
    root: ParentNode = document
  ): MediaTimelineState | null {
    if (this.isAudioOnlyRequired()) {
      return readYouTubeMusicTimelineState(root) ?? getMediaTimelineState(media);
    }

    if (this.isLiveMedia(media, root)) {
      return readYouTubeWatchTimelineState(root) ?? getMediaTimelineState(media);
    }

    return getMediaTimelineState(media);
  }

  public subscribeTimelineUpdates(
    _media: HTMLVideoElement,
    listener: () => void,
    signal: AbortSignal,
    root: ParentNode = document
  ): void {
    if (this.isAudioOnlyRequired() || signal.aborted) {
      return;
    }

    const observer = new MutationObserver((mutations) => {
      if (mutations.some(isYouTubeWatchTimelineMutation)) {
        listener();
      }
    });

    observer.observe(root, {
      attributes: true,
      subtree: true,
      attributeFilter: [...YOUTUBE_WATCH_TIMELINE_ATTRIBUTES]
    });

    signal.addEventListener(
      "abort",
      () => {
        observer.disconnect();
      },
      { once: true }
    );
  }

  public seekTimelineTo(
    media: HTMLVideoElement,
    time: number,
    root: ParentNode = document
  ): boolean {
    if (this.isAudioOnlyRequired()) {
      const nativeState = readYouTubeMusicTimelineState(root);

      if (nativeState === null || !Number.isFinite(time)) {
        return seekMediaTimelineTo(media, time);
      }

      const relativeTarget = clamp(time, nativeState.start, nativeState.safeEnd);
      const message = createSeekBridgeMessage(relativeTarget);

      if (message === null) {
        return false;
      }

      this.postPlayerMessage(message);
      return true;
    }

    if (this.isLiveMedia(media, root)) {
      const nativeState = readYouTubeWatchTimelineState(root);

      if (nativeState !== null && Number.isFinite(time)) {
        const nativeTarget = clamp(time, nativeState.start, nativeState.safeEnd);
        const message = createSeekBridgeMessage(nativeTarget);

        if (message === null) {
          return false;
        }

        this.postPlayerMessage(message);
        return true;
      }
    }

    return seekMediaTimelineTo(media, time);
  }

  public setVolume(volume: number): void {
    const message = createVolumeBridgeMessage(volume);

    if (message !== null) {
      this.postPlayerMessage(message);
    }
  }

  public setMuted(muted: boolean): void {
    this.postPlayerMessage(createMutedBridgeMessage(muted));
  }

  public setPlaybackRate(playbackRate: number): void {
    const message = createPlaybackRateBridgeMessage(playbackRate);

    if (message !== null) {
      this.postPlayerMessage(message);
    }
  }

  public previousTrack(): void {
    this.navigateTrack("previous");
  }

  public nextTrack(): void {
    this.navigateTrack("next");
  }

  private navigateTrack(direction: YouTubeTrackDirection): void {
    if (!this.isAudioOnlyRequired()) {
      return;
    }

    this.postPlayerMessage(createTrackNavigationBridgeMessage(direction));
  }

  private findMusicTriggerAnchor(root: ParentNode): YouTubeTriggerAnchor | null {
    const playerBar = root.querySelector("ytmusic-player-bar");
    const rightControls = playerBar?.querySelector<HTMLElement>("#right-controls");

    if (rightControls === null || rightControls === undefined) {
      return null;
    }

    const volumeButton =
      rightControls.querySelector<HTMLElement>(".volume.ytmusic-player-bar") ??
      rightControls.querySelector<HTMLElement>("tp-yt-paper-icon-button.volume") ??
      rightControls.querySelector<HTMLElement>(
        'button[aria-label*="volume" i], button[aria-label*="mute" i], button[aria-label*="unmute" i]'
      );

    if (volumeButton === null) {
      return null;
    }

    const volumeControl = findDirectChildContaining(rightControls, volumeButton);

    if (volumeControl === null) {
      return null;
    }

    return {
      parent: rightControls,
      reference: volumeControl,
      position: "after",
      compact: true
    };
  }

  private postPlayerMessage(message: YouTubePlayerBridgeMessage): void {
    window.postMessage(message, window.location.origin);
  }

  private getVisibleArea(video: HTMLVideoElement): number {
    if (!video.isConnected) {
      return 0;
    }

    const rect = video.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) {
      return 0;
    }

    const style = window.getComputedStyle(video);

    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.visibility === "collapse" ||
      Number.parseFloat(style.opacity) === 0
    ) {
      return 0;
    }

    return calculateViewportIntersectionArea(rect, window.innerWidth, window.innerHeight);
  }
}

export function classifyYouTubeSurface(location: PageLocation): YouTubeSurface | null {
  if (location.hostname === "music.youtube.com") {
    return "youtube-music";
  }

  const isYouTubeHost = location.hostname === "www.youtube.com" || location.hostname === "youtube.com";
  return isYouTubeHost && location.pathname === "/watch" ? "youtube-watch" : null;
}

export function hasYouTubeLivePlaybackSignal(root: ParentNode): boolean {
  return root.querySelector(
    "#movie_player.ytp-live, .ytp-time-display.ytp-live, .ytp-live-badge.ytp-live-badge-is-livehead"
  ) !== null;
}

export function readYouTubeWatchTimelineState(root: ParentNode): MediaTimelineState | null {
  const progress = root.querySelector<HTMLElement>(YOUTUBE_WATCH_TIMELINE_SELECTOR);

  if (progress === null) {
    return null;
  }

  const start = readAttributeNumber(progress, "aria-valuemin") ?? 0;
  const end = readAttributeNumber(progress, "aria-valuemax");
  const current = readAttributeNumber(progress, "aria-valuenow");

  if (
    end === null ||
    current === null ||
    end <= start ||
    current < start - 1 ||
    current > end + 1
  ) {
    return null;
  }

  return {
    start,
    end,
    safeEnd: end,
    current: clamp(current, start, end)
  };
}

export function isYouTubeWatchTimelineMutation(
  mutation: Pick<MutationRecord, "type" | "target" | "attributeName">
): boolean {
  if (
    mutation.type !== "attributes" ||
    mutation.attributeName === null ||
    !YOUTUBE_WATCH_TIMELINE_ATTRIBUTES.includes(
      mutation.attributeName as (typeof YOUTUBE_WATCH_TIMELINE_ATTRIBUTES)[number]
    )
  ) {
    return false;
  }

  const target = mutation.target as { matches?: (selector: string) => boolean };
  return target.matches?.(".ytp-progress-bar") === true;
}

export function findDirectChildContaining(
  parent: HTMLElement,
  descendant: HTMLElement
): HTMLElement | null {
  let current: HTMLElement | null = descendant;

  while (current !== null && current.parentElement !== parent) {
    current = current.parentElement;
  }

  return current?.parentElement === parent ? current : null;
}

export function selectYouTubeMusicMedia(
  candidates: readonly HTMLVideoElement[]
): HTMLVideoElement | null {
  const playing = candidates.find((video) => !video.paused && !video.ended && video.readyState > 0);

  if (playing !== undefined) {
    return playing;
  }

  const ready = candidates.find(
    (video) => !video.ended && (video.readyState > 0 || video.currentSrc.length > 0)
  );
  return ready ?? candidates[0] ?? null;
}

export function parseYouTubeMusicTimeInfo(text: string): MediaTimelineState | null {
  const matches = text.match(/\b(?:\d+:)?\d{1,2}:\d{2}\b/g);

  if (matches === null || matches.length < 2) {
    return null;
  }

  const current = parseClockTime(matches[0] ?? "");
  const end = parseClockTime(matches[1] ?? "");

  if (current === null || end === null || end <= 0) {
    return null;
  }

  return {
    start: 0,
    end,
    safeEnd: end,
    current: clamp(current, 0, end)
  };
}

export function readYouTubeMusicTimelineState(root: ParentNode): MediaTimelineState | null {
  const timeInfo = root.querySelector<HTMLElement>("ytmusic-player-bar .time-info");
  const parsedText = timeInfo?.textContent !== null && timeInfo?.textContent !== undefined
    ? parseYouTubeMusicTimeInfo(timeInfo.textContent)
    : null;

  if (parsedText !== null) {
    return parsedText;
  }

  const progressElements = [
    root.querySelector<SliderLikeElement>(
      "ytmusic-player-bar tp-yt-paper-slider#progress-bar tp-yt-paper-progress#sliderBar"
    ),
    root.querySelector<SliderLikeElement>("ytmusic-player-bar tp-yt-paper-slider#progress-bar")
  ];

  for (const progress of progressElements) {
    if (progress === null) {
      continue;
    }

    const current = readControlNumber(progress, ["value", "immediateValue"], "aria-valuenow");
    const end = readControlNumber(progress, ["max"], "aria-valuemax");

    if (current === null || end === null || end <= 0 || current < 0 || current > end + 1) {
      continue;
    }

    return {
      start: 0,
      end,
      safeEnd: end,
      current: clamp(current, 0, end)
    };
  }

  return null;
}

export function calculateViewportIntersectionArea(
  rect: ViewportRect,
  viewportWidth: number,
  viewportHeight: number
): number {
  if (
    !Number.isFinite(rect.left) ||
    !Number.isFinite(rect.top) ||
    !Number.isFinite(rect.right) ||
    !Number.isFinite(rect.bottom) ||
    !Number.isFinite(viewportWidth) ||
    !Number.isFinite(viewportHeight) ||
    viewportWidth <= 0 ||
    viewportHeight <= 0
  ) {
    return 0;
  }

  const visibleWidth = Math.max(
    0,
    Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0)
  );
  const visibleHeight = Math.max(
    0,
    Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0)
  );

  return visibleWidth * visibleHeight;
}

function readControlNumber(
  element: SliderLikeElement,
  propertyNames: readonly ("value" | "immediateValue" | "max")[],
  attributeName: string
): number | null {
  for (const propertyName of propertyNames) {
    const value = Number(element[propertyName]);

    if (Number.isFinite(value)) {
      return value;
    }
  }

  return readAttributeNumber(element, attributeName);
}

function readAttributeNumber(element: Element, attributeName: string): number | null {
  const attribute = element.getAttribute(attributeName);

  if (attribute === null) {
    return null;
  }

  const value = Number(attribute);
  return Number.isFinite(value) ? value : null;
}

function parseClockTime(value: string): number | null {
  const parts = value.split(":").map((part) => Number(part));

  if (
    parts.length < 2 ||
    parts.length > 3 ||
    parts.some((part) => !Number.isFinite(part) || part < 0)
  ) {
    return null;
  }

  if (parts.length === 2) {
    return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  }

  return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
