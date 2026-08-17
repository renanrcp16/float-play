import { parseYouTubePlayerBridgeMessage } from "./YouTubePlayerBridgeProtocol";

interface YouTubePlayerElement extends HTMLElement {
  setVolume?(volumePercent: number): void;
  mute?(): void;
  unMute?(): void;
  setPlaybackRate?(playbackRate: number): void;
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

  if (player === null) {
    return;
  }

  switch (message.type) {
    case "set-volume":
      player.setVolume?.(message.volume * 100);
      return;
    case "set-muted":
      if (message.muted) {
        player.mute?.();
      } else {
        player.unMute?.();
      }
      return;
    case "set-playback-rate":
      player.setPlaybackRate?.(message.playbackRate);
  }
});
