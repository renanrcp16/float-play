import { FloatPlayController } from "./application/FloatPlayController";
import type { TimeDisplayMode } from "./application/Settings";
import { ChromeI18n } from "./infrastructure/chrome/ChromeI18n";
import { ChromeOnboardingStore } from "./infrastructure/chrome/ChromeOnboardingStore";
import { ChromeOptionsPage } from "./infrastructure/chrome/ChromeOptionsPage";
import { ChromeRuntime } from "./infrastructure/chrome/ChromeRuntime";
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
  const runtime = new ChromeRuntime();
  const settingsStore = new ChromeSettingsStore(logger);
  const onboardingStore = new ChromeOnboardingStore(logger);
  const [settings, hasSeenTriggerCoachmark] = await Promise.all([
    settingsStore.load(),
    onboardingStore.hasSeenTriggerCoachmark()
  ]);
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
      timeDisplayToggle: i18n.getMessage(
        "timeDisplayToggleAction",
        "Switch between elapsed and remaining time"
      ),
      fit: i18n.getMessage("fitAction", "Fit to video"),
      speed: i18n.getMessage("speedAction", "Speed"),
      settings: i18n.getMessage("settingsAction", "Settings"),
      moreOptions: i18n.getMessage("moreOptionsAction", "More options"),
      audioOnly: i18n.getMessage("audioOnlyAction", "Audio only"),
      showVideo: i18n.getMessage("showVideoAction", "Show video"),
      volume: i18n.getMessage("volumeAction", "Volume"),
      mute: i18n.getMessage("muteAction", "Mute"),
      unmute: i18n.getMessage("unmuteAction", "Unmute"),
      triggerOpen: i18n.getMessage("triggerOpenAction", "Open FloatPlay"),
      triggerCoachmark: i18n.getMessage(
        "triggerCoachmark",
        "Click here to open FloatPlay"
      ),
      triggerCoachmarkDismiss: i18n.getMessage(
        "triggerCoachmarkDismissAction",
        "Dismiss FloatPlay tip"
      )
    },
    runtime.getUrl("brand/icon.svg"),
    !hasSeenTriggerCoachmark,
    () => {
      void onboardingStore.markTriggerCoachmarkSeen();
    },
    settings,
    (mode) => {
      void persistTimeDisplayMode(settingsStore, mode);
    },
    (enabled) => {
      void persistAudioOnlyMode(settingsStore, enabled);
    },
    logger
  );

  controller.start();
}

async function persistTimeDisplayMode(
  settingsStore: ChromeSettingsStore,
  mode: TimeDisplayMode
): Promise<void> {
  try {
    await settingsStore.update({ timeDisplayMode: mode });
  } catch (error) {
    logger.error("Unable to persist the FloatPlay time display preference.", error);
  }
}

async function persistAudioOnlyMode(
  settingsStore: ChromeSettingsStore,
  enabled: boolean
): Promise<void> {
  try {
    await settingsStore.update({ audioOnlyEnabled: enabled });
  } catch (error) {
    logger.error("Unable to persist the FloatPlay Audio-only preference.", error);
  }
}

function formatSettingNumber(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    useGrouping: false
  });
}
