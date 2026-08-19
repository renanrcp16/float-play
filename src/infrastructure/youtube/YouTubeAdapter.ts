import {
  createMutedBridgeMessage,
  createPlaybackRateBridgeMessage,
  createVolumeBridgeMessage,
  type YouTubePlayerBridgeMessage
} from "./YouTubePlayerBridgeProtocol";

interface PageLocation {
  readonly hostname: string;
  readonly pathname: string;
}

export type YouTubeSurface = "youtube-watch" | "youtube-music";
export type TriggerAnchorPosition = "before" | "after";

export interface YouTubeTriggerAnchor {
  readonly parent: HTMLElement;
  readonly reference: ChildNode;
  readonly position: TriggerAnchorPosition;
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

    const candidates = Array.from(root.querySelectorAll("video")).filter(
      (video): video is HTMLVideoElement => video instanceof HTMLVideoElement && video.isConnected
    );

    if (surface === "youtube-music") {
      return this.findMusicMedia(candidates);
    }

    return candidates
      .map((video) => ({ video, area: this.getVisibleArea(video) }))
      .filter(({ area }) => area > 0)
      .sort((left, right) => right.area - left.area)[0]?.video ?? null;
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

  private findMusicTriggerAnchor(root: ParentNode): YouTubeTriggerAnchor | null {
    const playerBar = root.querySelector("ytmusic-player-bar");
    const rightControls = playerBar?.querySelector<HTMLElement>("#right-controls");
    const volumeTarget = rightControls?.querySelector<HTMLElement>(
      "#volume-slider, .volume-slider, .expand-volume-slider"
    );

    if (rightControls === null || rightControls === undefined || volumeTarget === null || volumeTarget === undefined) {
      return null;
    }

    const volumeControl = findDirectChildContaining(rightControls, volumeTarget);

    if (volumeControl === null) {
      return null;
    }

    return {
      parent: rightControls,
      reference: volumeControl,
      position: "before"
    };
  }

  private findMusicMedia(candidates: readonly HTMLVideoElement[]): HTMLVideoElement | null {
    const preferred = candidates.find((video) => video.closest("#movie_player") !== null);

    if (preferred !== undefined) {
      return preferred;
    }

    const active = candidates.find((video) => !video.ended && (video.readyState > 0 || video.currentSrc.length > 0));
    return active ?? candidates[0] ?? null;
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
