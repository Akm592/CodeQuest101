// Manual QA: does the app survive the Supabase auth service being unreachable?
//
// Reproduces a real incident. A paused Supabase project returns 502 from its
// gateway; because gateway errors carry no Access-Control-Allow-Origin header,
// the browser reports it as a CORS failure, which sends you looking in the
// wrong place entirely. supabase-js then retries the refresh indefinitely.
//
// Run against a local preview build:
//   npm run build && npx vite preview --port 4173 &
//   npm i --no-save playwright && npx playwright install chromium
//   SUPABASE_REF=<your-project-ref> node scripts/auth-outage-check.mjs
//
// Expected: app mounts, the degraded banner appears, guest chat still works,
// POST /chat is issued in tens of milliseconds rather than blocking on a token
// lookup, and auth attempts settle instead of growing without bound.

import { chromium } from 'playwright';

// Project ref from VITE_SUPABASE_URL; this is the localStorage key prefix
// supabase-js uses for the stored session.
const SUPABASE_REF = process.env.SUPABASE_REF || 'your-project-ref';
const ORIGIN = 'http://127.0.0.1:4173';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

let authAttempts = 0;
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));

// Every call to the auth service fails, like a 502 from a paused project.
await page.route('**/auth/v1/**', (route) => {
  authAttempts += 1;
  return route.abort('failed');
});

// Seed an expired session so supabase-js tries to refresh on boot — the exact
// path in the reported stack (_recoverAndRefresh -> _callRefreshToken).
await page.addInitScript(([ref]) => {
  const expired = Math.floor(Date.now() / 1000) - 3600;
  localStorage.setItem(
    `sb-${ref}-auth-token`,
    JSON.stringify({
      access_token: 'stale.access.token',
      refresh_token: 'stale-refresh-token',
      expires_at: expired,
      expires_in: 3600,
      token_type: 'bearer',
      user: { id: '11111111-1111-1111-1111-111111111111', email: 'alice@example.com' },
    }),
  );
}, [SUPABASE_REF]);

const t0 = Date.now();
await page.goto(`${ORIGIN}/chat`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(6000);
const loadMs = Date.now() - t0;

const bodyText = await page.evaluate(() => document.body.innerText);
const attemptsAfterLoad = authAttempts;

console.log('--- page state under a dead auth service ---');
console.log('app mounted           :', (await page.$eval('#root', (el) => el.children.length)) > 0);
console.log('load + settle (ms)    :', loadMs);
console.log('degraded banner shown :', /can't reach the sign-in service/i.test(bodyText));
console.log('chat UI present       :', /new chat/i.test(bodyText));
console.log('auth attempts so far  :', attemptsAfterLoad);
console.log('uncaught page errors  :', pageErrors.length);

// The defect being fixed: a chat request must not stall behind dead auth.
const typed = await page.$('textarea');
let sendMs = null;
if (typed) {
  await typed.fill('two sum');
  const t1 = Date.now();
  // The backend is not running; we only care that the request is *issued*
  // promptly rather than blocked on a token lookup.
  const req = page
    .waitForRequest((r) => r.url().includes('/chat') && r.method() === 'POST', { timeout: 15000 })
    .catch(() => null);
  await page.keyboard.press('Enter');
  const seen = await req;
  sendMs = seen ? Date.now() - t1 : null;
}
console.log('time to issue /chat   :', sendMs === null ? 'not issued' : `${sendMs}ms`);

// Breaker: further waiting must not produce a growing pile of auth calls.
const before = authAttempts;
await page.waitForTimeout(6000);
console.log('auth attempts added in a further 6s :', authAttempts - before);

await page.screenshot({ path: 'auth-outage.png' });
await browser.close();
