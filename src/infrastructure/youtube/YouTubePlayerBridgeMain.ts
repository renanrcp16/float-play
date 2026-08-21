import {
  parseYouTubePlayerBridgeMessage,
  type YouTubeTrackDirection
} from "./YouTubePlayerBridgeProtocol";

interface YouTubePlayerElement extends HTMLElement {
  setVolume?(volumePercent: number): void;
  getVolume?(): number;
  mute?(): void;
  unMute?(): void;
  isMuted?(): boolean;
  setPlaybackRate?(playbackRate: number): void;
  seekTo?(seconds: number, allowSeekAhead?: boolean): void;
  previousVideo?(): void;
  nextVideo?(): void;
}

interface YouTubeMusicVolumeSlider extends HTMLElement {
  value?: number | string;
  immediateValue?: number | string;
}

window.addEventListener("message", (event) => {
  if (event.source !== window || event.origin !== window.location.origin) {
    return;
  }

  const message = parseYouTubePlayerBridgeMessage(event.data);

  if (message === null) {
    return;
  }

  const player: YouTubePlayerElement | null = document.getElementById("movie_player");

  switch (message.type) {
    case "set-volume":
      player?.setVolume?.(message.volume * 100);
      syncYouTubeMusicVolumeUi(document, window.location.hostname, message.volume);
      return;
    case "set-muted":
      syncMutedState(document, window.location.hostname, player, message.muted);
      return;
    case "set-playback-rate":
      player?.setPlaybackRate?.(message.playbackRate);
      return;
    case "seek-to":
      player?.seekTo?.(message.time, true);
      return;
    case "previous-track":
      navigateYouTubeMusicTrack(document, window.location.hostname, player, "previous");
      return;
    case "next-track":
      navigateYouTubeMusicTrack(document, window.location.hostname, player, "next");
  }
});

function navigateYouTubeMusicTrack(
  document: Document,
  hostname: string,
  player: YouTubePlayerElement | null,
  direction: YouTubeTrackDirection
): void {
  if (hostname !== "music.youtube.com") {
    return;
  }

  const className = direction === "previous" ? "previous-button" : "next-button";
  const id = direction === "previous" ? "previous-button" : "next-button";
  const nativeButton =
    document.querySelector<HTMLElement>(`ytmusic-player-bar .${className}`) ??
    document.querySelector<HTMLElement>(`ytmusic-player-bar #${id}`);

  if (nativeButton !== null) {
    nativeButton.click();
    return;
  }

  if (direction === "previous") {
    player?.previousVideo?.();
  } else {
    player?.nextVideo?.();
  }
}

function syncMutedState(
  document: Document,
  hostname: string,
  player: YouTubePlayerElement | null,
  muted: boolean
): void {
  if (hostname !== "music.youtube.com") {
    if (muted) {
      player?.mute?.();
    } else {
      player?.unMute?.();
    }
    return;
  }

  const currentMuted = player?.isMuted?.();
  const volumeButton = findYouTubeMusicVolumeButton(document);

  if (typeof currentMuted === "boolean" && currentMuted !== muted && volumeButton !== null) {
    volumeButton.click();
  } else if (currentMuted !== muted) {
    if (muted) {
      player?.mute?.();
    } else {
      player?.unMute?.();
    }
  }

  const displayedVolume = muted
    ? 0
    : Math.min(1, Math.max(0, (player?.getVolume?.() ?? 100) / 100));
  syncYouTubeMusicVolumeUi(document, hostname, displayedVolume);
}

function findYouTubeMusicVolumeButton(document: Document): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>("ytmusic-player-bar .volume.ytmusic-player-bar") ??
    document.querySelector<HTMLElement>("ytmusic-player-bar tp-yt-paper-icon-button.volume") ??
    document.querySelector<HTMLElement>(
      'ytmusic-player-bar button[aria-label*="volume" i], ytmusic-player-bar button[aria-label*="mute" i], ytmusic-player-bar button[aria-label*="unmute" i]'
    )
  );
}

export function syncYouTubeMusicVolumeUi(
  document: Document,
  hostname: string,
  volume: number
): void {
  if (hostname !== "music.youtube.com" || !Number.isFinite(volume)) {
    return;
  }

  const percent = Math.round(Math.min(1, Math.max(0, volume)) * 100);
  const sliders = document.querySelectorAll<YouTubeMusicVolumeSlider>(
    "ytmusic-player-bar #right-controls tp-yt-paper-slider#volume-slider, " +
      "ytmusic-player-bar #right-controls #volume-slider, " +
      "ytmusic-player-expanding-menu tp-yt-paper-slider#expand-volume-slider"
  );

  for (const slider of sliders) {
    slider.value = percent;
    slider.immediateValue = percent;
    slider.setAttribute("aria-valuenow", percent.toString());
  }
}
