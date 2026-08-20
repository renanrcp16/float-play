export type TrackNavigationDirection = "previous" | "next";

export function createTrackNavigationMenuItem(
  document: Document,
  direction: TrackNavigationDirection,
  label: string,
  signal: AbortSignal,
  onActivate: () => void
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "floatplay-overflow-menu-item";
  button.dataset.floatplayCloseOverflow = "true";
  button.setAttribute("aria-label", label);
  button.title = label;

  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.classList.add("floatplay-overflow-menu-item-icon");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", "16");
  icon.setAttribute("height", "16");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("fill", "currentColor");

  const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bar.setAttribute("x", direction === "previous" ? "5" : "17");
  bar.setAttribute("y", "5");
  bar.setAttribute("width", "2");
  bar.setAttribute("height", "14");
  bar.setAttribute("rx", "1");

  const triangle = document.createElementNS("http://www.w3.org/2000/svg", "path");
  triangle.setAttribute(
    "d",
    direction === "previous" ? "M18 5.5v13L8 12l10-6.5Z" : "M6 5.5v13L16 12 6 5.5Z"
  );

  icon.append(bar, triangle);

  const text = document.createElement("span");
  text.className = "floatplay-overflow-menu-item-label";
  text.textContent = label;

  button.append(icon, text);
  button.addEventListener("click", onActivate, { signal });
  return button;
}
