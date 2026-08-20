import { describe, expect, it } from "vitest";
import {
  calculateViewportIntersectionArea,
  classifyYouTubeSurface,
  findDirectChildContaining,
  parseYouTubeMusicTimeInfo,
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

  it("supports YouTube Music player routes", () => {
    expect(
      adapter.isSupportedPage({
        hostname: "music.youtube.com",
        pathname: "/watch"
      })
    ).toBe(true);
    expect(
      adapter.isSupportedPage({
        hostname: "music.youtube.com",
        pathname: "/browse/MPREb_example"
      })
    ).toBe(true);
  });

  it("requires Audio-only on YouTube Music", () => {
    expect(
      adapter.isAudioOnlyRequired({
        hostname: "music.youtube.com",
        pathname: "/"
      })
    ).toBe(true);
    expect(
      adapter.isAudioOnlyRequired({
        hostname: "www.youtube.com",
        pathname: "/watch"
      })
    ).toBe(false);
  });

  it("rejects YouTube Shorts", () => {
    expect(
      adapter.isSupportedPage({
        hostname: "www.youtube.com",
        pathname: "/shorts/example"
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
    expect(
      adapter.isSupportedPage({
        hostname: "music.youtube.com.example.com",
        pathname: "/watch"
      })
    ).toBe(false);
  });
});

describe("classifyYouTubeSurface", () => {
  it("distinguishes regular watch pages from YouTube Music", () => {
    expect(classifyYouTubeSurface({ hostname: "www.youtube.com", pathname: "/watch" })).toBe(
      "youtube-watch"
    );
    expect(classifyYouTubeSurface({ hostname: "music.youtube.com", pathname: "/playlist" })).toBe(
      "youtube-music"
    );
  });
});

describe("findDirectChildContaining", () => {
  it("returns the direct control group that contains a nested volume slider", () => {
    const parent = {} as HTMLElement;
    const group = { parentElement: parent } as HTMLElement;
    const nested = { parentElement: group } as HTMLElement;

    expect(findDirectChildContaining(parent, nested)).toBe(group);
  });

  it("returns null when the descendant does not belong to the parent", () => {
    const parent = {} as HTMLElement;
    const otherParent = {} as HTMLElement;
    const nested = { parentElement: otherParent } as HTMLElement;
    (otherParent as { parentElement?: HTMLElement | null }).parentElement = null;

    expect(findDirectChildContaining(parent, nested)).toBeNull();
  });
});

describe("parseYouTubeMusicTimeInfo", () => {
  it("uses the current-track times instead of cumulative media timestamps", () => {
    expect(parseYouTubeMusicTimeInfo("2:55 / 5:02")).toEqual({
      start: 0,
      end: 302,
      safeEnd: 302,
      current: 175
    });
  });

  it("supports hour-long tracks", () => {
    expect(parseYouTubeMusicTimeInfo("1:02:03 / 1:30:00")).toEqual({
      start: 0,
      end: 5400,
      safeEnd: 5400,
      current: 3723
    });
  });

  it("rejects incomplete time labels", () => {
    expect(parseYouTubeMusicTimeInfo("2:55")).toBeNull();
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
