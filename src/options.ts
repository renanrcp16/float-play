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
  readonly seekBackwardError: HTMLParagraphElement;
  readonly seekForward: HTMLInputElement;
  readonly seekForwardError: HTMLParagraphElement;
  readonly volumeStep: HTMLInputElement;
  readonly volumeStepError: HTMLParagraphElement;
  readonly autoHideEnabled: HTMLInputElement;
  readonly autoHideDelay: HTMLInputElement;
  readonly autoHideDelayError: HTMLParagraphElement;
  readonly saveButton: HTMLButtonElement;
  readonly resetButton: HTMLButtonElement;
  readonly status: HTMLParagraphElement;
}

interface NumericFieldConstraint {
  readonly input: HTMLInputElement;
  readonly error: HTMLParagraphElement;
  readonly minimum: number;
  readonly maximum: number;
  readonly messageKey: string;
  readonly fallbackMessage: string;
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

    if (!controls.autoHideEnabled.checked) {
      clearNumericFieldError(controls.autoHideDelay, controls.autoHideDelayError);
    }

    clearStatus(controls);
  });

  controls.form.addEventListener("input", (event) => {
    if (event.target instanceof HTMLInputElement) {
      refreshNumericFieldError(controls, event.target);
    }

    clearStatus(controls);
  });
  controls.form.addEventListener(
    "invalid",
    (event) => {
      if (!(event.target instanceof HTMLInputElement)) {
        return;
      }

      const constraint = numericFieldConstraints(controls).find(
        (candidate) => candidate.input === event.target
      );

      if (constraint !== undefined) {
        validateNumericField(constraint);
      }
    },
    true
  );
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
    seekBackwardError: requireElement<HTMLParagraphElement>("seek-backward-error"),
    seekForward: requireElement<HTMLInputElement>("seek-forward"),
    seekForwardError: requireElement<HTMLParagraphElement>("seek-forward-error"),
    volumeStep: requireElement<HTMLInputElement>("volume-step"),
    volumeStepError: requireElement<HTMLParagraphElement>("volume-step-error"),
    autoHideEnabled: requireElement<HTMLInputElement>("auto-hide-enabled"),
    autoHideDelay: requireElement<HTMLInputElement>("auto-hide-delay"),
    autoHideDelayError: requireElement<HTMLParagraphElement>("auto-hide-delay-error"),
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

  const invalidInput = validateNumericInputs(controls);

  if (invalidInput !== null) {
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
    clearNumericInvalidState(controls);
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
  for (const constraint of numericFieldConstraints(controls)) {
    const input = constraint.input;

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

    input.addEventListener("change", () => {
      validateNumericField(constraint);
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

function validateNumericInputs(controls: OptionsControls): HTMLInputElement | null {
  let firstInvalid: HTMLInputElement | null = null;

  for (const constraint of numericFieldConstraints(controls)) {
    if (constraint.input.disabled) {
      clearNumericFieldError(constraint.input, constraint.error);
      continue;
    }

    const isValid = validateNumericField(constraint);

    if (!isValid && firstInvalid === null) {
      firstInvalid = constraint.input;
    }
  }

  return firstInvalid;
}

function validateNumericField(constraint: NumericFieldConstraint): boolean {
  const value = constraint.input.valueAsNumber;
  const isValid =
    Number.isInteger(value) && value >= constraint.minimum && value <= constraint.maximum;

  if (isValid) {
    clearNumericFieldError(constraint.input, constraint.error);
    return true;
  }

  constraint.input.setAttribute("aria-invalid", "true");
  constraint.error.textContent = i18n.getMessage(constraint.messageKey, constraint.fallbackMessage);
  return false;
}

function refreshNumericFieldError(controls: OptionsControls, input: HTMLInputElement): void {
  const constraint = numericFieldConstraints(controls).find((candidate) => candidate.input === input);

  if (constraint === undefined) {
    return;
  }

  if (!input.hasAttribute("aria-invalid") && constraint.error.textContent === "") {
    return;
  }

  validateNumericField(constraint);
}

function numericFieldConstraints(controls: OptionsControls): readonly NumericFieldConstraint[] {
  return [
    {
      input: controls.seekBackward,
      error: controls.seekBackwardError,
      minimum: MIN_SEEK_SECONDS,
      maximum: MAX_SEEK_SECONDS,
      messageKey: "optionsSeekSecondsError",
      fallbackMessage: "Use a whole number from 1 to 600 seconds."
    },
    {
      input: controls.seekForward,
      error: controls.seekForwardError,
      minimum: MIN_SEEK_SECONDS,
      maximum: MAX_SEEK_SECONDS,
      messageKey: "optionsSeekSecondsError",
      fallbackMessage: "Use a whole number from 1 to 600 seconds."
    },
    {
      input: controls.volumeStep,
      error: controls.volumeStepError,
      minimum: MIN_VOLUME_STEP * 100,
      maximum: MAX_VOLUME_STEP * 100,
      messageKey: "optionsVolumeStepError",
      fallbackMessage: "Use a whole number from 1% to 100%."
    },
    {
      input: controls.autoHideDelay,
      error: controls.autoHideDelayError,
      minimum: MIN_AUTO_HIDE_DELAY_MS / 1000,
      maximum: MAX_AUTO_HIDE_DELAY_MS / 1000,
      messageKey: "optionsAutoHideDelayError",
      fallbackMessage: "Use a whole number from 0 to 60 seconds."
    }
  ];
}

function clearNumericFieldError(input: HTMLInputElement, error: HTMLParagraphElement): void {
  input.removeAttribute("aria-invalid");
  error.textContent = "";
}

function clearNumericInvalidState(controls: OptionsControls): void {
  for (const constraint of numericFieldConstraints(controls)) {
    clearNumericFieldError(constraint.input, constraint.error);
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
