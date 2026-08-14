/* global window, document */

(() => {
  const channel = "floatplay:youtube-player";

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== window.location.origin) {
      return;
    }

    const message = event.data;

    if (
      typeof message !== "object" ||
      message === null ||
      message.channel !== channel ||
      typeof message.type !== "string"
    ) {
      return;
    }

    const player = document.getElementById("movie_player");

    if (player === null) {
      return;
    }

    if (
      message.type === "set-volume" &&
      typeof message.volume === "number" &&
      Number.isFinite(message.volume) &&
      typeof player.setVolume === "function"
    ) {
      const volume = Math.min(1, Math.max(0, message.volume));
      player.setVolume(volume * 100);
      return;
    }

    if (message.type === "set-muted" && typeof message.muted === "boolean") {
      if (message.muted && typeof player.mute === "function") {
        player.mute();
        return;
      }

      if (!message.muted && typeof player.unMute === "function") {
        player.unMute();
      }

      return;
    }

    if (
      message.type === "set-playback-rate" &&
      typeof message.playbackRate === "number" &&
      Number.isFinite(message.playbackRate) &&
      message.playbackRate > 0 &&
      typeof player.setPlaybackRate === "function"
    ) {
      player.setPlaybackRate(message.playbackRate);
    }
  });
})();
