// Shared vector arithmetic; importing it does not load lesson fixtures.
export function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  if (!a.length || a.length !== b.length || !a.every(Number.isFinite) || !b.every(Number.isFinite)) {
    throw new RangeError("Cosine requires finite, nonempty vectors of equal length.");
  }
  const aNorm = Math.hypot(...a);
  const bNorm = Math.hypot(...b);
  if (!Number.isFinite(aNorm) || !Number.isFinite(bNorm) || aNorm === 0 || bNorm === 0) throw new RangeError("Cosine requires finite, nonzero vector lengths.");
  const similarity = a.reduce((sum, value, i) => sum + (value / aNorm) * (b[i] / bNorm), 0);
  return Math.max(-1, Math.min(1, similarity));
}
