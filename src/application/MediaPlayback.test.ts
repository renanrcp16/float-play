import { describe, expect, it, vi } from "vitest";

import { togglePlayback } from "./MediaPlayback";

interface MutablePlaybackMedia {
  paused: boolean;
  play(): Promise<void>;
  pause(): void;
}

describe("togglePlayback", () => {
  it("plays paused media", async () => {
    const media: MutablePlaybackMedia = {
      paused: true,
      play: vi.fn(async () => undefined),
      pause: vi.fn()
    };

    await togglePlayback(media);

    expect(media.play).toHaveBeenCalledOnce();
    expect(media.pause).not.toHaveBeenCalled();
  });

  it("pauses playing media", async () => {
    const media: MutablePlaybackMedia = {
      paused: false,
      play: vi.fn(async () => undefined),
      pause: vi.fn()
    };

    await togglePlayback(media);

    expect(media.pause).toHaveBeenCalledOnce();
    expect(media.play).not.toHaveBeenCalled();
  });
});
