import {
  optionsFormValuesToSettingsPatch,
  settingsToOptionsFormValues,
  type OptionsFormValues
} from "./application/OptionsForm";
import {
  DEFAULT_SETTINGS,
  MAX_AUTO_HIDE_DELAY_MS,
  MAX_SEEK_SECONDS,
  MAX_VOLUME_STEP,
  MIN_AUTO_HIDE_DELAY_MS,
  MIN_SEEK_SECONDS,
  MIN_VOLUME_STEP,
  type FloatPlaySettings
} from "./application/Settings";
import { resolveSupportedLocale } from "./application/SupportedLocale";
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
  applyCanonicalNumericConstraints(controls);
  updateAutoHideState(controls);
  installNumericInputGuards(controls);

  controls.autoHideEnabled.addEventListener("change", () => {
    updateAutoHideState(controls);
    clearStatus(controls);
  });

  controls.form.addEventListener("input", (event) => {
    if (event.target instanceof HTMLInputElement) {
      event.target.removeAttribute("aria-invalid");
    }

    clearStatus(controls);
  });
  controls.form.addEventListener("submit", (event) => {
    event.preventDefault();
    void saveSettings(controls);
  });
  controls.resetButton.addEventListener("click", () => {
    void resetSettings(controls);
  });
}

function localizeDocument(): void {
  document.documentElement.lang = resolveSupportedLocale(i18n.getUiLanguage("en"));
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
  applyCanonicalNumericConstraints(controls);
  updateAutoHideState(controls);

  const invalidInput = findInvalidNumericInput(controls);

  if (invalidInput !== null) {
    invalidInput.setAttribute("aria-invalid", "true");
    invalidInput.focus();
    return null;
  }

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

  const patch = optionsFormValuesToSettingsPatch(values);

  if (patch === null) {
    setStatus(
      controls,
      i18n.getMessage("optionsInvalidForm", "Check the highlighted settings before saving."),
      "error"
    );
    return;
  }

  setBusy(controls, true);

  try {
    await store.update(patch);
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
    await store.update({
      seekBackwardSeconds: DEFAULT_SETTINGS.seekBackwardSeconds,
      seekForwardSeconds: DEFAULT_SETTINGS.seekForwardSeconds,
      volumeStep: DEFAULT_SETTINGS.volumeStep,
      autoHideEnabled: DEFAULT_SETTINGS.autoHideEnabled,
      autoHideDelayMs: DEFAULT_SETTINGS.autoHideDelayMs
    });
    applySettings(controls, DEFAULT_SETTINGS);
    applyCanonicalNumericConstraints(controls);
    clearNumericInvalidState(controls);
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
  for (const input of numericInputs(controls)) {
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

function applyCanonicalNumericConstraints(controls: OptionsControls): void {
  configureNumericInput(controls.seekBackward, MIN_SEEK_SECONDS, MAX_SEEK_SECONDS, 1);
  configureNumericInput(controls.seekForward, MIN_SEEK_SECONDS, MAX_SEEK_SECONDS, 1);
  configureNumericInput(controls.volumeStep, MIN_VOLUME_STEP * 100, MAX_VOLUME_STEP * 100, 1);
  configureNumericInput(
    controls.autoHideDelay,
    MIN_AUTO_HIDE_DELAY_MS / 1000,
    MAX_AUTO_HIDE_DELAY_MS / 1000,
    1
  );

  controls.seekBackward.disabled = false;
  controls.seekForward.disabled = false;
  controls.volumeStep.disabled = false;
}

function configureNumericInput(
  input: HTMLInputElement,
  minimum: number,
  maximum: number,
  step: number
): void {
  input.type = "number";
  input.min = formatNumber(minimum);
  input.max = formatNumber(maximum);
  input.step = formatNumber(step);
  input.required = true;
}

function findInvalidNumericInput(controls: OptionsControls): HTMLInputElement | null {
  clearNumericInvalidState(controls);

  const constraints: ReadonlyArray<readonly [HTMLInputElement, number, number]> = [
    [controls.seekBackward, MIN_SEEK_SECONDS, MAX_SEEK_SECONDS],
    [controls.seekForward, MIN_SEEK_SECONDS, MAX_SEEK_SECONDS],
    [controls.volumeStep, MIN_VOLUME_STEP * 100, MAX_VOLUME_STEP * 100],
    [controls.autoHideDelay, MIN_AUTO_HIDE_DELAY_MS / 1000, MAX_AUTO_HIDE_DELAY_MS / 1000]
  ];

  for (const [input, minimum, maximum] of constraints) {
    const value = input.valueAsNumber;

    if (!Number.isInteger(value) || value < minimum || value > maximum) {
      return input;
    }
  }

  return null;
}

function numericInputs(controls: OptionsControls): readonly HTMLInputElement[] {
  return [
    controls.seekBackward,
    controls.seekForward,
    controls.volumeStep,
    controls.autoHideDelay
  ];
}

function clearNumericInvalidState(controls: OptionsControls): void {
  for (const input of numericInputs(controls)) {
    input.removeAttribute("aria-invalid");
  }
}

function containsUnsupportedNumberNotation(value: string): boolean {
  return /[-eE+.,]/.test(value);
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
