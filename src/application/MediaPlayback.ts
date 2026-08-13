export interface PlaybackMedia {
  readonly paused: boolean;
  play(): Promise<void>;
  pause(): void;
}

export async function togglePlayback(media: PlaybackMedia): Promise<void> {
  if (media.paused) {
    await media.play();
    return;
  }

  media.pause();
}
