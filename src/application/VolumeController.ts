export interface VolumeState {
  readonly volume: number;
  readonly muted: boolean;
}

export interface VolumeController {
  getState(): VolumeState;
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  subscribe(listener: () => void, signal: AbortSignal): void;
}
