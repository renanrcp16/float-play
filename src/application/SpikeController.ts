import type { DocumentPipManager } from "../infrastructure/pip/DocumentPipManager";
import type { YouTubeAdapter } from "../infrastructure/youtube/YouTubeAdapter";
import { SpikeTrigger } from "../presentation/spike/SpikeTrigger";
import type { Logger } from "../shared/Logger";

export class SpikeController {
  private readonly lifecycle = new AbortController();
  private readonly observer: MutationObserver;
  private readonly trigger: SpikeTrigger;
  private reconcileFrame: number | null = null;
  private busy = false;

  public constructor(
    private readonly youtube: YouTubeAdapter,
    private readonly pip: DocumentPipManager,
    private readonly logger: Logger
  ) {
    this.trigger = new SpikeTrigger({
      onActivate: () => {
        void this.openPipFromUserGesture();
      }
    });

    this.observer = new MutationObserver(() => {
      this.scheduleReconcile();
    });
  }

  public start(): void {
    this.trigger.mount();

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
    this.lifecycle.abort();
    this.observer.disconnect();

    if (this.reconcileFrame !== null) {
      window.cancelAnimationFrame(this.reconcileFrame);
      this.reconcileFrame = null;
    }

    this.trigger.dispose();
    this.pip.dispose();
  }

  private scheduleReconcile(): void {
    if (this.reconcileFrame !== null) {
      return;
    }

    this.reconcileFrame = window.requestAnimationFrame(() => {
      this.reconcileFrame = null;
      this.reconcile();
    });
  }

  private reconcile(): void {
    const hasMedia = this.youtube.findActiveMedia() !== null;
    const shouldShow =
      this.pip.isSupported() && this.youtube.isSupportedPage() && hasMedia && !this.pip.isOpen();

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
      await this.pip.open(media);
      this.logger.debug("Document Picture-in-Picture spike opened successfully.");
    } catch (error) {
      this.logger.error("Unable to open Document Picture-in-Picture.", error);
    } finally {
      this.busy = false;
      this.trigger.setBusy(false);
      this.scheduleReconcile();
    }
  }
}
