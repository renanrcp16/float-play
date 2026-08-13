import { expect, test } from "vitest";
import { calculateAspectAdjustment } from "./PipAspectFit";

test("fits landscape viewport width", () => {
  expect(calculateAspectAdjustment(526, 288, 2560, 1440)).toEqual({ width: -14, height: 0 });
});

test("keeps matching viewport unchanged", () => {
  expect(calculateAspectAdjustment(480, 270, 1920, 1080)).toEqual({ width: 0, height: 0 });
});
