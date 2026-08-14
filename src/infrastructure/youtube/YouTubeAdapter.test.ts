import { describe, expect, it } from "vitest";
import { YouTubeAdapter } from "./YouTubeAdapter";

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

describe("YouTubeAdapter.getCurrentVideoId", () => {
  const adapter = new YouTubeAdapter();

  it("returns the watch video id", () => {
    expect(
      adapter.getCurrentVideoId({
        hostname: "www.youtube.com",
        pathname: "/watch",
        search: "?v=abc123&list=playlist"
      })
    ).toBe("abc123");
  });

  it("returns null when the watch page has no video id", () => {
    expect(
      adapter.getCurrentVideoId({
        hostname: "www.youtube.com",
        pathname: "/watch",
        search: "?list=playlist"
      })
    ).toBeNull();
  });

  it("returns null on unsupported YouTube surfaces", () => {
    expect(
      adapter.getCurrentVideoId({
        hostname: "www.youtube.com",
        pathname: "/shorts/abc123",
        search: "?v=abc123"
      })
    ).toBeNull();
  });
});
