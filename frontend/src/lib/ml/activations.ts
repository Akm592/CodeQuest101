// Activation functions and their derivatives.
//
// Definitions follow the PyTorch docs and CS231n:
//   sigmoid(z) = 1 / (1 + e^-z),          σ'(z) = σ(z)(1 − σ(z))
//   tanh(z),                               tanh'(z) = 1 − tanh²(z)
//   relu(z) = max(0, z),                   relu'(z) = 1 if z > 0 else 0
//   leakyRelu(z) = z if z ≥ 0 else 0.01z   (PyTorch's default slope, 0.01)
//   gelu(z) = z · Φ(z),                    Φ = standard normal CDF
//
// ReLU has no derivative at exactly 0; like PyTorch we use 0 there.

export type ActivationKey = "sigmoid" | "tanh" | "relu" | "leakyRelu" | "gelu";

export const LEAKY_SLOPE = 0.01;

/** Error function, Abramowitz & Stegun 7.1.26 (absolute error below 1.5e-7). */
export function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y =
    1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return sign * y;
}

const SQRT2 = Math.SQRT2;
const INV_SQRT_2PI = 1 / Math.sqrt(2 * Math.PI);
/** Standard normal CDF. */
export const normalCdf = (z: number) => 0.5 * (1 + erf(z / SQRT2));
/** Standard normal density. */
export const normalPdf = (z: number) => INV_SQRT_2PI * Math.exp(-0.5 * z * z);

export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export interface Activation {
  key: ActivationKey;
  label: string;
  f: (z: number) => number;
  /** Derivative with respect to z. */
  df: (z: number) => number;
  formula: string;
  derivative: string;
  range: string;
  good: string[];
  bad: string[];
  usedIn: string;
}

export const ACTIVATIONS: Record<ActivationKey, Activation> = {
  sigmoid: {
    key: "sigmoid",
    label: "Sigmoid",
    f: sigmoid,
    df: (z) => {
      const s = sigmoid(z);
      return s * (1 - s);
    },
    formula: "σ(z) = 1 / (1 + e⁻ᶻ)",
    derivative: "σ′(z) = σ(z) · (1 − σ(z))",
    range: "0 to 1",
    good: ["Output reads as a probability, which is why it's used for a yes/no output neuron."],
    bad: [
      "Saturates: for large positive or negative z the curve is flat, so the slope (and the learning signal) is almost 0.",
      "Its slope is never more than 0.25, so the signal shrinks every time it passes back through a sigmoid layer.",
      "Outputs are always positive (not centred on 0), which makes training of the next layer zigzag.",
    ],
    usedIn: "The output neuron of yes/no classifiers (this page's output uses it), and the gates inside LSTMs. Rarely used for hidden layers today.",
  },
  tanh: {
    key: "tanh",
    label: "Tanh",
    f: Math.tanh,
    df: (z) => 1 - Math.tanh(z) ** 2,
    formula: "tanh(z) = (eᶻ − e⁻ᶻ) / (eᶻ + e⁻ᶻ)",
    derivative: "tanh′(z) = 1 − tanh²(z)",
    range: "−1 to 1",
    good: [
      "Centred on 0, so it trains better than sigmoid in hidden layers.",
      "It's a stretched sigmoid: tanh(z) = 2σ(2z) − 1, and its slope reaches 1 at z = 0.",
    ],
    bad: ["Still saturates: far from 0 the curve flattens and the slope approaches 0."],
    usedIn: "Hidden layers of small networks (this page's default) and inside recurrent networks (RNNs, LSTMs).",
  },
  relu: {
    key: "relu",
    label: "ReLU",
    f: (z) => Math.max(0, z),
    df: (z) => (z > 0 ? 1 : 0),
    formula: "ReLU(z) = max(0, z)",
    derivative: "ReLU′(z) = 1 if z > 0, else 0",
    range: "0 to ∞",
    good: [
      "Never flattens for positive z, so the learning signal passes back undiminished.",
      "Very cheap to compute. It sped up training about 6× over tanh in the well-known AlexNet experiments.",
    ],
    bad: [
      "“Dying ReLU”: a neuron whose input is always negative outputs 0 and gets a slope of 0, so it stops learning for good.",
      "No derivative at exactly 0. Libraries simply use 0 there.",
    ],
    usedIn: "The default choice for hidden layers in most deep networks, especially image models.",
  },
  leakyRelu: {
    key: "leakyRelu",
    label: "Leaky ReLU",
    f: (z) => (z >= 0 ? z : LEAKY_SLOPE * z),
    df: (z) => (z >= 0 ? 1 : LEAKY_SLOPE),
    formula: "LeakyReLU(z) = z if z ≥ 0, else 0.01·z",
    derivative: "LeakyReLU′(z) = 1 if z ≥ 0, else 0.01",
    range: "−∞ to ∞",
    good: ["Keeps a small slope (0.01, PyTorch's default) for negative z, so neurons can't die."],
    bad: ["The 0.01 is an extra choice to make. A variant called PReLU learns it instead."],
    usedIn: "A drop-in replacement for ReLU when too many neurons die.",
  },
  gelu: {
    key: "gelu",
    label: "GELU",
    f: (z) => z * normalCdf(z),
    df: (z) => normalCdf(z) + z * normalPdf(z),
    formula: "GELU(z) = z · Φ(z)   (Φ(z) = chance a bell-curve value is below z)",
    derivative: "GELU′(z) = Φ(z) + z · φ(z)   (φ = the bell curve's height)",
    range: "about −0.17 to ∞",
    good: ["A smooth version of ReLU: no sharp corner at 0, and small negative values pass through a little."],
    bad: ["More expensive to compute, so many libraries offer a faster tanh-based approximation."],
    usedIn: "Transformers: BERT and the GPT models use it.",
  },
};

export const ACTIVATION_ORDER: ActivationKey[] = ["sigmoid", "tanh", "relu", "leakyRelu", "gelu"];

/** The activations the trainer offers (GELU is shown in the explorer only). */
export type HiddenActivation = "tanh" | "relu" | "leakyRelu" | "sigmoid";
