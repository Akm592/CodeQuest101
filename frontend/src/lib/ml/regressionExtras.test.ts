import { describe, expect, it } from "vitest";

import { HAND_POINTS, leastSquares, mae, mse, r2, samplePoints } from "./linearRegression";
import { cosData, evalPoly, fitPoly, lstsq, trueCurve } from "./polyRegression";

describe("the maths section's 5-point example", () => {
  it("gives slope 0.6, intercept 2.2, MSE 0.48 and R² 0.6", () => {
    const line = leastSquares(HAND_POINTS)!;
    expect(line.slope).toBeCloseTo(0.6, 12);
    expect(line.intercept).toBeCloseTo(2.2, 12);
    expect(mse(HAND_POINTS, line)).toBeCloseTo(0.48, 12);
    expect(r2(HAND_POINTS, (x) => line.slope * x + line.intercept)).toBeCloseTo(0.6, 12);
  });
});

describe("R²", () => {
  const pts = samplePoints(1);
  const mean = pts.reduce((a, p) => a + p.y, 0) / pts.length;
  it("is 0 for always predicting the mean, 1 for a perfect fit, negative for a bad line", () => {
    expect(r2(pts, () => mean)).toBeCloseTo(0, 12);
    expect(r2(pts.map((p) => ({ x: p.x, y: 2 * p.x })), (x) => 2 * x)).toBe(1);
    expect(r2(pts, () => 0)).toBeLessThan(0);
  });

  it("the least-squares line has the best R² of any line (no small nudge improves it)", () => {
    const best = leastSquares(pts)!;
    const score = (s: number, b: number) => r2(pts, (x) => s * x + b);
    const top = score(best.slope, best.intercept);
    for (const [ds, db] of [[0.01, 0], [-0.01, 0], [0, 0.05], [0, -0.05]]) expect(score(best.slope + ds, best.intercept + db)).toBeLessThan(top);
  });

  it("MAE is never bigger than the square root of MSE", () => {
    const f = (x: number) => 0.5 * x + 1;
    expect(mae(pts, f)).toBeLessThanOrEqual(Math.sqrt(mse(pts, { slope: 0.5, intercept: 1 })) + 1e-12);
  });
});

describe("outliers", () => {
  it("one far-off point drags the least-squares line", () => {
    const pts = samplePoints(1);
    const before = leastSquares(pts)!;
    const after = leastSquares([...pts, { x: 9.5, y: 0.5 }])!;
    expect(Math.abs(after.slope - before.slope)).toBeGreaterThan(0.1);
  });
});

describe("polynomial regression", () => {
  it("QR least squares matches the normal equation on an easy problem", () => {
    const pts = cosData(1);
    const c = fitPoly(pts, 2).coef;
    // Normal equation by hand for degree 2 (3×3), solved by Cramer's rule.
    const S = (k: number) => pts.reduce((a, p) => a + p.x ** k, 0);
    const T = (k: number) => pts.reduce((a, p) => a + p.y * p.x ** k, 0);
    const M = [
      [S(0), S(1), S(2)],
      [S(1), S(2), S(3)],
      [S(2), S(3), S(4)],
    ];
    const det = (m: number[][]) =>
      m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    const rhs = [T(0), T(1), T(2)];
    const D = det(M);
    for (let j = 0; j < 3; j++) {
      const Mj = M.map((row, i) => row.map((v, k) => (k === j ? rhs[i] : v)));
      expect(c[j]).toBeCloseTo(det(Mj) / D, 8);
    }
  });

  it("lstsq solves an exactly solvable system exactly", () => {
    expect(lstsq([[1, 0], [0, 2], [1, 1]], [1, 4, 3]).map((v) => +v.toFixed(10))).toEqual([1, 2]);
  });

  it("training error only falls as the degree rises", () => {
    const pts = cosData(1);
    const err = (d: number) => {
      const f = fitPoly(pts, d);
      return pts.reduce((a, p) => a + (p.y - evalPoly(f, p.x)) ** 2, 0);
    };
    expect(err(4)).toBeLessThan(err(1));
    expect(err(15)).toBeLessThan(err(4));
  });

  it("reproduces scikit-learn's example: degree 1 underfits, 4 fits, 15 overfits (12 samples)", () => {
    let wild = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const train = cosData(seed);
      const fresh = cosData(1000 + seed, 1000);
      const err = (pts: typeof train, d: number) => {
        const f = fitPoly(train, d);
        return pts.reduce((a, p) => a + (p.y - evalPoly(f, p.x)) ** 2, 0) / pts.length;
      };
      expect(err(train, 15)).toBeLessThan(err(train, 4)); // degree 15 always fits the training points best...
      expect(err(fresh, 15)).toBeGreaterThan(err(fresh, 4)); // ...and always does worse on new points
      expect(err(fresh, 4)).toBeLessThan(err(fresh, 1));
      expect(err(fresh, 4)).toBeLessThan(0.03); // close to the noise level, 0.1² = 0.01
      if (err(fresh, 15) > 1) wild++;
    }
    // How badly it overfits swings a lot from sample to sample.
    expect(wild).toBeGreaterThanOrEqual(3);
    expect(trueCurve(0)).toBe(1);
  });
});

describe("the page's demos (exactly the data they use)", () => {
  const B = samplePoints(1);
  const at = (l: { slope: number; intercept: number }) => (x: number) => l.slope * x + l.intercept;

  it("R² demo: best line > 0, average = 0, the 'wrong way' line < 0", () => {
    const my = B.reduce((a, p) => a + p.y, 0) / B.length;
    const best = leastSquares(B)!;
    expect(r2(B, at(best))).toBeGreaterThan(0.5);
    expect(r2(B, at({ slope: 0, intercept: my }))).toBeCloseTo(0, 12);
    expect(r2(B, at({ slope: -best.slope, intercept: my + best.slope * 5 }))).toBeLessThan(0);
  });

  it("outlier demo: one point at (9.5, 0.5) more than halves the slope", () => {
    const before = leastSquares(B)!.slope;
    const after = leastSquares([...B, { x: 9.5, y: 0.5 }])!.slope;
    expect(after).toBeLessThan(before / 2);
  });

  it("polynomial demo, every 'New sample' from 1 to 300: degree 15 always lowest on training, always worse than degree 4 on new points", () => {
    for (let seed = 1; seed <= 300; seed++) {
      const data = cosData(seed);
      const fresh = cosData(1000 + seed, 1000);
      const err = (d: number, pts: typeof data) => {
        const f = fitPoly(data, d);
        return pts.reduce((a, p) => a + (evalPoly(f, p.x) - p.y) ** 2, 0) / pts.length;
      };
      expect(err(15, data)).toBeLessThan(err(4, data));
      expect(err(4, data)).toBeLessThan(err(1, data));
      expect(err(15, fresh)).toBeGreaterThan(err(4, fresh));
      expect(err(4, fresh)).toBeLessThan(err(1, fresh));
    }
  });
});
