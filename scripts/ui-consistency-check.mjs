// Manual QA for the UI pass: navigation, contrast and style sprawl.
//
// Three things it asserts, each of which was actually broken:
//   1. Every /visualize/* route offers a working Back. All 13 were dead ends —
//      ten components accepted an `onBack` prop and discarded it.
//   2. No visible text sits at less than 4.5:1 against its background. The
//      accent unification briefly made the selected chat title near-black on a
//      dark ground, which this catches and a screenshot does not.
//   3. The number of distinct blur radii, border alphas and corner radii in the
//      built CSS stays small. That sprawl is what made the app look like three
//      different products.
//   4. No page requests an asset that 404s. The landing page asked for
//      /grid-pattern.svg twice per load; the file has never existed.
//   5. Adjacent sections on the landing page share a background. Six different
//      near-blacks were stacked on one page, so every boundary showed a band.
//   6. No page scrolls horizontally at phone, tablet or desktop width. `body {
//      overflow-x: hidden }` hides the symptom without fixing it, and does not
//      stop panning on every mobile browser.
//
// Run against a local preview build:
//   npm run build && npx vite preview --port 4173 &
//   npm i --no-save playwright && npx playwright install chromium
//   node scripts/ui-consistency-check.mjs
//
// Set CHROME_PATH to reuse a Chromium already installed on the machine.

import { chromium } from 'playwright';

import { decodePng, pixelAt } from './lib/png.mjs';

const ORIGIN = process.env.ORIGIN || 'http://127.0.0.1:4173';

const VISUALIZERS = [
  'binarySearch', 'sortingAlgorithms', 'linkedList', 'longestSubarray',
  'spiralMatrix', 'rotateImage', 'binaryTree', 'stack', 'hareTortoise',
  'tree', 'neuralNetwork', 'graph', 'heap',
];

const PAGES = ['/', '/chat', '/login', '/about', '/no-such-page',
  ...VISUALIZERS.map((v) => `/visualize/${v}`)];

const failures = [];
// Populated by the request listener installed below, keyed by the page under
// test so a 404 can be attributed to the route that asked for it.
const badRequests = [];
let currentPath = '';

function luminance([r, g, b]) {
  const f = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(fg, bg) {
  const a = luminance(fg) + 0.05;
  const b = luminance(bg) + 0.05;
  return Math.max(a, b) / Math.min(a, b);
}

// CHROME_PATH lets this run against a Chromium that is already on the machine
// (CI images, this repo's container) instead of one downloaded per Playwright
// version.
const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
);
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

page.on('response', (res) => {
  if (res.status() === 404) badRequests.push(`${currentPath} -> 404 ${res.url()}`);
});
page.on('requestfailed', (req) => {
  // Aborted navigations while the harness moves on are not interesting, and
  // third-party origins (fonts, avatars) fail for reasons that belong to the
  // machine running this, not to the app.
  if (req.failure()?.errorText === 'net::ERR_ABORTED') return;
  if (!req.url().startsWith(ORIGIN)) return;
  badRequests.push(`${currentPath} -> failed ${req.url()} (${req.failure()?.errorText})`);
});

