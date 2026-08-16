const PLAYER_CHANNEL = "floatplay:youtube-player";

type PlayerMessage =
  | {
      readonly channel: typeof PLAYER_CHANNEL;
      readonly type: "set-volume";
      readonly volume: number;
    }
  | {
      readonly channel: typeof PLAYER_CHANNEL;
      readonly type: "set-muted";
      readonly muted: boolean;
    }
  | {
      readonly channel: typeof PLAYER_CHANNEL;
      readonly type: "set-playback-rate";
      readonly playbackRate: number;
    };

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

  const message = parsePlayerMessage(event.data);

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

function parsePlayerMessage(value: unknown): PlayerMessage | null {
  if (!isRecord(value) || value.channel !== PLAYER_CHANNEL || typeof value.type !== "string") {
    return null;
  }

  switch (value.type) {
    case "set-volume":
      return typeof value.volume === "number" && Number.isFinite(value.volume)
        ? {
            channel: PLAYER_CHANNEL,
            type: "set-volume",
            volume: Math.min(1, Math.max(0, value.volume))
          }
        : null;
    case "set-muted":
      return typeof value.muted === "boolean"
        ? {
            channel: PLAYER_CHANNEL,
            type: "set-muted",
            muted: value.muted
          }
        : null;
    case "set-playback-rate":
      return typeof value.playbackRate === "number" &&
        Number.isFinite(value.playbackRate) &&
        value.playbackRate > 0
        ? {
            channel: PLAYER_CHANNEL,
            type: "set-playback-rate",
            playbackRate: value.playbackRate
          }
        : null;
    default:
      return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
