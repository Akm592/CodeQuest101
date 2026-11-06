import { describe, expect, it } from "vitest";

import { assertStepInvariants } from "../algorithms/testHelpers";
import { ACTIVATION_ORDER, ACTIVATIONS, erf, sigmoid } from "./activations";
import { collapseExample, nudgeTest, workedExample } from "./neuronMath";
import { attendFrom, attentionMatrix, buildAttentionSteps, SENTENCES, tokenize } from "./attention";
import { buildGdSteps, SURFACES } from "./gradientDescent";
import { buildKMeansSteps, nearest } from "./kMeans";
import { buildLrSteps, leastSquares, samplePoints } from "./linearRegression";
import { accuracy, applyUpdate, buildMlpSteps, gradients, initWeights, loss, makeDataset, type Weights } from "./mlp";
import { blobs } from "./random";
import { buildSamplingSteps, distribution, drawIndex, PROMPTS, sampleMany } from "./sampling";

// Checked against independent facts (closed forms, finite differences, known
// limits), not against the generators' own arithmetic.

describe("gradient descent", () => {
  it("reaches the bottom of the bowl with a sensible learning rate", () => {
    const steps = buildGdSteps(SURFACES.bowl, { lr: 0.3, optimizer: "plain", start: SURFACES.bowl.start });
    const last = steps.at(-1)!;
    expect(last.phase).toBe("stop");
    expect(Math.hypot(last.x, last.y)).toBeLessThan(1e-3);
    assertStepInvariants(steps);
  });

  it("diverges when the learning rate is past 2 / curvature", () => {
    const s = SURFACES.bowl;
    expect(buildGdSteps(s, { lr: s.safeLr * 1.1, optimizer: "plain", start: s.start }).at(-1)!.phase).toBe("diverged");
  });

  it("never increases the loss on the bowl below the safe rate", () => {
    const steps = buildGdSteps(SURFACES.bowl, { lr: 0.4, optimizer: "plain", start: [2, 1] });
    const losses = steps.at(-1)!.losses;
    for (let i = 1; i < losses.length; i++) expect(losses[i]).toBeLessThanOrEqual(losses[i - 1] + 1e-12);
  });

  it("lets momentum finish the narrow valley faster than plain descent", () => {
    const s = SURFACES.valley;
    // Same learning rate for both: the fair comparison the page offers.
    const plain = buildGdSteps(s, { lr: 0.1, optimizer: "plain", start: s.start, maxIters: 400 }).at(-1)!;
    const mom = buildGdSteps(s, { lr: 0.1, optimizer: "momentum", start: s.start, maxIters: 400 }).at(-1)!;
    expect(mom.phase).toBe("stop");
    expect(mom.iter).toBeLessThan(plain.iter);
  });

  it("gets stuck in the shallow valley from the default start (a local minimum)", () => {
    const s = SURFACES.twoMinima;
    const last = buildGdSteps(s, { lr: 0.05, optimizer: "plain", start: s.start, maxIters: 300 }).at(-1)!;
    expect(last.x).toBeGreaterThan(0.8);
    expect(s.f(last.x, last.y)).toBeGreaterThan(s.f(-1.036, 0));
  });

  it("has gradients that match finite differences on every surface", () => {
    for (const s of Object.values(SURFACES)) {
      const [x, y] = [0.7, -0.4];
      const h = 1e-6;
      const [gx, gy] = s.grad(x, y);
      expect(gx).toBeCloseTo((s.f(x + h, y) - s.f(x - h, y)) / (2 * h), 4);
      expect(gy).toBeCloseTo((s.f(x, y + h) - s.f(x, y - h)) / (2 * h), 4);
    }
  });
});

describe("linear regression", () => {
  it.each([1, 2, 3, 4, 5])("converges to the least-squares line (seed %i)", (seed) => {
    const pts = samplePoints(seed);
    const steps = buildLrSteps(pts, 0.1);
    const last = steps.at(-1)!;
    const exact = leastSquares(pts)!;
    expect(last.phase).toBe("done");
    expect(last.slope).toBeCloseTo(exact.slope, 3);
    expect(last.intercept).toBeCloseTo(exact.intercept, 2);
    assertStepInvariants(steps);
  });

  it("diverges with a learning rate above 1 (curvature of standardised MSE is 2)", () => {
    expect(buildLrSteps(samplePoints(1), 1.05).at(-1)!.phase).toBe("diverged");
  });

  it("asks for more points when x has no spread", () => {
    const steps = buildLrSteps([{ x: 3, y: 1 }, { x: 3, y: 4 }], 0.1);
    expect(steps).toHaveLength(1);
    expect(steps[0].done).toBe(true);
  });
});

