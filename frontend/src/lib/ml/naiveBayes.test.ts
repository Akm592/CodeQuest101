import { describe, expect, it } from "vitest";

import { assertStepInvariants } from "../algorithms/testHelpers";
import {
  appleChance,
  buildNbSteps,
  classifyNb,
  FRUIT_WEIGHTS,
  fitGaussian,
  gaussianBoundary,
  gaussianPdf,
  prior,
  TEST_EMAILS,
  tokenize,
  trainNb,
  TRAINING_EMAILS,
  wordProb,
} from "./naiveBayes";

const m1 = trainNb(TRAINING_EMAILS, 1);
const m0 = trainNb(TRAINING_EMAILS, 0);

describe("counting", () => {
  it("matches a hand count of the training emails", () => {
    // Counted independently of trainNb.
    const spamWords = TRAINING_EMAILS.filter((e) => e.label === "spam").flatMap((e) => tokenize(e.text));
    const vocab = new Set(TRAINING_EMAILS.flatMap((e) => tokenize(e.text)));
    const free = spamWords.filter((w) => w === "free").length;
    expect(free).toBe(4);
    expect(wordProb(m1, "spam", "free")).toBeCloseTo((free + 1) / (spamWords.length + vocab.size), 12);
    expect(prior(m1, "spam")).toBe(0.5);
    // The guide quotes these numbers.
    expect(spamWords.length).toBe(26);
    expect(m1.totals.spam).toBe(26);
  });

  it.each([0, 0.5, 1])("word chances add up to 1 over the vocabulary (α = %f)", (alpha) => {
    const m = trainNb(TRAINING_EMAILS, alpha);
    for (const c of ["spam", "ham"] as const) expect(m.vocab.reduce((s, w) => s + wordProb(m, c, w), 0)).toBeCloseTo(1, 12);
  });
});

describe("classifying", () => {
  // Brute force: multiply everything out, then divide by the total.
  const brute = (m: ReturnType<typeof trainNb>, text: string) => {
    const words = tokenize(text).filter((w) => m.vocab.includes(w));
    const score = (c: "spam" | "ham") => words.reduce((p, w) => p * wordProb(m, c, w), prior(m, c));
    const s = score("spam");
    const h = score("ham");
    return s / (s + h);
  };

  it.each(TEST_EMAILS.slice(0, 3).map((t) => t.text))("“%s”: adding logs gives the same answer as multiplying", (text) => {
    expect(classifyNb(m1, text)!.spam).toBeCloseTo(brute(m1, text), 12);
    const last = buildNbSteps(m1, text).at(-1)!;
    expect(Math.exp(last.logs.spam)).toBeCloseTo(last.products.spam, 15);
  });

  it("classifies the page's test emails the way their notes say", () => {
    expect(classifyNb(m1, "free cash today")!.spam).toBeGreaterThan(0.5);
    expect(classifyNb(m1, "project meeting today")!.spam).toBeLessThan(0.5);
  });

  it("the smoothing trap: with α = 0, one unseen word makes spam impossible", () => {
    const p = classifyNb(m0, "free offer today meeting")!;
    expect(p.spam).toBe(0);
    expect(classifyNb(m1, "free offer today meeting")!.spam).toBeGreaterThan(0.5); // with smoothing the spammy words win
    // and with a zero on both sides there's no answer at all
    expect(classifyNb(m0, "cash monday")).toBeNull();
  });

  it("skips words it never saw", () => {
    const steps = buildNbSteps(m1, "free zebra");
    expect(steps.some((s) => s.phase === "skip" && s.word === "zebra")).toBe(true);
    expect(classifyNb(m1, "free zebra")!.spam).toBeCloseTo(classifyNb(m1, "free")!.spam, 12);
  });

  it("is overconfident: repeating one word keeps pushing the probability towards 100%", () => {
    const ps = [1, 2, 4, 8].map((n) => classifyNb(m1, Array(n).fill("free").join(" "))!.spam);
    for (let i = 1; i < ps.length; i++) expect(ps[i]).toBeGreaterThan(ps[i - 1]);
    expect(ps[3]).toBeGreaterThan(0.999);
  });

  it("matches the numbers drawn in the illustrations", () => {
    expect(classifyNb(m1, "free")!.spam).toBeCloseTo(0.74, 2);
    expect(classifyNb(m1, "free cash")!.spam).toBeCloseTo(0.91, 2);
    expect(wordProb(m1, "spam", "free")).toBeCloseTo(0.082, 3);
    expect(wordProb(m1, "spam", "cash")).toBeCloseTo(0.049, 3);
    expect(wordProb(m1, "ham", "free")).toBeCloseTo(0.029, 3);
    expect(wordProb(m1, "ham", "cash")).toBeCloseTo(0.014, 3);
  });

  it("records a clean run of steps", () => {
    const steps = buildNbSteps(m1, TEST_EMAILS[2].text);
    expect(steps[0].phase).toBe("prior");
    expect(steps.at(-1)!.phase).toBe("decide");
    assertStepInvariants(steps);
  });
});

describe("Gaussian naive Bayes", () => {
  it("uses the maximum-likelihood variance (divide by n)", () => {
    const g = fitGaussian([2, 4, 6]);
    expect(g.mean).toBe(4);
    expect(g.variance).toBeCloseTo(8 / 3, 12);
  });

  it("has a bell curve that integrates to 1", () => {
    const g = fitGaussian(FRUIT_WEIGHTS.apple);
    let area = 0;
    for (let x = 0; x < 400; x += 0.05) area += gaussianPdf(g, x) * 0.05;
    expect(area).toBeCloseTo(1, 4);
  });

  it("puts the boundary between the two means, where the chance is 50%", () => {
    const a = fitGaussian(FRUIT_WEIGHTS.apple).mean;
    const o = fitGaussian(FRUIT_WEIGHTS.orange).mean;
    const b = gaussianBoundary();
    expect(b).toBeGreaterThan(a);
    expect(b).toBeLessThan(o);
    expect(appleChance(b)).toBeCloseTo(0.5, 2);
    expect(appleChance(150)).toBeGreaterThan(0.9);
    expect(appleChance(215)).toBeLessThan(0.1);
  });
});
