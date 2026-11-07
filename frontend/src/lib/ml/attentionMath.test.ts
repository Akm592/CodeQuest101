import { describe, expect, it } from "vitest";

import { attentionMatrix, D, SENTENCES, tokenize, WQ } from "./attention";
import { HAND_WK, HAND_WQ, HAND_WV, HAND_X, matMul, oneDraw, positionalEncoding, scaleStats, selfAttention, transpose } from "./attentionMath";

const I = Array.from({ length: D }, (_, i) => Array.from({ length: D }, (_, j) => (i === j ? 1 : 0)));
const toy = (s: string, causal = false) => {
  const t = tokenize(s);
  return { words: t.map((x) => x.word), ...selfAttention(t.map((x) => x.embedding), WQ, I, I, causal) };
};

describe("matrix helpers", () => {
  it("multiply and transpose", () => {
    expect(matMul([[1, 2], [3, 4]], [[5], [6]])).toEqual([[17], [39]]);
    expect(transpose([[1, 2, 3]])).toEqual([[1], [2], [3]]);
  });
});

describe("the maths section's worked example (cats chase mice)", () => {
  const a = selfAttention(HAND_X, HAND_WQ, HAND_WK, HAND_WV);
  it("Q, K, V and QKᵀ are the small integers shown", () => {
    expect(a.Q).toEqual([[0, 2], [2, 0], [0, 2]]);
    expect(a.K).toEqual([[1, 0], [0, 1], [1, 0]]);
    expect(a.V).toEqual([[1, 0], [0, 1], [1, 1]]);
    expect(a.scores).toEqual([[0, 2, 0], [2, 0, 2], [0, 2, 0]]);
  });
  it("softmax rows add to 1 and match the hand calculation", () => {
    for (const row of a.weights) expect(row.reduce((x, y) => x + y, 0)).toBeCloseTo(1, 12);
    const e = Math.exp(2 / Math.sqrt(2));
    expect(a.weights[0][1]).toBeCloseTo(e / (e + 2), 12);
    expect(a.weights[0][1]).toBeCloseTo(0.6728, 4);
    expect(a.out[0][0]).toBeCloseTo(0.3272, 4);
    expect(a.out[0][1]).toBeCloseTo(0.8364, 4);
  });
  it("attention is one-sided: cats → chase (67%) ≠ chase → cats (45%)", () => {
    expect(Math.round(a.weights[0][1] * 100)).toBe(67);
    expect(Math.round(a.weights[1][0] * 100)).toBe(45);
  });
});

describe("the matrix form agrees with the step-by-step player", () => {
  it("same weights as attentionMatrix for every sentence", () => {
    for (const s of SENTENCES) {
      const m = attentionMatrix(tokenize(s));
      toy(s).weights.forEach((row, i) => row.forEach((w, j) => expect(w).toBeCloseTo(m[i][j], 12)));
    }
  });
});

describe("why divide by √d_k (paper footnote 4)", () => {
  it("the spread of q·k is about √d_k; after scaling it's about 1", () => {
    for (const dk of [4, 16, 64, 512]) {
      const s = scaleStats(dk);
      expect(s.spreadRaw / Math.sqrt(dk)).toBeGreaterThan(0.9);
      expect(s.spreadRaw / Math.sqrt(dk)).toBeLessThan(1.1);
      expect(s.spreadScaled).toBeGreaterThan(0.9);
      expect(s.spreadScaled).toBeLessThan(1.1);
    }
  });
  it("without scaling, softmax piles onto one key as d_k grows and its slope collapses; with scaling it doesn't", () => {
    const big = scaleStats(512);
    const mid = scaleStats(64);
    expect(scaleStats(16).topRaw).toBeLessThan(mid.topRaw);
    expect(mid.topRaw).toBeGreaterThan(0.8); // the page's "usually grabs nearly all" text appears above 0.8
    expect(scaleStats(4).topRaw).toBeLessThan(0.8);
    expect(big.topRaw).toBeGreaterThan(0.9);
    expect(big.slopeRaw).toBeLessThan(big.slopeScaled / 4);
    for (const dk of [4, 16, 64, 512]) expect(scaleStats(dk).topScaled).toBeLessThan(0.4);
  });
  it("one draw gives two weight vectors that each sum to 1", () => {
    const d = oneDraw(64, 10, 3);
    expect(d.raw.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    expect(d.scaled.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
  });
});

describe("masking", () => {
  const a = toy(SENTENCES[0], true);
  it("future words get exactly 0, rows still sum to 1", () => {
    a.weights.forEach((row, i) => {
      row.forEach((w, j) => j > i && expect(w).toBe(0));
      expect(row.reduce((x, y) => x + y, 0)).toBeCloseTo(1, 12);
    });
    expect(a.weights[0][0]).toBe(1);
  });
  it("“it” still attends most to “cat” with the mask on", () => {
    const it = a.words.indexOf("it");
    const best = a.weights[it].indexOf(Math.max(...a.weights[it]));
    expect(a.words[best]).toBe("cat");
  });
});

describe("word order", () => {
  it("“chased” gets the same output whichever way round the sentence is", () => {
    const a1 = toy("maya chased the dog");
    const a2 = toy("the dog chased maya");
    const o1 = a1.out[a1.words.indexOf("chased")];
    const o2 = a2.out[a2.words.indexOf("chased")];
    o1.forEach((v, f) => expect(v).toBeCloseTo(o2[f], 12));
  });
  it("positional encoding matches the paper's formula and differs per position", () => {
    const pe = positionalEncoding(3, 8);
    expect(pe[0]).toBeCloseTo(Math.sin(3), 12);
    expect(pe[1]).toBeCloseTo(Math.cos(3), 12);
    expect(pe[2]).toBeCloseTo(Math.sin(3 / 10000 ** (2 / 8)), 12);
    expect(pe[7]).toBeCloseTo(Math.cos(3 / 10000 ** (6 / 8)), 12);
    expect(positionalEncoding(0, 8)).toEqual([0, 1, 0, 1, 0, 1, 0, 1]);
  });
});