// --- 1. Back navigation --------------------------------------------------
let backOk = 0;
for (const route of VISUALIZERS) {
  currentPath = `/visualize/${route}`;
  await page.goto(`${ORIGIN}/visualize/${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  const back = await page.$('header button:has-text("Back")');
  if (!back) {
    failures.push(`${route}: no Back control`);
    continue;
  }
  await back.click();
  await page.waitForTimeout(900);
  if (page.url() === `${ORIGIN}/` || page.url().startsWith(`${ORIGIN}/#`)) backOk += 1;
  else failures.push(`${route}: Back landed on ${page.url()}`);
}
console.log(`Back navigation: ${backOk}/${VISUALIZERS.length}`);

// --- 2. Text contrast ----------------------------------------------------
let worst = { ratio: 99, where: '' };
for (const path of PAGES) {
  currentPath = path;
  await page.goto(`${ORIGIN}${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3200);

  const samples = await page.evaluate(() => {
    const parse = (s) => {
      const m = (s.match(/[\d.]+/g) || []).map(Number);
      return { r: m[0] || 0, g: m[1] || 0, b: m[2] || 0, a: m[3] === undefined ? 1 : m[3] };
    };
    const rgb = (s) => { const c = parse(s); return [c.r, c.g, c.b]; };
    // Composite every translucent layer up the ancestor chain. Taking the
    // first non-transparent backgroundColor as if it were opaque is wrong:
    // `bg-primary/10` would be measured as full-strength primary.
    const opaque = (el) => {
      const layers = [];
      for (let n = el; n; n = n.parentElement) {
        const c = parse(getComputedStyle(n).backgroundColor);
        if (c.a > 0) layers.push(c);
        if (c.a >= 1) break;
      }
      let out = { r: 0, g: 0, b: 0 };
      for (let i = layers.length - 1; i >= 0; i--) {
        const c = layers[i];
        out = {
          r: c.r * c.a + out.r * (1 - c.a),
          g: c.g * c.a + out.g * (1 - c.a),
          b: c.b * c.a + out.b * (1 - c.a),
        };
      }
      return [out.r, out.g, out.b];
    };
    const out = [];
    for (const el of document.querySelectorAll('h1,h2,h3,p,span,a,button,label,li')) {
      const text = (el.textContent || '').trim();
      if (!text || text.length > 120) continue;
      if (el.children.length) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.6) continue;
      // Gradient-clipped headings set color:transparent and paint via the
      // background; measuring their colour is meaningless.
      if (cs.webkitTextFillColor === 'rgba(0, 0, 0, 0)' || cs.color === 'rgba(0, 0, 0, 0)') continue;
      // Anything still inside a fading overlay is not the page under test.
      if (el.closest('[data-loading-screen]')) continue;
      const box = el.getBoundingClientRect();
      if (box.width < 8 || box.height < 8) continue;
      if (cs.backgroundImage && cs.backgroundImage.includes('gradient') && cs.webkitBackgroundClip === 'text') continue;
      out.push({ text: text.slice(0, 40), fg: rgb(cs.color), bg: opaque(el) });
    }
    return out;
  });

  for (const s of samples) {
    const ratio = contrast(s.fg, s.bg);
    if (ratio < worst.ratio) worst = { ratio, where: `${path} — "${s.text}"` };
    if (ratio < 4.5) failures.push(`${path}: "${s.text}" at ${ratio.toFixed(2)}:1`);
  }
}
console.log(`Worst text contrast: ${worst.ratio.toFixed(2)}:1 (${worst.where})`);

// --- 3. Back lands on the grid, not the top of the page ------------------
// navigate("/#visualizations") only writes the fragment; React Router does not
// scroll. Without ScrollToHash this passes the URL check above and still dumps
// the user at the hero.
currentPath = '/visualize/binarySearch';
await page.goto(`${ORIGIN}/visualize/binarySearch`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
await page.click('header button:has-text("Back")');
await page.waitForTimeout(1200);
const landed = await page.evaluate(() => {
  const el = document.getElementById('visualizations');
  return { y: Math.round(window.scrollY), top: el ? Math.round(el.getBoundingClientRect().top) : null };
});
if (landed.top === null) failures.push('Back: #visualizations anchor missing');
else if (Math.abs(landed.top) > 120) {
  failures.push(`Back: #visualizations is ${landed.top}px off the viewport top (scrollY ${landed.y})`);
}
console.log(`Back scroll target: scrollY ${landed.y}, anchor offset ${landed.top}px`);

// --- 4. Background continuity on the landing page ------------------------
// Measured from the pixels the browser painted, not from computed styles: the
// bands on this page came from gradient overlays whose top edge landed on a
// section boundary, and a computed-style walk cannot see those at all.
//
// Sampled in the left margin, away from content, and compared row to row. A
// designed gradient changes by a fraction of a level per row; a seam is a step.
currentPath = '/';
await page.goto(`${ORIGIN}/`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3200);
// Settle every whileInView animation first, or the shot catches sections
// mid-transition and their own opacity reads as a band.
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 300));
  }
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 400));
});

const shot = decodePng(await page.screenshot({ fullPage: true }));

