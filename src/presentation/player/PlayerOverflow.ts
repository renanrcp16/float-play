import type { OptionsPageLauncher } from "../../application/OptionsPage";
import type { PlaybackRateMirror } from "../../application/PlaybackSpeed";
import type { Logger } from "../../shared/Logger";
import { createAudioOnlyMenuItem, type AudioOnlyLabels } from "./AudioOnlyMenuItem";
import { createFitMenuItem } from "./FitMenuItem";
import { PlayerMenu } from "./PlayerMenu";
import { createSettingsMenuItem } from "./SettingsMenuItem";
import { createSpeedMenuItem } from "./SpeedMenuItem";
import { createTrackNavigationMenuItem } from "./TrackNavigationMenuItem";

export interface TrackNavigationLabels {
  readonly previous: string;
  readonly next: string;
}

export class PlayerOverflow {
  public constructor(
    private readonly media: HTMLVideoElement,
    private readonly playerWindow: Window,
    private readonly signal: AbortSignal,
    private readonly playbackRateMirror: PlaybackRateMirror,
    private readonly optionsPageLauncher: OptionsPageLauncher,
    private readonly fitLabel: string,
    private readonly speedLabel: string,
    private readonly settingsLabel: string,
    private readonly moreOptionsLabel: string,
    private readonly audioOnlyLabels: AudioOnlyLabels,
    private readonly trackNavigationLabels: TrackNavigationLabels,
    private readonly trackNavigationVisible: boolean,
    private readonly onPreviousTrack: () => void,
    private readonly onNextTrack: () => void,
    private readonly audioOnlyEnabled: boolean,
    private readonly audioOnlyToggleVisible: boolean,
    private readonly onAudioOnlyChange: (enabled: boolean) => void,
    private readonly onMenuOpenChange: (open: boolean) => void,
    private readonly logger: Logger
  ) {}

  public mount(): void {
    const row = this.playerWindow.document.querySelector<HTMLElement>(".floatplay-button-row");

    if (row === null) {
      return;
    }

    const speedItem = createSpeedMenuItem(
      this.playerWindow.document,
      this.media,
      this.playbackRateMirror,
      this.speedLabel,
      this.signal
    );
    const fitItem = createFitMenuItem(
      this.playerWindow.document,
      this.media,
      this.playerWindow,
      this.fitLabel,
      this.signal,
      this.logger
    );
    fitItem.hidden = this.audioOnlyEnabled;

    const audioOnlyItem = createAudioOnlyMenuItem(
      this.playerWindow.document,
      this.audioOnlyEnabled,
      this.audioOnlyLabels,
      this.signal,
      (enabled) => {
        fitItem.hidden = enabled;
        this.onAudioOnlyChange(enabled);
      }
    );
    audioOnlyItem.element.hidden = !this.audioOnlyToggleVisible;

    const settingsItem = createSettingsMenuItem(
      this.playerWindow.document,
      this.optionsPageLauncher,
      this.settingsLabel,
      this.signal,
      this.logger
    );

    const trackNavigationItems = this.trackNavigationVisible
      ? [
          createTrackNavigationMenuItem(
            this.playerWindow.document,
            "previous",
            this.trackNavigationLabels.previous,
            this.signal,
            this.onPreviousTrack
          ),
          createTrackNavigationMenuItem(
            this.playerWindow.document,
            "next",
            this.trackNavigationLabels.next,
            this.signal,
            this.onNextTrack
          )
        ]
      : [];

    const menu = new PlayerMenu(
      this.playerWindow.document,
      this.signal,
      this.moreOptionsLabel,
      [
        ...trackNavigationItems,
        speedItem,
        audioOnlyItem.element,
        fitItem,
        settingsItem
      ],
      this.onMenuOpenChange
    ).create();

    row.append(menu);
  }
}
