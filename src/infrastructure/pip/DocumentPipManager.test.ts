import { afterEach, describe, expect, it, vi } from "vitest";

import type { Logger } from "../../shared/Logger";
import { DocumentPipManager } from "./DocumentPipManager";

function createDeferred<T>() {
  let resolve!: (value: T) => void;

  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

function createHarness() {
  const placeholder = {
    isConnected: true,
    replaceWith: vi.fn(),
    remove: vi.fn()
  };

  const pageDocument = {
    createComment: vi.fn(() => placeholder)
  };

  vi.stubGlobal("document", pageDocument);

  const initialParent = {
    isConnected: true,
    insertBefore: vi.fn()
  };
  const replacementParent = {
    isConnected: true,
    insertBefore: vi.fn()
  };

  const mediaState: {
    isConnected: boolean;
    parentElement: HTMLElement | null;
    nextSibling: Node | null;
    videoWidth: number;
    videoHeight: number;
    clientWidth: number;
    clientHeight: number;
  } = {
    isConnected: true,
    parentElement: initialParent as unknown as HTMLElement,
    nextSibling: { nodeType: 8 } as Node,
    videoWidth: 1920,
    videoHeight: 1080,
    clientWidth: 1920,
    clientHeight: 1080
  };
  const media = mediaState as unknown as HTMLVideoElement;

  const pendingWindow = createDeferred<Window>();
  const requestWindow = vi.fn(() => pendingWindow.promise);
  vi.stubGlobal("window", {
    documentPictureInPicture: { requestWindow }
  });

  const pipDocument = {
    title: "",
    createElement: vi.fn(() => ({ textContent: "" })),
    head: { append: vi.fn() },
    body: { append: vi.fn() }
  };
  const pipWindow = {
    document: pipDocument,
    addEventListener: vi.fn(),
    close: vi.fn()
  } as unknown as Window;

  const logger: Logger = {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  };

  return {
    initialParent,
    logger,
    manager: new DocumentPipManager(logger),
    media,
    mediaState,
    pageDocument,
    pendingWindow,
    pipDocument,
    pipWindow,
    placeholder,
    replacementParent
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DocumentPipManager", () => {
  it("keeps the PiP session open when YouTube reparents the same media while the window is opening", async () => {
    const harness = createHarness();
    const opening = harness.manager.open(harness.media);

    const replacementSibling = { nodeType: 8 } as Node;
    harness.mediaState.parentElement = harness.replacementParent as unknown as HTMLElement;
    harness.mediaState.nextSibling = replacementSibling;
    harness.pendingWindow.resolve(harness.pipWindow);

    const session = await opening;

    expect(session.originElement).toBe(harness.replacementParent);
    expect(harness.replacementParent.insertBefore).toHaveBeenCalledWith(
      harness.placeholder,
      harness.media
    );
    expect(harness.initialParent.insertBefore).not.toHaveBeenCalled();
    expect(harness.pipDocument.body.append).toHaveBeenCalledWith(harness.media);
    expect(harness.pipWindow.close).not.toHaveBeenCalled();
    expect(harness.manager.isOpen()).toBe(true);

    harness.manager.dispose();

    expect(harness.placeholder.replaceWith).toHaveBeenCalledWith(harness.media);
    expect(harness.manager.isOpen()).toBe(false);
  });

  it("closes the newly created PiP window when YouTube detaches the selected media", async () => {
    const harness = createHarness();
    const opening = harness.manager.open(harness.media);

    harness.mediaState.isConnected = false;
    harness.mediaState.parentElement = null;
    harness.pendingWindow.resolve(harness.pipWindow);

    await expect(opening).rejects.toThrow(
      "The selected media element was detached while the Picture-in-Picture window was opening."
    );

    expect(harness.pipWindow.close).toHaveBeenCalledOnce();
    expect(harness.pageDocument.createComment).not.toHaveBeenCalled();
    expect(harness.manager.isOpen()).toBe(false);
  });
});
