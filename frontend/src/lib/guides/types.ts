// The "How it works" content shown under each new visualizer.
//
// A guide is data, not JSX, so it can be tested: every guide pairs its stages
// with a pure `guideStepFor(step)` that names the stage a generator step
// belongs to, and guides.test.ts runs the pages' real inputs through the real
// generators to prove every step lands on a stage and every stage is reached.
// That is what keeps the highlighted stage honest as the generators change.

/** The colour roles the visualizers use, matching the --viz-* tokens. */
export type VizTone = "current" | "compare" | "swap" | "visited" | "found" | "pointer" | "idle";

export interface GuideStage {
  id: string;
  /** Short imperative, e.g. "Letters differ → 1 + cheapest neighbour". */
  title: string;
  /** One or two sentences: what happens and why it is correct. */
  detail: string;
  /** The pseudocode this stage corresponds to. */
  pseudo: string;
}

export interface LegendEntry {
  tone: VizTone;
  label: string;
}

export interface AlgorithmGuide {
  title: string;
  /** The intuition, as short paragraphs. */
  idea: string[];
  /** How to recognise the pattern in an interview question. */
  whenToUse: string[];
  /** Heading for whenToUse. Defaults to "Spot it in an interview". */
  whenToUseHeading?: string;
  stages: GuideStage[];
  legend: LegendEntry[];
  complexity: { time: string; space: string; why: string };
  pitfalls: string[];
  /** Experiments to run with the page's own controls. */
  tryThis: string[];
  /** A complete, runnable solution. */
  python: string;
}
