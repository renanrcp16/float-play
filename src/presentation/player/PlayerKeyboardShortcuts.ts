import {
  getAdjacentPlaybackRate,
  resolveKeyboardShortcut
} from "../../application/KeyboardShortcuts";
import { togglePlayback } from "../../application/MediaPlayback";
import { seekBy } from "../../application/MediaSeek";
import { adjustVolume, setMediaVolume } from "../../application/MediaVolume";
import { getDisplayedVolume, resolveVolumeInput } from "../../application/VolumeSemantics";
import type { PlaybackRateMirror } from "../../application/PlaybackSpeed";
import type { VolumeMirror } from "../../application/VolumeController";
import type { Logger } from "../../shared/Logger";

type PlayerShortcutMirror = VolumeMirror & PlaybackRateMirror;

export interface PlayerKeyboardConfig {
  readonly backwardSeconds: number;
  readonly forwardSeconds: number;
  readonly volumeStep: number;
}

export class PlayerKeyboardShortcuts {
  public constructor(
    private readonly media: HTMLVideoElement,
    private readonly playerWindow: Window,
    private readonly signal: AbortSignal,
    private readonly mirror: PlayerShortcutMirror,
    private readonly config: PlayerKeyboardConfig,
    private readonly logger: Logger
  ) {}

  public mount(): void {
    this.playerWindow.addEventListener(
      "keydown",
      (event) => {
        if (event.defaultPrevented || isInteractiveTarget(event.target)) {
          return;
        }

        const action = resolveKeyboardShortcut(event);

        if (action === null) {
          return;
        }

        event.preventDefault();

        switch (action) {
          case "toggle-playback":
            void togglePlayback(this.media).catch((error: unknown) => {
              this.logger.error("Unable to toggle playback from a keyboard shortcut.", error);
            });
            return;
          case "seek-backward":
            seekBy(this.media, -this.config.backwardSeconds);
            return;
          case "seek-forward":
            seekBy(this.media, this.config.forwardSeconds);
            return;
          case "volume-down":
            this.adjustVolume(-1);
            return;
          case "volume-up":
            this.adjustVolume(1);
            return;
          case "toggle-mute":
            this.setMuted(!this.media.muted);
            return;
          case "speed-down":
            this.adjustPlaybackRate(-1);
            return;
          case "speed-up":
            this.adjustPlaybackRate(1);
        }
      },
      { signal: this.signal }
    );
  }

  private adjustVolume(direction: -1 | 1): void {
    const displayedVolume = getDisplayedVolume(this.media.volume, this.media.muted);
    const requestedVolume = adjustVolume(displayedVolume, direction, this.config.volumeStep);
    const resolution = resolveVolumeInput(this.media.volume, requestedVolume, this.media.volume);

    if (resolution.muted) {
      this.media.volume = resolution.volume;
      this.media.muted = true;
      this.mirror.setVolume(resolution.volume);
      this.mirror.setMuted(true);
      return;
    }

    setMediaVolume(this.media, resolution.volume);
    this.mirror.setVolume(this.media.volume);
    this.mirror.setMuted(this.media.muted);
  }

  private setMuted(muted: boolean): void {
    this.media.muted = muted;
    this.mirror.setMuted(muted);
  }

  private adjustPlaybackRate(direction: -1 | 1): void {
    const nextRate = getAdjacentPlaybackRate(this.media.playbackRate, direction);

    if (nextRate !== null) {
      this.mirror.setPlaybackRate(nextRate);
    }
  }
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  const candidate = target as { closest?: (selector: string) => Element | null } | null;
  const interactive = candidate?.closest?.(
    "button, input, select, textarea, a[href], [contenteditable='true'], [role='button'], [role='slider']"
  );

  return interactive !== null && interactive !== undefined;
}
