import { describe, expect, it } from "vitest";

import { isNearBottom } from "./scroll";

describe("isNearBottom", () => {
  it("is true at the very bottom", () => {
    expect(isNearBottom(600, 400, 1000)).toBe(true);
  });

  it("is true within the threshold", () => {
    expect(isNearBottom(530, 400, 1000)).toBe(true);
    expect(isNearBottom(520, 400, 1000)).toBe(true);
  });

  it("is false once scrolled up past the threshold", () => {
    expect(isNearBottom(519, 400, 1000)).toBe(false);
    expect(isNearBottom(0, 400, 1000)).toBe(false);
  });

  it("is true for a list too short to scroll", () => {
    expect(isNearBottom(0, 400, 300)).toBe(true);
    expect(isNearBottom(0, 400, 400)).toBe(true);
  });

  // High-DPI screens report fractional scrollTop against an integer
  // scrollHeight, so "fully scrolled" can land half a pixel short. That is the
  // case the threshold exists for; with none, it reads as scrolled up.
  it("treats a fractional near-miss as the bottom only thanks to the threshold", () => {
    expect(isNearBottom(599.5, 400, 1000)).toBe(true);
    expect(isNearBottom(599.5, 400, 1000, 0)).toBe(false);
  });

  it("honours a custom threshold", () => {
    expect(isNearBottom(500, 400, 1000, 100)).toBe(true);
    expect(isNearBottom(500, 400, 1000, 99)).toBe(false);
  });
});
