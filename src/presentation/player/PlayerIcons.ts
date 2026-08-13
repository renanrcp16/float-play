export type NavigationDirection = "backward" | "forward";

export function createNavigationIcon(document: Document, direction: NavigationDirection): SVGSVGElement {
  const namespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(namespace, "svg");
  svg.classList.add("floatplay-navigation-icon");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "15");
  svg.setAttribute("height", "15");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  const group = document.createElementNS(namespace, "g");
  group.setAttribute("transform", "translate(0 -0.5)");
  const arrow = document.createElementNS(namespace, "path");
  const curve = document.createElementNS(namespace, "path");

  if (direction === "backward") {
    arrow.setAttribute("d", "M9 14 4 9l5-5");
    curve.setAttribute("d", "M4 9h10a6 6 0 0 1 0 12h-1");
  } else {
    arrow.setAttribute("d", "m15 14 5-5-5-5");
    curve.setAttribute("d", "M20 9H10a6 6 0 0 0 0 12h1");
  }

  group.append(arrow, curve);
  svg.append(group);
  return svg;
}

export function createPlaybackIcon(document: Document, showPlayIcon: boolean): SVGSVGElement {
  const namespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(namespace, "svg");
  svg.classList.add("floatplay-playback-icon");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "21");
  svg.setAttribute("height", "21");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("aria-hidden", "true");

  if (showPlayIcon) {
    const path = document.createElementNS(namespace, "path");
    path.setAttribute("d", "M8 5v14l11-7z");
    path.setAttribute("transform", "translate(-1.5 0)");
    svg.append(path);
    return svg;
  }

  const left = document.createElementNS(namespace, "path");
  left.setAttribute("d", "M7 5h4v14H7z");
  const right = document.createElementNS(namespace, "path");
  right.setAttribute("d", "M13 5h4v14h-4z");
  svg.append(left, right);
  return svg;
}
