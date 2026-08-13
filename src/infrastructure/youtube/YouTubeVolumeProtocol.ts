export const YOUTUBE_VOLUME_COMMAND_EVENT = "floatplay:youtube-volume:command";
export const YOUTUBE_VOLUME_STATE_EVENT = "floatplay:youtube-volume:state";

export type YouTubeVolumeCommand =
  | { readonly type: "request-state" }
  | { readonly type: "set-volume"; readonly volume: number }
  | { readonly type: "set-muted"; readonly muted: boolean };

export interface YouTubeVolumeStateMessage {
  readonly available: boolean;
  readonly volume: number;
  readonly muted: boolean;
}

export function encodeVolumeMessage(message: YouTubeVolumeCommand | YouTubeVolumeStateMessage): string {
  return JSON.stringify(message);
}

export function parseVolumeCommand(value: unknown): YouTubeVolumeCommand | null {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!isRecord(parsed) || typeof parsed.type !== "string") {
      return null;
    }

    if (parsed.type === "request-state") {
      return { type: "request-state" };
    }

    if (parsed.type === "set-volume" && typeof parsed.volume === "number" && Number.isFinite(parsed.volume)) {
      return {
        type: "set-volume",
        volume: Math.min(1, Math.max(0, parsed.volume))
      };
    }

    if (parsed.type === "set-muted" && typeof parsed.muted === "boolean") {
      return {
        type: "set-muted",
        muted: parsed.muted
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function parseVolumeState(value: unknown): YouTubeVolumeStateMessage | null {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (
      !isRecord(parsed) ||
      typeof parsed.available !== "boolean" ||
      typeof parsed.volume !== "number" ||
      !Number.isFinite(parsed.volume) ||
      typeof parsed.muted !== "boolean"
    ) {
      return null;
    }

    return {
      available: parsed.available,
      volume: Math.min(1, Math.max(0, parsed.volume)),
      muted: parsed.muted
    };
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
