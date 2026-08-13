import { describe, expect, it } from "vitest";

import { togglePlayback } from "./MediaPlayback";

interface MutablePlaybackMedia {
  paused: boolean;
  play(): Promise<void>;
  pause(): void;
}

describe("togglePlayback", () => {
  it("plays paused media", async () => {
    let playCalls = 0;
    let pauseCalls = 0;
    const media: MutablePlaybackMedia = {
      paused: true,
      play: () => {
        playCalls += 1;
        return Promise.resolve();
      },
      pause: () => {
        pauseCalls += 1;
      }
    };

    await togglePlayback(media);

    expect(playCalls).toBe(1);
    expect(pauseCalls).toBe(0);
  });

  it("pauses playing media", async () => {
    let playCalls = 0;
    let pauseCalls = 0;
    const media: MutablePlaybackMedia = {
      paused: false,
      play: () => {
        playCalls += 1;
        return Promise.resolve();
      },
      pause: () => {
        pauseCalls += 1;
      }
    };

    await togglePlayback(media);

    expect(pauseCalls).toBe(1);
    expect(playCalls).toBe(0);
  });
});
