import { FloatPlayController } from "./application/FloatPlayController";
import { ChromeI18n } from "./infrastructure/chrome/ChromeI18n";
import { ChromeOptionsPage } from "./infrastructure/chrome/ChromeOptionsPage";
import { ChromeSettingsStore } from "./infrastructure/chrome/ChromeSettingsStore";
import { DocumentPipManager } from "./infrastructure/pip/DocumentPipManager";
import { YouTubeAdapter } from "./infrastructure/youtube/YouTubeAdapter";
import { ConsoleLogger } from "./shared/Logger";

const logger = new ConsoleLogger(false);

void bootstrap().catch((error: unknown) => {
  logger.error("Unable to initialize FloatPlay.", error);
});

async function bootstrap(): Promise<void> {
  const i18n = new ChromeI18n();
  const settings = await new ChromeSettingsStore(logger).load();
  const youtube = new YouTubeAdapter();
  const pip = new DocumentPipManager(logger);
  const optionsPage = new ChromeOptionsPage();
  const backwardSeconds = formatSettingNumber(settings.seekBackwardSeconds);
  const forwardSeconds = formatSettingNumber(settings.seekForwardSeconds);
  const controller = new FloatPlayController(
    youtube,
    pip,
    optionsPage,
    {
      play: i18n.getMessage("playAction", "Play"),
      pause: i18n.getMessage("pauseAction", "Pause"),
      backward: i18n.getMessage(
        "backwardAction",
        `Skip backward ${backwardSeconds} seconds`,
        backwardSeconds
      ),
      forward: i18n.getMessage(
        "forwardAction",
        `Skip forward ${forwardSeconds} seconds`,
        forwardSeconds
      ),
      timeline: i18n.getMessage("timelineAction", "Playback timeline"),
      fit: i18n.getMessage("fitAction", "Fit to video"),
      speed: i18n.getMessage("speedAction", "Speed"),
      settings: i18n.getMessage("settingsAction", "Settings"),
      moreOptions: i18n.getMessage("moreOptionsAction", "More options"),
      volume: i18n.getMessage("volumeAction", "Volume"),
      mute: i18n.getMessage("muteAction", "Mute"),
      unmute: i18n.getMessage("unmuteAction", "Unmute")
    },
    settings,
    logger
  );

  controller.start();
}

function formatSettingNumber(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    useGrouping: false
  });
}
