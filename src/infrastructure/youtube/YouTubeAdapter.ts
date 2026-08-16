interface PageLocation {
  readonly hostname: string;
  readonly pathname: string;
}

export interface YouTubeTriggerAnchor {
  readonly parent: HTMLElement;
  readonly after: ChildNode;
}

interface YouTubePlayerMessage {
  readonly channel: "floatplay:youtube-player";
  readonly type: "set-volume" | "set-muted" | "set-playback-rate";
  readonly volume?: number;
  readonly muted?: boolean;
  readonly playbackRate?: number;
}

interface ViewportRect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

export class YouTubeAdapter {
  public isSupportedPage(location: PageLocation = window.location): boolean {
    const isYouTubeHost = location.hostname === "www.youtube.com" || location.hostname === "youtube.com";

    return isYouTubeHost && location.pathname === "/watch";
  }

  public findTriggerAnchor(root: ParentNode = document): YouTubeTriggerAnchor | null {
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
      after: subscriptionArea
    };
  }

  public findActiveMedia(root: ParentNode = document): HTMLVideoElement | null {
    if (!this.isSupportedPage()) {
      return null;
    }

    const candidates = Array.from(root.querySelectorAll("video"))
      .filter((video): video is HTMLVideoElement => video instanceof HTMLVideoElement)
      .map((video) => ({ video, area: this.getVisibleArea(video) }))
      .filter(({ area }) => area > 0)
      .sort((left, right) => right.area - left.area);

    return candidates[0]?.video ?? null;
  }

  public setVolume(volume: number): void {
    if (!Number.isFinite(volume)) {
      return;
    }

    this.postPlayerMessage({
      channel: "floatplay:youtube-player",
      type: "set-volume",
      volume: Math.min(1, Math.max(0, volume))
    });
  }

  public setMuted(muted: boolean): void {
    this.postPlayerMessage({
      channel: "floatplay:youtube-player",
      type: "set-muted",
      muted
    });
  }

  public setPlaybackRate(playbackRate: number): void {
    if (!Number.isFinite(playbackRate) || playbackRate <= 0) {
      return;
    }

    this.postPlayerMessage({
      channel: "floatplay:youtube-player",
      type: "set-playback-rate",
      playbackRate
    });
  }

  private postPlayerMessage(message: YouTubePlayerMessage): void {
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
