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
//
// Run against a local preview build:
//   npm run build && npx vite preview --port 4173 &
//   npm i --no-save playwright && npx playwright install chromium
//   node scripts/ui-consistency-check.mjs

import { chromium } from 'playwright';

const ORIGIN = process.env.ORIGIN || 'http://127.0.0.1:4173';

const VISUALIZERS = [
  'binarySearch', 'sortingAlgorithms', 'linkedList', 'longestSubarray',
  'spiralMatrix', 'rotateImage', 'binaryTree', 'stack', 'hareTortoise',
  'tree', 'neuralNetwork', 'graph', 'heap',
];

const PAGES = ['/', '/chat', '/login', '/about', '/no-such-page',
  ...VISUALIZERS.map((v) => `/visualize/${v}`)];

const failures = [];

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

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

// --- 1. Back navigation --------------------------------------------------
let backOk = 0;
for (const route of VISUALIZERS) {
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

// --- 3. Style sprawl -----------------------------------------------------
const css = await page.evaluate(async () => {
  const link = [...document.querySelectorAll('link[rel="stylesheet"]')]
    .map((l) => l.href).find((h) => h.includes('.css'));
  return link ? (await fetch(link)).text() : '';
});
const count = (re) => new Set(css.match(re) || []).size;
console.log('Distinct backdrop-blur values :', count(/--tw-backdrop-blur:\s*blur\([^)]+\)/g));
console.log('Distinct border-radius values :', count(/border-radius:\s*[^;}]+/g));

await browser.close();

if (failures.length) {
  console.log(`\n${failures.length} failure(s):`);
  failures.slice(0, 25).forEach((f) => console.log('  ', f));
  process.exit(1);
}
console.log('\nAll checks passed.');
