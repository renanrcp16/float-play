import { describe, expect, it } from "vitest";
import {
  calculateViewportIntersectionArea,
  YouTubeAdapter
} from "./YouTubeAdapter";

describe("YouTubeAdapter.isSupportedPage", () => {
  const adapter = new YouTubeAdapter();

  it("supports standard www.youtube.com watch pages", () => {
    expect(
      adapter.isSupportedPage({
        hostname: "www.youtube.com",
        pathname: "/watch"
      })
    ).toBe(true);
  });

  it("supports youtube.com watch pages without the www prefix", () => {
    expect(
      adapter.isSupportedPage({
        hostname: "youtube.com",
        pathname: "/watch"
      })
    ).toBe(true);
  });

  it("rejects YouTube Shorts", () => {
    expect(
      adapter.isSupportedPage({
        hostname: "www.youtube.com",
        pathname: "/shorts/example"
      })
    ).toBe(false);
  });

  it("rejects YouTube Music", () => {
    expect(
      adapter.isSupportedPage({
        hostname: "music.youtube.com",
        pathname: "/watch"
      })
    ).toBe(false);
  });

  it("rejects lookalike hosts", () => {
    expect(
      adapter.isSupportedPage({
        hostname: "youtube.com.example.com",
        pathname: "/watch"
      })
    ).toBe(false);
  });
});

describe("calculateViewportIntersectionArea", () => {
  it("returns the full area for a rectangle inside the viewport", () => {
    expect(
      calculateViewportIntersectionArea(
        { left: 100, top: 50, right: 500, bottom: 250 },
        1280,
        720
      )
    ).toBe(80_000);
  });

  it("clips a partially visible rectangle to the viewport", () => {
    expect(
      calculateViewportIntersectionArea(
        { left: -200, top: 100, right: 600, bottom: 500 },
        1280,
        720
      )
    ).toBe(240_000);
  });

  it("returns zero for a large rectangle entirely outside the viewport", () => {
    expect(
      calculateViewportIntersectionArea(
        { left: 1400, top: 0, right: 2400, bottom: 800 },
        1280,
        720
      )
    ).toBe(0);
  });

  it("allows a smaller visible candidate to outrank a larger off-screen candidate", () => {
    const visible = calculateViewportIntersectionArea(
      { left: 100, top: 100, right: 900, bottom: 550 },
      1280,
      720
    );
    const offScreen = calculateViewportIntersectionArea(
      { left: 1400, top: 0, right: 3400, bottom: 1200 },
      1280,
      720
    );

    expect(visible).toBeGreaterThan(offScreen);
  });

  it("rejects invalid viewport geometry", () => {
    expect(
      calculateViewportIntersectionArea(
        { left: 0, top: 0, right: 100, bottom: 100 },
        Number.NaN,
        720
      )
    ).toBe(0);
  });
});
