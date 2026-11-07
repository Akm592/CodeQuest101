// Polynomial regression: still linear regression, just with x, x², x³, … as
// the features. It mirrors scikit-learn's "Underfitting vs. Overfitting"
// example: 30 points from cos(1.5πx) plus noise (scale 0.1), fitted with
// degrees 1, 4 and 15.
//
// High degrees make the normal equation (XᵀX)⁻¹Xᵀy numerically unreliable, so
// the fit uses a Householder QR least-squares solve instead.

import { gaussian, seededRng, type Point } from "./random";

export const trueCurve = (x: number) => Math.cos(1.5 * Math.PI * x);

/** n points with x uniform on [0, 1] (sorted) and y = cos(1.5πx) + noise. */
export function cosData(seed: number, n = 30, noise = 0.1): Point[] {
  const rng = seededRng(seed);
  return Array.from({ length: n }, () => rng())
    .sort((a, b) => a - b)
    .map((x) => ({ x, y: trueCurve(x) + gaussian(rng) * noise }));
}

/** Least-squares solution of A·c ≈ b by Householder QR. A is m×n with m ≥ n. */
export function lstsq(A: number[][], b: number[]): number[] {
  const m = A.length;
  const n = A[0].length;
  const R = A.map((r) => [...r]);
  const y = [...b];
  for (let k = 0; k < n; k++) {
    let norm = 0;
    for (let i = k; i < m; i++) norm += R[i][k] ** 2;
    norm = Math.sqrt(norm);
    if (norm === 0) continue;
    const alpha = R[k][k] > 0 ? -norm : norm;
    const v = new Array(m).fill(0);
    for (let i = k; i < m; i++) v[i] = R[i][k];
    v[k] -= alpha;
    const vv = v.reduce((s, x) => s + x * x, 0);
    if (vv === 0) continue;
    for (let j = k; j < n; j++) {
      let d = 0;
      for (let i = k; i < m; i++) d += v[i] * R[i][j];
      const f = (2 * d) / vv;
      for (let i = k; i < m; i++) R[i][j] -= f * v[i];
    }
    let d = 0;
    for (let i = k; i < m; i++) d += v[i] * y[i];
    const f = (2 * d) / vv;
    for (let i = k; i < m; i++) y[i] -= f * v[i];
  }
  const c = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = y[i];
    for (let j = i + 1; j < n; j++) s -= R[i][j] * c[j];
    c[i] = s / R[i][i];
  }
  return c;
}

export interface PolyFit {
  degree: number;
  /** Coefficients for 1, x, x², … */
  coef: number[];
}

export function fitPoly(points: Point[], degree: number): PolyFit {
  const A = points.map((p) => Array.from({ length: degree + 1 }, (_, k) => p.x ** k));
  return { degree, coef: lstsq(A, points.map((p) => p.y)) };
}

export const evalPoly = (f: PolyFit, x: number) => f.coef.reduce((s, c, k) => s + c * x ** k, 0);
