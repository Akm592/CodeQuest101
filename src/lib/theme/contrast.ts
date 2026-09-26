// WCAG contrast over the design tokens in index.css.
//
// The UI consistency checker measures rendered text, which only covers what it
// can get on screen. It visits /chat, but with no backend there are no
// messages, so it never sampled a message bubble — which is how the user bubble
// kept `text-white` on `bg-primary` (1.87:1) long after the same pairing was
// fixed everywhere else.
//
// Token pairs can be checked without rendering anything, so they are checked
// here instead.

import { readFileSync } from "node:fs";

export type Rgb = [number, number, number];

/** Parse `--name: H S% L%;` declarations out of a CSS file. */
export function readTokens(cssPath: string): Map<string, Rgb> {
  const css = readFileSync(cssPath, "utf8");
  const out = new Map<string, Rgb>();
  const re = /--([a-z0-9-]+):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*;/gi;

  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    out.set(m[1], hslToRgb(Number(m[2]), Number(m[3]), Number(m[4])));
  }
  return out;
}

export function hslToRgb(h: number, s: number, l: number): Rgb {
  const sf = s / 100;
  const lf = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sf * Math.min(lf, 1 - lf);
  const f = (n: number) => lf - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

function luminance([r, g, b]: Rgb): number {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrast(fg: Rgb, bg: Rgb): number {
  const a = luminance(fg) + 0.05;
  const b = luminance(bg) + 0.05;
  return Math.max(a, b) / Math.min(a, b);
}
