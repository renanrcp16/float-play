import { describe, expect, it } from "vitest";

import {
  createMutedBridgeMessage,
  createPlaybackRateBridgeMessage,
  createSeekBridgeMessage,
  createTrackNavigationBridgeMessage,
  createVolumeBridgeMessage,
  parseYouTubePlayerBridgeMessage,
  YOUTUBE_PLAYER_BRIDGE_CHANNEL
} from "./YouTubePlayerBridgeProtocol";

describe("YouTube player bridge protocol", () => {
  it("creates normalized volume messages", () => {
    expect(createVolumeBridgeMessage(2)).toEqual({
      channel: YOUTUBE_PLAYER_BRIDGE_CHANNEL,
      type: "set-volume",
      volume: 1
    });
    expect(createVolumeBridgeMessage(-1)).toEqual({
      channel: YOUTUBE_PLAYER_BRIDGE_CHANNEL,
      type: "set-volume",
      volume: 0
    });
    expect(createVolumeBridgeMessage(Number.NaN)).toBeNull();
  });

  it("creates muted messages", () => {
    expect(createMutedBridgeMessage(true)).toEqual({
      channel: YOUTUBE_PLAYER_BRIDGE_CHANNEL,
      type: "set-muted",
      muted: true
    });
  });

  it("creates only positive finite playback-rate messages", () => {
    expect(createPlaybackRateBridgeMessage(1.5)).toEqual({
      channel: YOUTUBE_PLAYER_BRIDGE_CHANNEL,
      type: "set-playback-rate",
      playbackRate: 1.5
    });
    expect(createPlaybackRateBridgeMessage(0)).toBeNull();
    expect(createPlaybackRateBridgeMessage(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("creates finite non-negative seek messages", () => {
    expect(createSeekBridgeMessage(42.5)).toEqual({
      channel: YOUTUBE_PLAYER_BRIDGE_CHANNEL,
      type: "seek-to",
      time: 42.5
    });
    expect(createSeekBridgeMessage(-1)).toBeNull();
    expect(createSeekBridgeMessage(Number.NaN)).toBeNull();
  });

  it("creates previous and next track messages", () => {
    expect(createTrackNavigationBridgeMessage("previous")).toEqual({
      channel: YOUTUBE_PLAYER_BRIDGE_CHANNEL,
      type: "previous-track"
    });
    expect(createTrackNavigationBridgeMessage("next")).toEqual({
      channel: YOUTUBE_PLAYER_BRIDGE_CHANNEL,
      type: "next-track"
    });
  });

  it("parses and normalizes valid messages", () => {
    expect(
      parseYouTubePlayerBridgeMessage({
        channel: YOUTUBE_PLAYER_BRIDGE_CHANNEL,
        type: "set-volume",
        volume: 1.25
      })
    ).toEqual({
      channel: YOUTUBE_PLAYER_BRIDGE_CHANNEL,
      type: "set-volume",
      volume: 1
    });
    expect(
      parseYouTubePlayerBridgeMessage({
        channel: YOUTUBE_PLAYER_BRIDGE_CHANNEL,
        type: "seek-to",
        time: 90
      })
    ).toEqual({
      channel: YOUTUBE_PLAYER_BRIDGE_CHANNEL,
      type: "seek-to",
      time: 90
    });
    expect(
      parseYouTubePlayerBridgeMessage({
        channel: YOUTUBE_PLAYER_BRIDGE_CHANNEL,
        type: "previous-track"
      })
    ).toEqual({
      channel: YOUTUBE_PLAYER_BRIDGE_CHANNEL,
      type: "previous-track"
    });
    expect(
      parseYouTubePlayerBridgeMessage({
        channel: YOUTUBE_PLAYER_BRIDGE_CHANNEL,
        type: "next-track"
      })
    ).toEqual({
      channel: YOUTUBE_PLAYER_BRIDGE_CHANNEL,
      type: "next-track"
    });
  });

  it.each([
    null,
    [],
    { channel: "other", type: "set-muted", muted: true },
    { channel: YOUTUBE_PLAYER_BRIDGE_CHANNEL, type: "unknown" },
    { channel: YOUTUBE_PLAYER_BRIDGE_CHANNEL, type: "set-volume", volume: "1" },
    { channel: YOUTUBE_PLAYER_BRIDGE_CHANNEL, type: "set-muted", muted: 1 },
    { channel: YOUTUBE_PLAYER_BRIDGE_CHANNEL, type: "set-playback-rate", playbackRate: 0 },
    { channel: YOUTUBE_PLAYER_BRIDGE_CHANNEL, type: "seek-to", time: -1 }
  ])("rejects malformed bridge data %#", (value) => {
    expect(parseYouTubePlayerBridgeMessage(value)).toBeNull();
  });
});
