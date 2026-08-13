interface PageLocation {
  readonly hostname: string;
  readonly pathname: string;
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
