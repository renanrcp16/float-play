export const INTERACTIVE_ELEMENT_SELECTOR = [
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "summary",
  "label",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
  "[role='button']",
  "[role='checkbox']",
  "[role='link']",
  "[role='menuitem']",
  "[role='option']",
  "[role='radio']",
  "[role='slider']",
  "[role='switch']",
  "[role='tab']",
  "[role='textbox']"
].join(",");

interface ElementLikeTarget {
  closest?(selector: string): Element | null;
  getAttribute?(name: string): string | null;
  matches?(selector: string): boolean;
}

export function isInteractiveElementTarget(target: EventTarget | null): boolean {
  const candidate = target as ElementLikeTarget | null;
  return candidate?.closest?.(INTERACTIVE_ELEMENT_SELECTOR) != null;
}

export function eventPathHasInteractiveElement(path: readonly EventTarget[]): boolean {
  return path.some((target) => {
    const candidate = target as ElementLikeTarget;
    return candidate.matches?.(INTERACTIVE_ELEMENT_SELECTOR) === true;
  });
}

export function eventPathHasInteractiveElementBefore(
  path: readonly EventTarget[],
  boundary: EventTarget
): boolean {
  const boundaryIndex = path.indexOf(boundary);

  if (boundaryIndex < 0) {
    return false;
  }

  for (let index = 0; index < boundaryIndex; index += 1) {
    const candidate = path[index] as ElementLikeTarget;

    if (
      candidate.matches?.(INTERACTIVE_ELEMENT_SELECTOR) === true &&
      !isWithinAriaHiddenRegion(path, index, boundaryIndex)
    ) {
      return true;
    }
  }

  return false;
}

function isWithinAriaHiddenRegion(
  path: readonly EventTarget[],
  startIndex: number,
  boundaryIndex: number
): boolean {
  for (let index = startIndex; index < boundaryIndex; index += 1) {
    const candidate = path[index] as ElementLikeTarget;

    if (candidate.getAttribute?.("aria-hidden") === "true") {
      return true;
    }
  }

  return false;
}