describe("k-means", () => {
  const pts = blobs(7, [{ x: 2, y: 2 }, { x: 8, y: 2.5 }, { x: 5, y: 8 }], 15, 0.7);

  it.each(["random", "plusplus"] as const)("converges, with every point on its nearest centre (%s init)", (init) => {
    const steps = buildKMeansSteps(pts, 3, init, 3);
    const last = steps.at(-1)!;
    expect(last.phase).toBe("converged");
    pts.forEach((p, i) => expect(last.assignment[i]).toBe(nearest(p, last.centroids)));
    assertStepInvariants(steps);
  });

  it("never increases inertia from one update to the next", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const ins = buildKMeansSteps(pts, 4, "random", seed).at(-1)!.inertias;
      for (let i = 1; i < ins.length; i++) expect(ins[i]).toBeLessThanOrEqual(ins[i - 1] + 1e-9);
    }
  });

  it("finds the three blobs with k-means++", () => {
    const last = buildKMeansSteps(pts, 3, "plusplus", 3).at(-1)!;
    // Each blob's 15 points share one cluster.
    for (let b = 0; b < 3; b++) expect(new Set(last.assignment.slice(b * 15, b * 15 + 15)).size).toBe(1);
  });
});

describe("self-attention", () => {
  it("gives every row of attention weights a total of 1", () => {
    for (const s of SENTENCES) for (const row of attentionMatrix(tokenize(s))) expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });

  it.each([
    [SENTENCES[0], "cat"],
    [SENTENCES[1], "book"],
    [SENTENCES[2], "dog"],
  ])("in “%s”, “it” attends most to “%s”", (sentence, expected) => {
    const tokens = tokenize(sentence);
    const i = tokens.findIndex((t) => t.word === "it");
    const { weights } = attendFrom(tokens, i);
    expect(tokens[weights.indexOf(Math.max(...weights))].word).toBe(expected);
  });

  it("computes the output as the weighted sum of values", () => {
    const tokens = tokenize(SENTENCES[0]);
    const row = attendFrom(tokens, 0);
    for (let f = 0; f < 5; f++) {
      const expected = tokens.reduce((s, t, j) => s + row.weights[j] * t.value[f], 0);
      expect(row.output[f]).toBeCloseTo(expected, 12);
    }
  });

  it("walks through all seven stages for any word", () => {
    const steps = buildAttentionSteps(tokenize(SENTENCES[1]), 2);
    expect(steps.map((s) => s.phase)).toEqual(["embed", "query", "keys", "scores", "scale", "softmax", "blend"]);
    assertStepInvariants(steps);
  });
});

