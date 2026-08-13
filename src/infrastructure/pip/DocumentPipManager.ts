import type { Logger } from "../../shared/Logger";

interface DocumentPictureInPictureOptions {
  width?: number;
  height?: number;
  disallowReturnToOpener?: boolean;
  preferInitialWindowPlacement?: boolean;
}

interface DocumentPictureInPictureApi {
  readonly window: Window | null;
  requestWindow(options?: DocumentPictureInPictureOptions): Promise<Window>;
}

type WindowWithDocumentPictureInPicture = Window & {
  documentPictureInPicture?: DocumentPictureInPictureApi;
};

interface MediaOrigin {
  readonly placeholder: Comment;
  readonly parent: Node;
  readonly nextSibling: Node | null;
}

interface PipSession {
  readonly media: HTMLVideoElement;
  readonly pipWindow: Window;
  readonly origin: MediaOrigin;
  readonly lifecycle: AbortController;
}

export class DocumentPipUnavailableError extends Error {
  public constructor() {
    super("Document Picture-in-Picture is unavailable in this browser context.");
    this.name = "DocumentPipUnavailableError";
  }
}

export class MediaRestoreError extends Error {
  public constructor() {
    super("The media element could not be restored to a safe original DOM location.");
    this.name = "MediaRestoreError";
  }
}

export class DocumentPipManager {
  private session: PipSession | null = null;

  public constructor(private readonly logger: Logger) {}

  public isSupported(): boolean {
    return this.getApi() !== null;
  }

  public isOpen(): boolean {
    return this.session !== null;
  }

  public async open(media: HTMLVideoElement): Promise<void> {
    if (this.session !== null) {
      return;
    }

    if (!media.isConnected || media.parentNode === null) {
      throw new Error("The selected media element is no longer connected to the page.");
    }

    const api = this.getApi();

    if (api === null) {
      throw new DocumentPipUnavailableError();
    }

    const parent = media.parentNode;
    const nextSibling = media.nextSibling;
    const pipWindow = await api.requestWindow({
      width: 480,
      height: 320
    });

    if (!media.isConnected || media.parentNode !== parent) {
      pipWindow.close();
      throw new Error("The media element changed while the Picture-in-Picture window was opening.");
    }

    const placeholder = document.createComment("floatplay-media-origin");
    parent.insertBefore(placeholder, media);

    const lifecycle = new AbortController();
    const session: PipSession = {
      media,
      pipWindow,
      origin: {
        placeholder,
        parent,
        nextSibling
      },
      lifecycle
    };

    this.session = session;

    try {
      this.preparePipDocument(pipWindow.document);
      pipWindow.document.body.append(media);

      pipWindow.addEventListener(
        "pagehide",
        () => {
          this.restoreSession(session);
        },
        {
          once: true,
          signal: lifecycle.signal
        }
      );
    } catch (error) {
      this.restoreSession(session);
      pipWindow.close();
      throw error;
    }
  }

  public close(): void {
    this.session?.pipWindow.close();
  }

  public dispose(): void {
    const session = this.session;

    if (session === null) {
      return;
    }

    this.restoreSession(session);
    session.pipWindow.close();
  }

  private getApi(): DocumentPictureInPictureApi | null {
    const api = (window as WindowWithDocumentPictureInPicture).documentPictureInPicture;

    if (api === undefined || typeof api.requestWindow !== "function") {
      return null;
    }

    return api;
  }

  private preparePipDocument(document: Document): void {
    document.title = "FloatPlay";

    const style = document.createElement("style");
    style.textContent = `
      :root {
        color-scheme: dark;
        background: #000;
      }

      html,
      body {
        width: 100%;
        height: 100%;
        margin: 0;
        overflow: hidden;
        background: #000;
      }

      body {
        display: grid;
        place-items: stretch;
      }

      video {
        width: 100% !important;
        height: 100% !important;
        max-width: none !important;
        max-height: none !important;
        object-fit: contain !important;
      }
    `;

    document.head.append(style);
  }

  private restoreSession(session: PipSession): void {
    if (this.session !== session) {
      return;
    }

    session.lifecycle.abort();

    try {
      if (session.origin.placeholder.isConnected) {
        session.origin.placeholder.replaceWith(session.media);
        this.logger.debug("Restored media using the original placeholder.");
        return;
      }

      if (session.origin.parent.isConnected) {
        const sibling = session.origin.nextSibling;
        const validSibling = sibling !== null && sibling.parentNode === session.origin.parent;

        session.origin.parent.insertBefore(session.media, validSibling ? sibling : null);
        this.logger.warn("Restored media using the original parent because the placeholder was removed.");
        return;
      }

      throw new MediaRestoreError();
    } catch (error) {
      this.logger.error("Failed to restore the media element safely.", error);
    } finally {
      session.origin.placeholder.remove();
      this.session = null;
    }
  }
}
