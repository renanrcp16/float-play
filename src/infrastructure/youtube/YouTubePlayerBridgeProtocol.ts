export const YOUTUBE_PLAYER_BRIDGE_CHANNEL = "floatplay:youtube-player" as const;

export type YouTubePlayerBridgeMessage =
  | {
      readonly channel: typeof YOUTUBE_PLAYER_BRIDGE_CHANNEL;
      readonly type: "set-volume";
      readonly volume: number;
    }
  | {
      readonly channel: typeof YOUTUBE_PLAYER_BRIDGE_CHANNEL;
      readonly type: "set-muted";
      readonly muted: boolean;
    }
  | {
      readonly channel: typeof YOUTUBE_PLAYER_BRIDGE_CHANNEL;
      readonly type: "set-playback-rate";
      readonly playbackRate: number;
    }
  | {
      readonly channel: typeof YOUTUBE_PLAYER_BRIDGE_CHANNEL;
      readonly type: "seek-to";
      readonly time: number;
    };

export function createVolumeBridgeMessage(volume: number): YouTubePlayerBridgeMessage | null {
  if (!Number.isFinite(volume)) {
    return null;
  }

  return {
    channel: YOUTUBE_PLAYER_BRIDGE_CHANNEL,
    type: "set-volume",
    volume: Math.min(1, Math.max(0, volume))
  };
}

export function createMutedBridgeMessage(muted: boolean): YouTubePlayerBridgeMessage {
  return {
    channel: YOUTUBE_PLAYER_BRIDGE_CHANNEL,
    type: "set-muted",
    muted
  };
}

export function createPlaybackRateBridgeMessage(
  playbackRate: number
): YouTubePlayerBridgeMessage | null {
  if (!Number.isFinite(playbackRate) || playbackRate <= 0) {
    return null;
  }

  return {
    channel: YOUTUBE_PLAYER_BRIDGE_CHANNEL,
    type: "set-playback-rate",
    playbackRate
  };
}

export function createSeekBridgeMessage(time: number): YouTubePlayerBridgeMessage | null {
  if (!Number.isFinite(time) || time < 0) {
    return null;
  }

  return {
    channel: YOUTUBE_PLAYER_BRIDGE_CHANNEL,
    type: "seek-to",
    time
  };
}

export function parseYouTubePlayerBridgeMessage(value: unknown): YouTubePlayerBridgeMessage | null {
  if (
    !isRecord(value) ||
    value.channel !== YOUTUBE_PLAYER_BRIDGE_CHANNEL ||
    typeof value.type !== "string"
  ) {
    return null;
  }

  switch (value.type) {
    case "set-volume":
      return typeof value.volume === "number" ? createVolumeBridgeMessage(value.volume) : null;
    case "set-muted":
      return typeof value.muted === "boolean" ? createMutedBridgeMessage(value.muted) : null;
    case "set-playback-rate":
      return typeof value.playbackRate === "number"
        ? createPlaybackRateBridgeMessage(value.playbackRate)
        : null;
    case "seek-to":
      return typeof value.time === "number" ? createSeekBridgeMessage(value.time) : null;
    default:
      return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}