import { describe, expect, it } from "vitest";

import { assertStepInvariants } from "../algorithms/testHelpers";
import {
  aucByPairs,
  buildMetricSteps,
  confusion,
  DEFAULT_THRESHOLD,
  EMAILS,
  emailsFor,
  metricsOf,
  MODELS,
  outcomeOf,
  RARE,
  rocCurve,
  sweep,
  trapezoidArea,
  type ModelKey,
} from "./metrics";

describe("the page's emails", () => {
  it("give the round counts the page and its maths section describe at 0.5", () => {
    expect(confusion(EMAILS, DEFAULT_THRESHOLD)).toEqual({ tp: 6, fp: 3, fn: 2, tn: 9 });
  });

  it("have no tied scores, so each threshold between them is a clean cut", () => {
    for (const k of Object.keys(MODELS) as ModelKey[]) {
      const scores = emailsFor(k).map((e) => e.score);
      expect(new Set(scores).size, k).toBe(scores.length);
      for (const s of scores) expect(s > 0 && s < 1, `${k} ${s}`).toBe(true);
    }
  });

  it("keep 8 spam and 12 normal emails in every model", () => {
    for (const k of Object.keys(MODELS) as ModelKey[]) {
      expect(emailsFor(k).filter((e) => e.spam)).toHaveLength(8);
      expect(emailsFor(k)).toHaveLength(20);
    }
  });
});

describe("metrics", () => {
  it("match the definitions worked by hand", () => {
    const m = metricsOf({ tp: 6, fp: 3, fn: 2, tn: 9 });
    expect(m.precision).toBeCloseTo(6 / 9, 12);
    expect(m.recall).toBeCloseTo(6 / 8, 12);
    expect(m.specificity).toBeCloseTo(9 / 12, 12);
    expect(m.fpr).toBeCloseTo(3 / 12, 12);
    expect(m.accuracy).toBeCloseTo(15 / 20, 12);
    expect(m.f1).toBeCloseTo((2 * (6 / 9) * (6 / 8)) / (6 / 9 + 6 / 8), 12);
  });

  it("F1 equals 2TP / (2TP + FP + FN) at every threshold", () => {
    for (let t = 0; t <= 1.0001; t += 0.01) {
      const c = confusion(EMAILS, t);
      const m = metricsOf(c);
      if (m.f1 === null) continue;
      expect(m.f1).toBeCloseTo((2 * c.tp) / (2 * c.tp + c.fp + c.fn), 12);
    }
  });

  it("returns null, not 0, when a ratio's bottom is 0", () => {
    const none = metricsOf(confusion(EMAILS, 1.01)); // flag nothing
    expect(none.precision).toBeNull();
    expect(none.recall).toBe(0);
    expect(none.f1).toBeNull();
    const lazy = metricsOf(RARE[0].confusion);
    expect(lazy.precision).toBeNull();
    expect(lazy.accuracy).toBeCloseTo(0.99, 12);
  });

  it("flags at score ≥ threshold, as scikit-learn does", () => {
    expect(outcomeOf({ spam: true, score: 0.5 }, 0.5)).toBe("tp");
    expect(outcomeOf({ spam: false, score: 0.5 }, 0.5)).toBe("fp");
    expect(outcomeOf({ spam: true, score: 0.49 }, 0.5)).toBe("fn");
  });

  it("lowering the threshold never lowers recall", () => {
    const s = sweep(EMAILS);
    for (let i = 1; i < s.length; i++) expect(s[i].recall!).toBeLessThanOrEqual(s[i - 1].recall! + 1e-12);
  });
});

describe("ROC and AUC", () => {
  it("runs from (0, 0) to (1, 1) without stepping backwards", () => {
    for (const k of Object.keys(MODELS) as ModelKey[]) {
      const r = rocCurve(emailsFor(k));
      expect(r[0]).toMatchObject({ fpr: 0, tpr: 0 });
      expect(r.at(-1)).toMatchObject({ fpr: 1, tpr: 1 });
      for (let i = 1; i < r.length; i++) {
        expect(r[i].fpr).toBeGreaterThanOrEqual(r[i - 1].fpr);
        expect(r[i].tpr).toBeGreaterThanOrEqual(r[i - 1].tpr);
      }
    }
  });

  it("area under the curve equals the chance a random spam outscores a random normal email", () => {
    for (const k of Object.keys(MODELS) as ModelKey[]) {
      const items = emailsFor(k);
      expect(trapezoidArea(rocCurve(items)), k).toBeCloseTo(aucByPairs(items), 12);
    }
    // Ties count half on both sides.
    const tied = [
      { spam: true, score: 0.5 },
      { spam: false, score: 0.5 },
      { spam: true, score: 0.9 },
      { spam: false, score: 0.1 },
    ];
    expect(trapezoidArea(rocCurve(tied))).toBeCloseTo(aucByPairs(tied), 12);
    expect(aucByPairs(tied)).toBeCloseTo((1 + 1 + 0.5 + 1) / 4, 12);
  });

  it("ranks the filters the way the page describes them", () => {
    const auc = (k: ModelKey) => aucByPairs(emailsFor(k));
    expect(auc("sharp")).toBeGreaterThan(auc("page"));
    expect(auc("page")).toBeGreaterThan(0.8);
    expect(auc("sharp")).toBeCloseTo(95 / 96, 12); // one normal email outscores one spam email
    expect(Math.abs(auc("coin") - 0.5)).toBeLessThan(0.05);
  });

  it("refuses a curve with only one kind of email", () => {
    expect(() => rocCurve(EMAILS.filter((e) => e.spam))).toThrow(RangeError);
  });
});

describe("the accuracy trap", () => {
  it("covers 1,000 people, 10 of them sick, in both scenarios", () => {
    for (const s of RARE) {
      const c = s.confusion;
      expect(c.tp + c.fp + c.fn + c.tn).toBe(1000);
      expect(c.tp + c.fn).toBe(10);
    }
    const test = metricsOf(RARE[1].confusion);
    expect(test.recall).toBeCloseTo(0.9, 12);
    expect(test.precision).toBeCloseTo(9 / 59, 12);
    expect(test.accuracy!).toBeLessThan(metricsOf(RARE[0].confusion).accuracy!);
  });
});

describe("the stepper", () => {
  it("judges every email once, ending on the full confusion matrix, at many thresholds", () => {
    for (const t of [0, 0.3, 0.5, 0.7, 1.01]) {
      const steps = buildMetricSteps(EMAILS, t);
      assertStepInvariants(steps);
      expect(steps.filter((s) => s.phase === "judge")).toHaveLength(EMAILS.length);
      expect(steps.at(-1)!.counts).toEqual(confusion(EMAILS, t));
      const judged = steps.filter((s) => s.phase === "judge");
      judged.forEach((s, i) => {
        const total = s.counts.tp + s.counts.fp + s.counts.fn + s.counts.tn;
        expect(total).toBe(i + 1);
      });
    }
  });

  it("explains a missing precision when nothing is flagged", () => {
    const steps = buildMetricSteps(EMAILS, 1.01);
    expect(steps.find((s) => s.phase === "precision")!.explanation).toContain("no value");
  });
});
