import { describe, expect, it } from "vitest";

import {
  PIP_VIDEO_HOVERED_CLASS,
  resolvePipVideoCursor,
  setPipVideoHoverFeedback,
  shouldClearPipVideoHoverOnPointerOut,
  shouldToggleFromPipVideoClick
} from "./PipPlaybackSurface";

describe("shouldToggleFromPipVideoClick", () => {
  it("accepts a primary click when the preference is enabled", () => {
    expect(shouldToggleFromPipVideoClick({ enabled: true, button: 0 })).toBe(true);
  });

  it("rejects clicks when the preference is disabled", () => {
    expect(shouldToggleFromPipVideoClick({ enabled: false, button: 0 })).toBe(false);
  });

  it("rejects non-primary clicks", () => {
    expect(shouldToggleFromPipVideoClick({ enabled: true, button: 1 })).toBe(false);
    expect(shouldToggleFromPipVideoClick({ enabled: true, button: 2 })).toBe(false);
  });
});

describe("resolvePipVideoCursor", () => {
  it("uses a pointer only when clicking the PiP video can toggle playback", () => {
    expect(resolvePipVideoCursor(true)).toBe("pointer");
    expect(resolvePipVideoCursor(false)).toBe("");
  });
});

describe("setPipVideoHoverFeedback", () => {
  it("sets and clears the managed hover class explicitly", () => {
    const toggles: Array<[string, boolean | undefined]> = [];
    const target = {
      classList: {
        toggle(token: string, force?: boolean): boolean {
          toggles.push([token, force]);
          return force ?? false;
        }
      }
    };

    setPipVideoHoverFeedback(target, true);
    setPipVideoHoverFeedback(target, false);

    expect(toggles).toEqual([
      [PIP_VIDEO_HOVERED_CLASS, true],
      [PIP_VIDEO_HOVERED_CLASS, false]
    ]);
  });
});

describe("shouldClearPipVideoHoverOnPointerOut", () => {
  it("clears hover when the pointer leaves the PiP document", () => {
    expect(shouldClearPipVideoHoverOnPointerOut(null)).toBe(true);
    expect(shouldClearPipVideoHoverOnPointerOut({} as EventTarget)).toBe(false);
  });
});
