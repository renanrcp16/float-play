import { parseYouTubePlayerBridgeMessage } from "./YouTubePlayerBridgeProtocol";

interface YouTubePlayerElement extends HTMLElement {
  setVolume?(volumePercent: number): void;
  mute?(): void;
  unMute?(): void;
  setPlaybackRate?(playbackRate: number): void;
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
      if (message.muted) {
        player?.mute?.();
        syncYouTubeMusicVolumeUi(document, window.location.hostname, 0);
      } else {
        player?.unMute?.();
      }
      return;
    case "set-playback-rate":
      player?.setPlaybackRate?.(message.playbackRate);
  }
});

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
