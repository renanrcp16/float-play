import { expect as assert, test as check } from "vitest";
import { calculateInitialPipSize } from "./PipWindowSize";

check("landscape sizing", () => {
  assert(calculateInitialPipSize(1920, 1080)).toEqual({ width: 480, height: 270 });
});

check("4:3 landscape sizing", () => {
  assert(calculateInitialPipSize(1440, 1080)).toEqual({ width: 480, height: 360 });
});

check("vertical sizing", () => {
  assert(calculateInitialPipSize(1080, 1920)).toEqual({ width: 270, height: 480 });
});

check("fallback sizing", () => {
  assert(calculateInitialPipSize(0, 0)).toEqual({ width: 480, height: 270 });
});
