import { describe, expect, test } from "vitest";
import { getAdjacentPlaybackRate, resolveKeyboardShortcut } from "./KeyboardShortcuts";

const baseInput = {
  repeat: false,
  altKey: false,
  ctrlKey: false,
  metaKey: false
};

describe("keyboard shortcut rules", () => {
  test("maps the fixed v1 shortcuts", () => {
    expect(resolveKeyboardShortcut({ ...baseInput, key: " " })).toBe("toggle-playback");
    expect(resolveKeyboardShortcut({ ...baseInput, key: "ArrowLeft" })).toBe("seek-backward");
    expect(resolveKeyboardShortcut({ ...baseInput, key: "ArrowRight" })).toBe("seek-forward");
    expect(resolveKeyboardShortcut({ ...baseInput, key: "ArrowDown" })).toBe("volume-down");
    expect(resolveKeyboardShortcut({ ...baseInput, key: "ArrowUp" })).toBe("volume-up");
    expect(resolveKeyboardShortcut({ ...baseInput, key: "m" })).toBe("toggle-mute");
    expect(resolveKeyboardShortcut({ ...baseInput, key: "[" })).toBe("speed-down");
    expect(resolveKeyboardShortcut({ ...baseInput, key: "]" })).toBe("speed-up");
  });

  test("allows key repeat only for seek and volume arrows", () => {
    expect(resolveKeyboardShortcut({ ...baseInput, key: "ArrowRight", repeat: true })).toBe("seek-forward");
    expect(resolveKeyboardShortcut({ ...baseInput, key: "ArrowUp", repeat: true })).toBe("volume-up");
    expect(resolveKeyboardShortcut({ ...baseInput, key: " ", repeat: true })).toBeNull();
    expect(resolveKeyboardShortcut({ ...baseInput, key: "M", repeat: true })).toBeNull();
    expect(resolveKeyboardShortcut({ ...baseInput, key: "]", repeat: true })).toBeNull();
  });

  test("ignores modified shortcuts", () => {
    expect(resolveKeyboardShortcut({ ...baseInput, key: "m", ctrlKey: true })).toBeNull();
    expect(resolveKeyboardShortcut({ ...baseInput, key: "ArrowLeft", altKey: true })).toBeNull();
    expect(resolveKeyboardShortcut({ ...baseInput, key: "]", metaKey: true })).toBeNull();
  });

  test("steps through v1 playback presets without inventing external rates", () => {
    expect(getAdjacentPlaybackRate(1, 1)).toBe(1.25);
    expect(getAdjacentPlaybackRate(1, -1)).toBe(0.75);
    expect(getAdjacentPlaybackRate(1.1, 1)).toBe(1.25);
    expect(getAdjacentPlaybackRate(1.1, -1)).toBe(1);
    expect(getAdjacentPlaybackRate(4, -1)).toBe(2);
    expect(getAdjacentPlaybackRate(4, 1)).toBeNull();
    expect(getAdjacentPlaybackRate(0.25, -1)).toBeNull();
  });
});
