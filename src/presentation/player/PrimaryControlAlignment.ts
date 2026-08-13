export function installPrimaryControlAlignment(document: Document, signal: AbortSignal): void {
  const style = document.createElement("style");
  style.dataset.floatplay = "primary-control-alignment";
  style.textContent = `
    .floatplay-button-row > .floatplay-playback-button > .floatplay-playback-icon,
    .floatplay-button-row > .floatplay-playback-button > .floatplay-navigation-icon {
      transform: translateY(-1px);
    }
  `;

  document.head.append(style);
  signal.addEventListener("abort", () => style.remove(), { once: true });
}