describe("next-token sampling", () => {
  const logits = PROMPTS[1].candidates.map((c) => c.logit);

  it("sums to 1 after every filter", () => {
    for (const s of [
      { temperature: 1, topK: 0, topP: 1 },
      { temperature: 0.5, topK: 3, topP: 1 },
      { temperature: 1.5, topK: 0, topP: 0.8 },
      { temperature: 1, topK: 4, topP: 0.5 },
    ]) {
      expect(distribution(logits, s).final.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    }
  });

  it("approaches always picking the top word as temperature drops", () => {
    expect(Math.max(...distribution(logits, { temperature: 0.05, topK: 0, topP: 1 }).final)).toBeGreaterThan(0.99);
  });

  it("approaches uniform as temperature rises", () => {
    const p = distribution(logits, { temperature: 1000, topK: 0, topP: 1 }).final;
    for (const v of p) expect(v).toBeCloseTo(1 / p.length, 2);
  });

  it("keeps exactly k words with top-k", () => {
    expect(distribution(logits, { temperature: 1, topK: 3, topP: 1 }).final.filter((p) => p > 0)).toHaveLength(3);
  });

  it("keeps the smallest set reaching p with top-p", () => {
    const d = distribution(logits, { temperature: 1, topK: 0, topP: 0.6 });
    const kept = d.probs.filter((_, i) => d.keptByP[i]).sort((a, b) => b - a);
    const total = kept.reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThanOrEqual(0.6);
    expect(total - kept.at(-1)!).toBeLessThan(0.6);
  });

  it("samples close to the distribution over many draws", () => {
    const d = distribution(logits, { temperature: 1, topK: 0, topP: 1 }).final;
    const draws = sampleMany(d, 20000, 11);
    d.forEach((p, i) => expect(draws.filter((x) => x === i).length / draws.length).toBeCloseTo(p, 1));
    expect(drawIndex([0, 0, 1], 0.999999)).toBe(2);
  });

  it("walks the seven pipeline stages", () => {
    const steps = buildSamplingSteps(PROMPTS[0], { temperature: 0.7, topK: 5, topP: 0.9 }, 1);
    expect(steps.map((s) => s.phase)).toEqual(["logits", "temperature", "softmax", "topk", "topp", "renormalise", "sample"]);
    assertStepInvariants(steps);
  });
});

describe("neural network", () => {
  const flatten = (w: Weights) => [...w.W1.flat(), ...w.b1, ...w.W2, w.b2];

  it("computes gradients that match finite differences", () => {
    const data = makeDataset("xor", 1, 40);
    const w = initWeights(4, 2);
    const g = flatten(gradients(w, data));
    const base = flatten(w);
    const rebuild = (v: number[]): Weights => ({
      W1: [0, 1, 2, 3].map((h) => [v[2 * h], v[2 * h + 1]] as [number, number]),
      b1: v.slice(8, 12),
      W2: v.slice(12, 16),
      b2: v[16],
    });
    const h = 1e-5;
    base.forEach((_, i) => {
      const up = [...base];
      const down = [...base];
      up[i] += h;
      down[i] -= h;
      const numeric = (loss(rebuild(up), data) - loss(rebuild(down), data)) / (2 * h);
      expect(g[i]).toBeCloseTo(numeric, 5);
    });
  });

  it("lowers the loss with one small update", () => {
    const data = makeDataset("circle", 3);
    const w = initWeights(6, 3);
    expect(loss(applyUpdate(w, gradients(w, data), 0.1), data)).toBeLessThan(loss(w, data));
  });

  it.each([
    ["blobs", 2, 0.97],
    ["xor", 4, 0.97],
    ["circle", 6, 0.95],
  ] as const)("learns %s with %i hidden neurons (page defaults)", (key, hidden, minAcc) => {
    const data = makeDataset(key, 1);
    const steps = buildMlpSteps(data, hidden, 0.8, 600, 1);
    const last = steps.at(-1)!;
    expect(last.phase).toBe("done");
    expect(last.accuracy).toBeGreaterThanOrEqual(minAcc);
    expect(accuracy(last.weights, data)).toBe(last.accuracy);
  });

  it.each([
    ["blobs", 2, 300],
    ["xor", 4, 600],
    ["circle", 6, 600],
  ] as const)("%s: the page's default also gets new, unseen points right", (key, hidden, epochs) => {
    const last = buildMlpSteps(makeDataset(key, 1), hidden, 0.8, epochs, 1).at(-1)!;
    expect(accuracy(last.weights, makeDataset(key, 999, 2000))).toBeGreaterThanOrEqual(0.97);
  });

  it("starts with the four walkthrough frames", () => {
    const steps = buildMlpSteps(makeDataset("xor", 1), 4, 0.8, 200, 1);
    expect(steps.slice(0, 4).map((s) => s.phase)).toEqual(["forward", "loss", "backward", "update"]);
    assertStepInvariants(steps);
  });
});

describe("activation functions", () => {
  const h = 1e-5;
  const zs = [-3, -1.2, -0.4, 0.3, 0.9, 2.5]; // away from ReLU's corner at 0

  it.each(ACTIVATION_ORDER)("%s: the derivative matches a nudge test", (key) => {
    const a = ACTIVATIONS[key];
    for (const z of zs) expect(a.df(z)).toBeCloseTo((a.f(z + h) - a.f(z - h)) / (2 * h), 5);
  });

  it("matches the facts the page states", () => {
    // tanh is a stretched sigmoid: tanh(z) = 2σ(2z) − 1
    for (const z of zs) expect(Math.tanh(z)).toBeCloseTo(2 * sigmoid(2 * z) - 1, 12);
    // sigmoid's slope peaks at 0.25 (at z = 0); tanh's at 1
    expect(ACTIVATIONS.sigmoid.df(0)).toBeCloseTo(0.25, 12);
    for (let z = -6; z <= 6; z += 0.01) expect(ACTIVATIONS.sigmoid.df(z)).toBeLessThanOrEqual(0.25 + 1e-12);
    expect(ACTIVATIONS.tanh.df(0)).toBe(1);
    // ranges
    expect(sigmoid(-30)).toBeGreaterThan(0);
    expect(sigmoid(30)).toBeLessThanOrEqual(1);
    expect(ACTIVATIONS.leakyRelu.f(-2)).toBeCloseTo(-0.02, 12);
    // GELU's minimum is about −0.17
    let min = Infinity;
    for (let z = -4; z <= 0; z += 0.001) min = Math.min(min, ACTIVATIONS.gelu.f(z));
    expect(min).toBeCloseTo(-0.17, 2);
    // erf approximation is good to well under 1e-6 (erf(1) = 0.8427007929…)
    expect(erf(1)).toBeCloseTo(0.8427007929, 6);
  });

  it("saturates: sigmoid's slope at z = 6 is under 0.003", () => {
    expect(ACTIVATIONS.sigmoid.df(6)).toBeLessThan(0.003);
  });
});

describe("worked example (the maths section)", () => {
  const ex = workedExample();

  it("simplifies the output gradient to p − y", () => {
    expect(ex.dzOut).toBeCloseTo(ex.p - ex.y, 12);
  });

  it("gets the same gradients as a nudge test", () => {
    expect(ex.dW2[0]).toBeCloseTo(nudgeTest("W2_0").numeric, 7);
    expect(ex.dW1[0][0]).toBeCloseTo(nudgeTest("W1_00").numeric, 7);
  });

  it("agrees with the trainer's backprop", () => {
    const w = { W1: ex.W1.map((r) => [...r]) as [number, number][], b1: [...ex.b1], W2: [...ex.W2], b2: ex.b2 };
    const g = gradients(w, [{ x: ex.x[0], y: ex.x[1], label: ex.y }]);
    expect(g.W1[1][1]).toBeCloseTo(ex.dW1[1][1], 12);
    expect(g.W2[1]).toBeCloseTo(ex.dW2[1], 12);
    expect(g.b2).toBeCloseTo(ex.db2, 12);
  });

  it("lowers the loss after one update", () => {
    expect(ex.newLoss).toBeLessThan(ex.loss);
  });

  it("shows two linear layers collapsing into one", () => {
    const c = collapseExample();
    expect(c.oneLayer).toBeCloseTo(c.twoLayers, 12);
  });
});

describe("trainer with each hidden activation", () => {
  it.each(["tanh", "relu", "leakyRelu", "sigmoid"] as const)("%s: backprop matches finite differences", (act) => {
    const data = makeDataset("circle", 2, 30);
    const w = initWeights(3, 5);
    const g = gradients(w, data, act);
    const h = 1e-6;
    const bump = (d: number) => ({ ...w, W1: w.W1.map((r, i) => (i === 1 ? ([r[0] + d, r[1]] as [number, number]) : r)) });
    expect(g.W1[1][0]).toBeCloseTo((loss(bump(h), data, act) - loss(bump(-h), data, act)) / (2 * h), 5);
  });

  it.each(["tanh", "relu", "leakyRelu", "sigmoid"] as const)("can't solve XOR with one hidden neuron (%s): the boundary stays a line", (act) => {
    const data = makeDataset("xor", 1);
    for (const seed of [1, 2, 3]) {
      const last = buildMlpSteps(data, 1, 0.8, 600, seed, act).at(-1)!;
      // XOR's four corner groups: a straight line can get at most three right.
      expect(last.accuracy).toBeLessThanOrEqual(0.8);
    }
  });

  it("solves XOR with ReLU too", () => {
    const last = buildMlpSteps(makeDataset("xor", 1), 6, 0.8, 600, 1, "relu").at(-1)!;
    expect(last.accuracy).toBeGreaterThanOrEqual(0.95);
  });
});
