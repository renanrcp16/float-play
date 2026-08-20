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
  for (const target of path) {
    if (target === boundary) {
      return false;
    }

    const candidate = target as ElementLikeTarget;

    if (candidate.matches?.(INTERACTIVE_ELEMENT_SELECTOR) === true) {
      return true;
    }
  }

  return false;
}