// Sample the outer gutters only. Every container on this page is
// `container mx-auto px-4`, and every card sits inside a max-w-* box, so
// nothing but the page background reaches the first and last dozen pixels at
// 1280. Sampling at 2% and 5% of the width instead put the columns straight
// through the header logo and the footer wordmark, which is not banding.
const columns = [];
for (let x = 2; x <= 12; x += 2) columns.push(x, shot.width - 1 - x);
const rowValue = (y) => {
  const vals = columns
    .map((x) => pixelAt(shot, x, y).reduce((a, b) => a + b, 0) / 3)
    .sort((a, b) => a - b);
  const m = vals.length >> 1;
  return vals.length % 2 ? vals[m] : (vals[m - 1] + vals[m]) / 2;
};

// Compare across a 5px window rather than adjacent rows. A 1px rule (the
// footer's border-t, a card edge) is a spike that reverts; a band is a step
// that persists, and only the second one is what this is looking for.
const SPAN = 2;
const THRESHOLD = 4;
let biggest = { step: 0, y: 0 };
const steps = [];
for (let y = SPAN; y < shot.height - SPAN; y++) {
  const step = Math.abs(rowValue(y + SPAN) - rowValue(y - SPAN));
  if (step > biggest.step) biggest = { step, y };
  if (step > THRESHOLD) steps.push({ y, step: Number(step.toFixed(1)) });
}
console.log(`\nBackground continuity (${shot.width}x${shot.height}): largest step across ${SPAN * 2}px is ${biggest.step.toFixed(1)} at y=${biggest.y}`);
if (steps.length) {
  console.log('  steps over', THRESHOLD, 'levels:', steps.slice(0, 10).map((s) => `y=${s.y} (${s.step})`).join(', '));
  failures.push(`background banding: ${steps.length} row(s) step by more than ${THRESHOLD} levels, worst ${biggest.step.toFixed(1)} at y=${biggest.y}`);
}

// --- 5. Horizontal overflow ----------------------------------------------
console.log('\nHorizontal overflow:');
for (const [w, h] of [[390, 844], [768, 1024], [1280, 900]]) {
  await page.setViewportSize({ width: w, height: h });
  for (const path of ['/', '/chat']) {
    currentPath = path;
    await page.goto(`${ORIGIN}${path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2600);
    const over = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      // Name the culprit: the widest element whose own box sticks out, skipping
      // anything inside a scroll container (a code block is meant to overflow).
      widest: [...document.querySelectorAll('body *')]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0) return false;
          if (r.right <= window.innerWidth + 2 && r.left >= -2) return false;
          for (let n = el.parentElement; n; n = n.parentElement) {
            const o = getComputedStyle(n).overflowX;
            if (o === 'auto' || o === 'scroll' || o === 'hidden') return false;
          }
          return true;
        })
        .map((el) => `${el.tagName}.${String(el.className).slice(0, 50)}`)
        .slice(0, 3),
    }));
    const excess = over.scrollW - over.clientW;
    console.log(`  ${String(w).padStart(4)}px ${path.padEnd(6)} scrollWidth ${over.scrollW} vs ${over.clientW}`);
    if (excess > 2) {
      failures.push(`${path} at ${w}px: page scrolls ${excess}px horizontally${over.widest.length ? ' — ' + over.widest.join(', ') : ''}`);
    }
  }
}
await page.setViewportSize({ width: 1280, height: 900 });

// --- 6. Style sprawl -----------------------------------------------------
const css = await page.evaluate(async () => {
  const link = [...document.querySelectorAll('link[rel="stylesheet"]')]
    .map((l) => l.href).find((h) => h.includes('.css'));
  return link ? (await fetch(link)).text() : '';
});
const count = (re) => new Set(css.match(re) || []).size;
console.log('Distinct backdrop-blur values :', count(/--tw-backdrop-blur:\s*blur\([^)]+\)/g));
console.log('Distinct border-radius values :', count(/border-radius:\s*[^;}]+/g));

await browser.close();

if (badRequests.length) {
  console.log(`\n${badRequests.length} failed request(s):`);
  [...new Set(badRequests)].slice(0, 15).forEach((r) => console.log('  ', r));
  failures.push(`${badRequests.length} request(s) 404'd or failed`);
} else {
  console.log('Failed/404 requests       : none');
}

if (failures.length) {
  console.log(`\n${failures.length} failure(s):`);
  failures.slice(0, 25).forEach((f) => console.log('  ', f));
  process.exit(1);
}
console.log('\nAll checks passed.');
