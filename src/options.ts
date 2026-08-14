import {
  optionsFormValuesToSettings,
  settingsToOptionsFormValues,
  type OptionsFormValues
} from "./application/OptionsForm";
import { DEFAULT_SETTINGS, type FloatPlaySettings } from "./application/Settings";
import { ChromeI18n } from "./infrastructure/chrome/ChromeI18n";
import { ChromeSettingsStore } from "./infrastructure/chrome/ChromeSettingsStore";
import { ConsoleLogger } from "./shared/Logger";

interface OptionsControls {
  readonly form: HTMLFormElement;
  readonly seekBackward: HTMLInputElement;
  readonly seekForward: HTMLInputElement;
  readonly volumeStep: HTMLInputElement;
  readonly autoHideEnabled: HTMLInputElement;
  readonly autoHideDelay: HTMLInputElement;
  readonly saveButton: HTMLButtonElement;
  readonly resetButton: HTMLButtonElement;
  readonly status: HTMLParagraphElement;
}

const logger = new ConsoleLogger(false);
const i18n = new ChromeI18n();
const store = new ChromeSettingsStore(logger);

void initialize().catch((error: unknown) => {
  logger.error("Unable to initialize the FloatPlay options page.", error);
});

async function initialize(): Promise<void> {
  localizeDocument();
  const controls = readControls();
  const settings = await store.load();

  applySettings(controls, settings);
  updateAutoHideState(controls);
  installNumericInputGuards(controls);

  controls.autoHideEnabled.addEventListener("change", () => {
    updateAutoHideState(controls);
    clearStatus(controls);
  });

  controls.form.addEventListener("input", () => clearStatus(controls));
  controls.form.addEventListener("submit", (event) => {
    event.preventDefault();
    void saveSettings(controls);
  });
  controls.resetButton.addEventListener("click", () => {
    void resetSettings(controls);
  });
}

function localizeDocument(): void {
  document.documentElement.lang = i18n.getUiLanguage("en");
  document.title = i18n.getMessage("optionsPageTitle", "FloatPlay Settings");

  for (const element of document.querySelectorAll<HTMLElement>("[data-i18n]")) {
    const key = element.dataset.i18n;

    if (key === undefined) {
      continue;
    }

    element.textContent = i18n.getMessage(key, element.textContent ?? "");
  }
}

function readControls(): OptionsControls {
  return {
    form: requireElement<HTMLFormElement>("settings-form"),
    seekBackward: requireElement<HTMLInputElement>("seek-backward"),
    seekForward: requireElement<HTMLInputElement>("seek-forward"),
    volumeStep: requireElement<HTMLInputElement>("volume-step"),
    autoHideEnabled: requireElement<HTMLInputElement>("auto-hide-enabled"),
    autoHideDelay: requireElement<HTMLInputElement>("auto-hide-delay"),
    saveButton: requireElement<HTMLButtonElement>("save-button"),
    resetButton: requireElement<HTMLButtonElement>("reset-button"),
    status: requireElement<HTMLParagraphElement>("form-status")
  };
}

function applySettings(controls: OptionsControls, settings: FloatPlaySettings): void {
  const values = settingsToOptionsFormValues(settings);
  controls.seekBackward.value = formatNumber(values.seekBackwardSeconds);
  controls.seekForward.value = formatNumber(values.seekForwardSeconds);
  controls.volumeStep.value = formatNumber(values.volumeStepPercent);
  controls.autoHideEnabled.checked = values.autoHideEnabled;
  controls.autoHideDelay.value = formatNumber(values.autoHideDelaySeconds);
}

function readFormValues(controls: OptionsControls): OptionsFormValues | null {
  if (!controls.form.reportValidity()) {
    return null;
  }

  return {
    seekBackwardSeconds: controls.seekBackward.valueAsNumber,
    seekForwardSeconds: controls.seekForward.valueAsNumber,
    volumeStepPercent: controls.volumeStep.valueAsNumber,
    autoHideEnabled: controls.autoHideEnabled.checked,
    autoHideDelaySeconds: controls.autoHideDelay.valueAsNumber
  };
}

async function saveSettings(controls: OptionsControls): Promise<void> {
  const values = readFormValues(controls);

  if (values === null) {
    setStatus(
      controls,
      i18n.getMessage("optionsInvalidForm", "Check the highlighted settings before saving."),
      "error"
    );
    return;
  }

  setBusy(controls, true);

  try {
    const currentSettings = await store.load();
    const settings = optionsFormValuesToSettings(values, currentSettings);

    if (settings === null) {
      setStatus(
        controls,
        i18n.getMessage("optionsInvalidForm", "Check the highlighted settings before saving."),
        "error"
      );
      return;
    }

    await store.save(settings);
    setStatus(
      controls,
      i18n.getMessage("optionsSaved", "Settings saved. Reload open YouTube tabs to apply them."),
      "success"
    );
  } catch (error) {
    logger.error("Unable to save FloatPlay settings from the options page.", error);
    setStatus(
      controls,
      i18n.getMessage("optionsSaveError", "Unable to save settings. Try again."),
      "error"
    );
  } finally {
    setBusy(controls, false);
  }
}

async function resetSettings(controls: OptionsControls): Promise<void> {
  setBusy(controls, true);

  try {
    const currentSettings = await store.load();
    const settings = {
      ...DEFAULT_SETTINGS,
      timeDisplayMode: currentSettings.timeDisplayMode
    };

    await store.save(settings);
    applySettings(controls, settings);
    updateAutoHideState(controls);
    setStatus(
      controls,
      i18n.getMessage("optionsResetDone", "Default settings restored. Reload open YouTube tabs to apply them."),
      "success"
    );
  } catch (error) {
    logger.error("Unable to reset FloatPlay settings from the options page.", error);
    setStatus(
      controls,
      i18n.getMessage("optionsSaveError", "Unable to save settings. Try again."),
      "error"
    );
  } finally {
    setBusy(controls, false);
  }
}

function installNumericInputGuards(controls: OptionsControls): void {
  for (const input of [
    controls.seekBackward,
    controls.seekForward,
    controls.volumeStep,
    controls.autoHideDelay
  ]) {
    input.addEventListener("keydown", (event) => {
      if (containsUnsupportedNumberNotation(event.key)) {
        event.preventDefault();
      }
    });

    input.addEventListener("beforeinput", (event) => {
      if (event.data !== null && containsUnsupportedNumberNotation(event.data)) {
        event.preventDefault();
      }
    });
  }
}

function containsUnsupportedNumberNotation(value: string): boolean {
  return /[eE+\-]/.test(value);
}

function updateAutoHideState(controls: OptionsControls): void {
  controls.autoHideDelay.disabled = !controls.autoHideEnabled.checked;
}

function setBusy(controls: OptionsControls, busy: boolean): void {
  controls.saveButton.disabled = busy;
  controls.resetButton.disabled = busy;
}

function setStatus(
  controls: OptionsControls,
  message: string,
  tone: "success" | "error"
): void {
  controls.status.textContent = message;
  controls.status.dataset.tone = tone;
}

function clearStatus(controls: OptionsControls): void {
  controls.status.textContent = "";
  delete controls.status.dataset.tone;
}

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);

  if (element === null) {
    throw new Error(`Required options page element #${id} was not found.`);
  }

  return element as T;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toFixed(0) : value.toString();
}
