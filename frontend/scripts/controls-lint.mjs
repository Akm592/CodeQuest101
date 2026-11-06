// Guards against playback controls drifting apart again.
//
// Seven files used to hand-roll play/pause/speed, and they had already
// diverged: five different speed-constant triples, four with no accessible
// name, one whose slider ran backwards, one painting outside the token system.
// `VisualizerControls` collapses that — but only stays collapsed if something
// checks.
//
// This is a grep, not a browser test, precisely so it can run in CI.
// `ui-consistency-check.mjs` needs a preview build and a real Chromium and
// takes minutes, which is why it is still run by hand; this takes milliseconds.
//
// ALLOWLIST: files still allowed to hand-roll controls. It is empty now that
// every visualizer is migrated.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src/components");

/** Where the shared control surface legitimately lives. */
const OWNER = "src/components/Visualizer/VisualizerControls.tsx";

/**
 * Files allowed to hand-roll controls. Empty: every visualizer now uses
 * VisualizerControls. Keep it that way.
 */
const ALLOWLIST = new Set([]);

/**
 * A file is rolling its own playback speed control when it imports the Slider
 * primitive AND talks about speed.
 *
 * Naming the constants instead (MIN_SPEED_MS, calculateDelay) misses
 * RotateImageVisualizer, which hand-rolls a slider with raw milliseconds and
 * none of those identifiers — the file with the actual bug. Matching a bare
 * Slider import instead over-fires on NeuralNetworkVisualizer, whose three
 * sliders set hidden layers and neuron counts and are entirely legitimate.
 *
 * The conjunction separates them cleanly: NeuralNetworkVisualizer mentions
 * "speed" zero times, every genuine offender at least six.
 */
const IMPORTS_SLIDER = /^\s*import\s*\{[^}]*\bSlider\b[^}]*\}\s*from\s*["'][^"']*\/ui\/slider["']/m;
const MENTIONS_SPEED = /\bspeed\b/i;

/** Extra detail for the report, so a failure names the idiom in use. */
const IDIOMS = [
  { re: /\bMIN_SPEED_MS\b|\bMAX_SPEED_MS\b/, what: "local speed constants" },
  { re: /\bcalculateDelay\b/, what: "local calculateDelay helper" },
  { re: /speedToSliderValue|sliderValueToSpeed/, what: "bespoke 0-100% mapping" },
];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

const offenders = [];
const staleAllowlist = new Set(ALLOWLIST);

for (const file of walk(SRC)) {
  const rel = relative(ROOT, file);
  if (rel === OWNER) continue;

  const source = readFileSync(file, "utf8");
  if (!IMPORTS_SLIDER.test(source) || !MENTIONS_SPEED.test(source)) continue;

  if (ALLOWLIST.has(rel)) {
    staleAllowlist.delete(rel);
    continue;
  }
  const idioms = IDIOMS.filter((m) => m.re.test(source)).map((m) => m.what);
  offenders.push(`${rel}${idioms.length ? ` — ${idioms.join(", ")}` : ""}`);
}

let failed = false;

if (offenders.length) {
  failed = true;
  console.error(
    `\n${offenders.length} file(s) hand-rolling playback controls. Use VisualizerControls instead:\n`,
  );
  offenders.forEach((o) => console.error("  ", o));
  console.error(`\n(If a migration is genuinely blocked, say why in ${relative(ROOT, "scripts/controls-lint.mjs")} rather than widening this silently.)`);
}

// A file that no longer trips any marker has been migrated, so its allowlist
// entry is dead. Failing on that is what stops the list outliving the problem.
if (staleAllowlist.size) {
  failed = true;
  console.error(`\n${staleAllowlist.size} stale allowlist entr(y/ies) — these files no longer roll their own controls, so remove them from ALLOWLIST:\n`);
  [...staleAllowlist].forEach((f) => console.error("  ", f));
}

if (failed) process.exit(1);

console.log(`Controls: one implementation, ${ALLOWLIST.size} file(s) awaiting migration.`);
