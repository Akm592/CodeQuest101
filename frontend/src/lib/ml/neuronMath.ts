// One training step of a tiny network, worked through with real numbers.
//
// 2 inputs → 2 tanh hidden neurons → 1 sigmoid output, one example, binary
// cross-entropy loss. Every number the page's maths section shows comes from
// here, and ml.test.ts checks the backprop gradients against a nudge test
// (finite differences), so the page can't show arithmetic that doesn't add up.

export interface WorkedExample {
  x: [number, number];
  y: 0 | 1;
  lr: number;
  W1: [[number, number], [number, number]];
  b1: [number, number];
  W2: [number, number];
  b2: number;
  // Forward
  z1: [number, number];
  h: [number, number];
  zOut: number;
  p: number;
  loss: number;
  // Backward
  dLdp: number;
  dpdz: number;
  dzOut: number;
  dW2: [number, number];
  db2: number;
  dh: [number, number];
  dz1: [number, number];
  dW1: [[number, number], [number, number]];
  db1: [number, number];
  // Update
  newW2: [number, number];
  newB2: number;
  newW1: [[number, number], [number, number]];
  newB1: [number, number];
  newP: number;
  newLoss: number;
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export const EXAMPLE_INPUT = {
  x: [1.0, 0.5] as [number, number],
  y: 1 as 0 | 1,
  lr: 0.5,
  W1: [
    [0.6, -0.4],
    [-0.3, 0.8],
  ] as [[number, number], [number, number]],
  b1: [0.1, -0.2] as [number, number],
  W2: [0.9, -0.5] as [number, number],
  b2: 0.1,
};

export interface NetParams {
  W1: [[number, number], [number, number]];
  b1: [number, number];
  W2: [number, number];
  b2: number;
}

export function forwardOne(params: NetParams, x: [number, number]) {
  const z1 = params.W1.map((row, j) => row[0] * x[0] + row[1] * x[1] + params.b1[j]) as [number, number];
  const h = z1.map(Math.tanh) as [number, number];
  const zOut = params.W2[0] * h[0] + params.W2[1] * h[1] + params.b2;
  const p = sigmoid(zOut);
  return { z1, h, zOut, p };
}

export function lossOf(p: number, y: 0 | 1): number {
  return -(y * Math.log(p) + (1 - y) * Math.log(1 - p));
}

export function workedExample(input = EXAMPLE_INPUT): WorkedExample {
  const { x, y, lr, W1, b1, W2, b2 } = input;
  const { z1, h, zOut, p } = forwardOne({ W1, b1, W2, b2 }, x);
  const loss = lossOf(p, y);

  // The chain rule, one link at a time.
  const dLdp = -y / p + (1 - y) / (1 - p);
  const dpdz = p * (1 - p);
  const dzOut = dLdp * dpdz; // simplifies to p − y
  const dW2 = [dzOut * h[0], dzOut * h[1]] as [number, number];
  const db2 = dzOut;
  const dh = [dzOut * W2[0], dzOut * W2[1]] as [number, number];
  const dz1 = [dh[0] * (1 - h[0] ** 2), dh[1] * (1 - h[1] ** 2)] as [number, number];
  const dW1 = [
    [dz1[0] * x[0], dz1[0] * x[1]],
    [dz1[1] * x[0], dz1[1] * x[1]],
  ] as [[number, number], [number, number]];
  const db1 = [...dz1] as [number, number];

  const newW2 = [W2[0] - lr * dW2[0], W2[1] - lr * dW2[1]] as [number, number];
  const newB2 = b2 - lr * db2;
  const newW1 = W1.map((row, j) => [row[0] - lr * dW1[j][0], row[1] - lr * dW1[j][1]]) as [[number, number], [number, number]];
  const newB1 = [b1[0] - lr * db1[0], b1[1] - lr * db1[1]] as [number, number];
  const after = forwardOne({ W1: newW1, b1: newB1, W2: newW2, b2: newB2 }, x);

  return {
    x, y, lr, W1, b1, W2, b2,
    z1, h, zOut, p, loss,
    dLdp, dpdz, dzOut, dW2, db2, dh, dz1, dW1, db1,
    newW2, newB2, newW1, newB1, newP: after.p, newLoss: lossOf(after.p, y),
  };
}

/** The nudge test for one weight: change it a tiny bit and see how the loss moves. */
export function nudgeTest(which: "W2_0" | "W1_00", eps = 1e-4, input = EXAMPLE_INPUT) {
  const base: NetParams = {
    W1: input.W1.map((r) => [...r]) as NetParams["W1"],
    b1: [...input.b1],
    W2: [...input.W2],
    b2: input.b2,
  };
  const lossWith = (delta: number) => {
    const p = structuredClone(base);
    if (which === "W2_0") p.W2[0] += delta;
    else p.W1[0][0] += delta;
    return lossOf(forwardOne(p, input.x).p, input.y);
  };
  const up = lossWith(eps);
  const down = lossWith(-eps);
  return { eps, up, down, numeric: (up - down) / (2 * eps) };
}

/** Two linear layers with no activation collapse into one: W2(W1x + b1) + b2 = (W2W1)x + (W2b1 + b2). */
export function collapseExample() {
  const W1 = [
    [2, 1],
    [-1, 3],
  ];
  const b1 = [1, 0];
  const W2 = [0.5, -1];
  const b2 = 2;
  const x = [1, 2];
  const hidden = W1.map((r, j) => r[0] * x[0] + r[1] * x[1] + b1[j]);
  const twoLayers = W2[0] * hidden[0] + W2[1] * hidden[1] + b2;
  const w = [W2[0] * W1[0][0] + W2[1] * W1[1][0], W2[0] * W1[0][1] + W2[1] * W1[1][1]];
  const b = W2[0] * b1[0] + W2[1] * b1[1] + b2;
  const oneLayer = w[0] * x[0] + w[1] * x[1] + b;
  return { W1, b1, W2, b2, x, hidden, twoLayers, w, b, oneLayer };
}
