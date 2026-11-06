// Seeded randomness for the ML pages.
//
// Every dataset and initial weight on these pages comes from a seed, so a run
// is repeatable: the tests check the exact runs the pages show, and "New data"
// is just a new seed.

export type Rng = () => number;

/** mulberry32: small, fast, and good enough for picture-sized datasets. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal sample (Box-Muller). */
export function gaussian(rng: Rng): number {
  const u = 1 - rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export interface Point {
  x: number;
  y: number;
}

/** Points scattered around a few centres, `perBlob` each. */
export function blobs(seed: number, centres: Point[], perBlob: number, spread: number): Point[] {
  const rng = seededRng(seed);
  const out: Point[] = [];
  for (const c of centres) {
    for (let i = 0; i < perBlob; i++) {
      out.push({ x: c.x + gaussian(rng) * spread, y: c.y + gaussian(rng) * spread });
    }
  }
  return out;
}
