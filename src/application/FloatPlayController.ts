import type { OptionsPageLauncher } from "./OptionsPage";
import type { FloatPlaySettings, TimeDisplayMode } from "./Settings";
import type { DocumentPipManager, DocumentPipSession } from "../infrastructure/pip/DocumentPipManager";
import type { YouTubeAdapter } from "../infrastructure/youtube/YouTubeAdapter";
import { OriginPlaybackSurface } from "../presentation/player/OriginPlaybackSurface";
import { PlayerControlsVisibility } from "../presentation/player/PlayerControlsVisibility";
import { PlayerKeyboardShortcuts } from "../presentation/player/PlayerKeyboardShortcuts";
import { PlayerOverflow } from "../presentation/player/PlayerOverflow";
import { PlayerShell } from "../presentation/player/PlayerShell";
import type { PlayerPlaybackLabels } from "../presentation/player/PlayerShell";
import { VolumeControl } from "../presentation/player/VolumeControl";
import type { VolumeControlLabels } from "../presentation/player/VolumeControl";
import { SpikeTrigger } from "../presentation/spike/SpikeTrigger";
import type { Logger } from "../shared/Logger";

interface FloatPlayLabels extends PlayerPlaybackLabels, VolumeControlLabels {
  readonly fit: string;
  readonly speed: string;
  readonly settings: string;
  readonly moreOptions: string;
  readonly triggerOpen: string;
}

export class FloatPlayController {
  private readonly lifecycle = new AbortController();
  private readonly observer: MutationObserver;
  private readonly trigger: SpikeTrigger;
  private reconcileFrame: number | null = null;
  private playerShell: PlayerShell | null = null;
  private originSurface: OriginPlaybackSurface | null = null;
  private busy = false;

  public constructor(
    private readonly youtube: YouTubeAdapter,
    private readonly pip: DocumentPipManager,
    private readonly optionsPage: OptionsPageLauncher,
    private readonly labels: FloatPlayLabels,
    triggerIconUrl: string,
    private settings: FloatPlaySettings,
    private readonly persistTimeDisplayMode: (mode: TimeDisplayMode) => void,
    private readonly logger: Logger
  ) {
    this.trigger = new SpikeTrigger({
      label: this.labels.triggerOpen,
      iconUrl: triggerIconUrl,
      onActivate: () => {
        void this.openPipFromUserGesture();
      }
    });

    this.observer = new MutationObserver(() => {
      this.scheduleReconcile();
    });
  }

  public start(): void {
    this.trigger.mount(this.youtube.findTriggerAnchor());

    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    window.addEventListener(
      "popstate",
      () => {
        this.scheduleReconcile();
      },
      { signal: this.lifecycle.signal }
    );

    window.addEventListener(
      "pagehide",
      () => {
        this.dispose();
      },
      { once: true, signal: this.lifecycle.signal }
    );

    this.reconcile();
  }

  public dispose(): void {
    if (this.lifecycle.signal.aborted) {
      return;
    }

    this.lifecycle.abort();
    this.observer.disconnect();

    if (this.reconcileFrame !== null) {
      window.cancelAnimationFrame(this.reconcileFrame);
      this.reconcileFrame = null;
    }

    this.trigger.dispose();
    this.disposePresentation();
    this.pip.dispose();
  }

  private scheduleReconcile(): void {
    if (this.lifecycle.signal.aborted || this.reconcileFrame !== null) {
      return;
    }

    this.reconcileFrame = window.requestAnimationFrame(() => {
      this.reconcileFrame = null;
      this.reconcile();
    });
  }

  private reconcile(): void {
    const supportedPage = this.youtube.isSupportedPage();

    if (!supportedPage) {
      this.trigger.setVisible(false);

      if (this.pip.isOpen()) {
        this.pip.dispose();
      }

      return;
    }

    this.trigger.refreshPlacement(this.youtube.findTriggerAnchor());

    const hasMedia = this.youtube.findActiveMedia() !== null;
    const shouldShow = this.pip.isSupported() && hasMedia && !this.pip.isOpen();

    this.trigger.setVisible(shouldShow);
  }

  private async openPipFromUserGesture(): Promise<void> {
    if (this.busy || this.pip.isOpen()) {
      return;
    }

    const media = this.youtube.findActiveMedia();

    if (media === null) {
      this.scheduleReconcile();
      return;
    }

    this.busy = true;
    this.trigger.setBusy(true);

    try {
      const session = await this.pip.open(media);
      this.mountPresentation(session);
      this.logger.debug("FloatPlay player session opened successfully.");
    } catch (error) {
      this.disposePresentation();
      this.pip.dispose();
      this.logger.error("Unable to open the FloatPlay player session.", error);
    } finally {
      this.busy = false;
      this.trigger.setBusy(false);
      this.scheduleReconcile();
    }
  }

  private mountPresentation(session: DocumentPipSession): void {
    if (session.signal.aborted) {
      return;
    }

    this.disposePresentation();

    const playerShell = new PlayerShell(
      session.media,
      session.pipWindow,
      session.signal,
      this.labels,
      {
        backwardSeconds: this.settings.seekBackwardSeconds,
        forwardSeconds: this.settings.seekForwardSeconds,
        timeDisplayMode: this.settings.timeDisplayMode,
        onTimeDisplayModeChange: (mode) => this.updateTimeDisplayMode(mode)
      },
      this.logger
    );
    const playerOverflow = new PlayerOverflow(
      session.media,
      session.pipWindow,
      session.signal,
      this.youtube,
      this.optionsPage,
      this.labels.fit,
      this.labels.speed,
      this.labels.settings,
      this.labels.moreOptions,
      this.logger
    );
    const volumeControl = new VolumeControl(
      session.media,
      session.pipWindow,
      session.signal,
      this.labels,
      this.youtube,
      this.settings.volumeStep,
      this.logger
    );
    const keyboardShortcuts = new PlayerKeyboardShortcuts(
      session.media,
      session.pipWindow,
      session.signal,
      this.youtube,
      {
        backwardSeconds: this.settings.seekBackwardSeconds,
        forwardSeconds: this.settings.seekForwardSeconds,
        volumeStep: this.settings.volumeStep
      },
      this.logger
    );
    const controlsVisibility = new PlayerControlsVisibility(
      session.media,
      session.pipWindow,
      session.signal,
      {
        enabled: this.settings.autoHideEnabled,
        delayMs: this.settings.autoHideDelayMs
      }
    );
    const originSurface = new OriginPlaybackSurface(
      session.media,
      session.originElement.ownerDocument,
      session.originBounds,
      session.signal,
      this.logger
    );

    playerShell.mount();
    volumeControl.mount();
    playerOverflow.mount();
    keyboardShortcuts.mount();
    controlsVisibility.mount();
    originSurface.mount();

    this.playerShell = playerShell;
    this.originSurface = originSurface;

    session.signal.addEventListener(
      "abort",
      () => {
        if (this.playerShell === playerShell) {
          this.playerShell = null;
        }

        if (this.originSurface === originSurface) {
          this.originSurface = null;
        }

        this.scheduleReconcile();
      },
      { once: true }
    );
  }

  private updateTimeDisplayMode(mode: TimeDisplayMode): void {
    if (this.settings.timeDisplayMode === mode) {
      return;
    }

    this.settings = {
      ...this.settings,
      timeDisplayMode: mode
    };
    this.persistTimeDisplayMode(mode);
  }

  private disposePresentation(): void {
    this.playerShell?.dispose();
    this.originSurface?.dispose();
    this.playerShell = null;
    this.originSurface = null;
  }
}
