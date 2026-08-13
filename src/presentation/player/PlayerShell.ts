import type { Logger } from "../../shared/Logger";
import { PlayerOverflow } from "./PlayerOverflow";
import { PlayerShell as PlayerShellCore } from "./PlayerShellCore";
import type { PlayerPlaybackLabels as CoreLabels } from "./PlayerShellCore";

export interface PlayerPlaybackLabels extends CoreLabels {
  readonly fit: string;
  readonly moreOptions: string;
}

export class PlayerShell {
  private readonly core: PlayerShellCore;
  private readonly overflow: PlayerOverflow;

  public constructor(media: HTMLVideoElement, playerWindow: Window, sessionSignal: AbortSignal, labels: PlayerPlaybackLabels, logger: Logger) {
    this.core = new PlayerShellCore(media, playerWindow, sessionSignal, labels, logger);
    this.overflow = new PlayerOverflow(media, playerWindow, sessionSignal, labels.fit, labels.moreOptions, logger);
  }

  public mount(): void {
    this.core.mount();
    this.overflow.mount();
  }

  public dispose(): void {
    this.core.dispose();
  }
}
