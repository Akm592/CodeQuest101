import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { contrast, readTokens, type Rgb } from "./contrast";

const CSS = fileURLToPath(new URL("../../index.css", import.meta.url));
const tokens = readTokens(CSS);

const get = (name: string): Rgb => {
  const v = tokens.get(name);
  if (!v) throw new Error(`token --${name} is not defined in index.css`);
  return v;
};

const ratio = (fg: string, bg: string) => contrast(get(fg), get(bg));

describe("design tokens", () => {
  it("defines every token the app pairs up", () => {
    for (const name of [
      "background", "foreground", "card", "popover", "primary", "primary-foreground",
      "secondary", "secondary-foreground", "secondary-bright", "muted-foreground",
      "destructive", "destructive-foreground",
    ]) {
      expect(tokens.has(name), `--${name} missing`).toBe(true);
    }
  });

  // 4.5:1 is the WCAG AA threshold for body text, and the same bar the UI
  // consistency checker applies to rendered text.
  it.each([
    ["foreground", "background"],
    ["foreground", "card"],
    ["foreground", "popover"],
    ["muted-foreground", "background"],
    ["muted-foreground", "card"],
    // The message bubble and every filled button.
    ["primary-foreground", "primary"],
    ["secondary-foreground", "secondary"],
    ["destructive-foreground", "destructive"],
    // Added because --secondary itself measures 3.4:1 as text on a card.
    ["secondary-bright", "card"],
    ["secondary-bright", "background"],
  ])("%s on %s meets 4.5:1", (fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  // Regression guards. These pairings were shipped and were unreadable; the
  // assertion is that they are still bad, so nobody reintroduces one thinking
  // it looks fine on their monitor.
  it("confirms the pairings that caused real bugs are genuinely unreadable", () => {
    // The user message bubble was bg-primary with text-white.
    expect(contrast([255, 255, 255], get("primary"))).toBeLessThan(3);
    // Its markdown used text-primary on that same primary background.
    expect(ratio("primary", "primary")).toBeLessThan(1.1);
    // --secondary as text on a card, which is why --secondary-bright exists.
    expect(ratio("secondary", "card")).toBeLessThan(4.5);
  });
});
