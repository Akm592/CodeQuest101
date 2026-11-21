// What each metric tile shows, and how numbers are printed on the page.

import type { Outcome } from "../../../lib/ml/metrics";

/** A share as a percentage, or a dash when it has no value. */
export const pct = (v: number | null) => (v === null ? "–" : `${(v * 100).toFixed(1)}%`);

export type MetricKey = "precision" | "recall" | "f1" | "accuracy";

export const METRIC_INFO: Record<MetricKey, { label: string; question: string; formula: string; uses: Outcome[] }> = {
  precision: { label: "Precision", question: "When it flags, is it right?", formula: "TP ÷ (TP + FP)", uses: ["tp", "fp"] },
  recall: { label: "Recall", question: "How much spam does it catch?", formula: "TP ÷ (TP + FN)", uses: ["tp", "fn"] },
  f1: { label: "F1 score", question: "Both at once", formula: "2·P·R ÷ (P + R)", uses: ["tp", "fp", "fn"] },
  accuracy: { label: "Accuracy", question: "How many right overall?", formula: "(TP + TN) ÷ all", uses: ["tp", "fp", "fn", "tn"] },
};
