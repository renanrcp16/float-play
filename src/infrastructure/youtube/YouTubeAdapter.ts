interface PageLocation {
  readonly hostname: string;
  readonly pathname: string;
}

interface YouTubeVolumeMessage {
  readonly channel: "floatplay:youtube-volume";
  readonly type: "set-volume" | "set-muted";
  readonly volume?: number;
  readonly muted?: boolean;
}

export class YouTubeAdapter {
  public isSupportedPage(location: PageLocation = window.location): boolean {
    const isYouTubeHost = location.hostname === "www.youtube.com" || location.hostname === "youtube.com";

    return isYouTubeHost && location.pathname === "/watch";
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

    this.postVolumeMessage({
      channel: "floatplay:youtube-volume",
      type: "set-volume",
      volume: Math.min(1, Math.max(0, volume))
    });
  }

  public setMuted(muted: boolean): void {
    this.postVolumeMessage({
      channel: "floatplay:youtube-volume",
      type: "set-muted",
      muted
    });
  }

  private postVolumeMessage(message: YouTubeVolumeMessage): void {
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

    if (style.display === "none" || style.visibility === "hidden") {
      return 0;
    }

    return rect.width * rect.height;
  }
}
