import { PLAYBACK_SPEED_PRESETS } from "./PlaybackSpeed";

export type KeyboardShortcutAction =
  | "toggle-playback"
  | "seek-backward"
  | "seek-forward"
  | "volume-down"
  | "volume-up"
  | "toggle-mute"
  | "speed-down"
  | "speed-up";

export interface KeyboardShortcutInput {
  readonly key: string;
  readonly repeat: boolean;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
}

const RATE_EPSILON = 0.001;

export function resolveKeyboardShortcut(input: KeyboardShortcutInput): KeyboardShortcutAction | null {
  if (input.altKey || input.ctrlKey || input.metaKey) {
    return null;
  }

  switch (input.key) {
    case "ArrowLeft":
      return "seek-backward";
    case "ArrowRight":
      return "seek-forward";
    case "ArrowDown":
      return "volume-down";
    case "ArrowUp":
      return "volume-up";
    case " ":
      return input.repeat ? null : "toggle-playback";
    case "m":
    case "M":
      return input.repeat ? null : "toggle-mute";
    case "[":
      return input.repeat ? null : "speed-down";
    case "]":
      return input.repeat ? null : "speed-up";
    default:
      return null;
  }
}

export function getAdjacentPlaybackRate(currentRate: number, direction: -1 | 1): number | null {
  if (!Number.isFinite(currentRate) || currentRate <= 0) {
    return null;
  }

  if (direction > 0) {
    return PLAYBACK_SPEED_PRESETS.find((preset) => preset > currentRate + RATE_EPSILON) ?? null;
  }

  for (let index = PLAYBACK_SPEED_PRESETS.length - 1; index >= 0; index -= 1) {
    const preset = PLAYBACK_SPEED_PRESETS[index];

    if (preset !== undefined && preset < currentRate - RATE_EPSILON) {
      return preset;
    }
  }

  return null;
}
