import { describe, expect, it } from "vitest";

import {
  BASE_DAG,
  CYCLIC_DAG,
  DP_DEFAULT_CAPACITY,
  DP_DEFAULT_STRINGS,
  KNAPSACK_ITEMS,
  TRIE_PAGE_DEMOS,
  trieCustomScript,
  WEIGHTED_GRAPH,
} from "../algorithms/demoInputs";
import {
  buildEditDistanceSteps,
  buildKnapsackSteps,
  buildLcsSteps,
  type DpResult,
} from "../algorithms/dpSteps";
import { buildTopoSortSteps, buildUnionFindSteps } from "../algorithms/graphOrderingSteps";
import { buildNQueensSteps } from "../algorithms/nQueensSteps";
import { buildTrieSteps } from "../algorithms/trieSteps";
import type { BaseStep } from "../algorithms/types";
import { dpGuideStepFor, editDistanceGuide, knapsackGuide, lcsGuide } from "./dpGuides";
import {
  topoGuideStepFor,
  topoSortGuide,
  unionFindGuide,
  unionFindGuideStepFor,
} from "./graphOrderingGuides";
import { nQueensGuide, nQueensGuideStepFor } from "./nQueensGuide";
import { trieGuide, trieGuideStepFor } from "./trieGuide";
import type { AlgorithmGuide } from "./types";

// One case per guide: the guide, and every run the page can show for it, each
// paired with the mapping the page uses. The runs are the pages' own inputs
// (from demoInputs.ts), so a stage that only some demo reaches still counts.
interface GuideCase {
  guide: AlgorithmGuide;
  runs: { steps: BaseStep[]; stageFor: (step: BaseStep) => string }[];
  /** The stage(s) a run may legitimately end on. */
  finalStages: string[];
}

const dpRun = (problem: "editDistance" | "lcs" | "knapsack", result: DpResult) => ({
  steps: result.steps as BaseStep[],
  stageFor: (s: BaseStep) => dpGuideStepFor(problem, s as DpResult["steps"][number], result.labels),
});

const { source, target } = DP_DEFAULT_STRINGS;

const cases: [string, GuideCase][] = [
  [
    "edit distance",
    {
      guide: editDistanceGuide,
      runs: [dpRun("editDistance", buildEditDistanceSteps(source, target))],
      finalStages: ["answer"],
    },
  ],
  [
    "lcs",
    {
      guide: lcsGuide,
      runs: [dpRun("lcs", buildLcsSteps(source, target))],
      finalStages: ["answer"],
    },
  ],
  [
    "knapsack",
    {
      guide: knapsackGuide,
      runs: [dpRun("knapsack", buildKnapsackSteps(KNAPSACK_ITEMS, DP_DEFAULT_CAPACITY))],
      finalStages: ["answer"],
    },
  ],
  [
    "n-queens",
    {
      guide: nQueensGuide,
      runs: [
        buildNQueensSteps(6, { firstOnly: true }).steps,
        buildNQueensSteps(6, { maxSteps: 20_000 }).steps,
      ].map((steps) => ({
        steps: steps as BaseStep[],
        stageFor: (s: BaseStep) => nQueensGuideStepFor(s as (typeof steps)[number]),
      })),
      finalStages: ["solved"],
    },
  ],
  [
    "topological sort",
    {
      guide: topoSortGuide,
      runs: [BASE_DAG, CYCLIC_DAG].map((graph) => {
        const { steps } = buildTopoSortSteps(graph);
        return {
          steps: steps as BaseStep[],
          stageFor: (s: BaseStep) => topoGuideStepFor(s as (typeof steps)[number]),
        };
      }),
      finalStages: ["done", "cycle"],
    },
  ],
  [
    "union-find",
    {
      guide: unionFindGuide,
      runs: [buildUnionFindSteps(WEIGHTED_GRAPH).steps].map((steps) => ({
        steps: steps as BaseStep[],
        stageFor: (s: BaseStep) => unionFindGuideStepFor(s as (typeof steps)[number]),
      })),
      finalStages: ["done"],
    },
  ],
  [
    "trie",
    {
      guide: trieGuide,
      runs: [...Object.values(TRIE_PAGE_DEMOS).map((d) => d.script), trieCustomScript("cart")].map(
        (script) => {
          const { steps } = buildTrieSteps(script);
          return {
            steps: steps as BaseStep[],
            stageFor: (s: BaseStep) => trieGuideStepFor(s as (typeof steps)[number]),
          };
        },
      ),
      finalStages: ["done"],
    },
  ],
];

describe.each(cases)("%s guide", (_name, { guide, runs, finalStages }) => {
  const ids = guide.stages.map((s) => s.id);

  it("has unique stage ids", () => {
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("maps every step of every page run to a stage the guide defines", () => {
    for (const [r, run] of runs.entries()) {
      for (const [i, step] of run.steps.entries()) {
        const stage = run.stageFor(step);
        expect(ids, `run ${r} step ${i} → "${stage}"`).toContain(stage);
      }
    }
  });

  // A stage nothing reaches is a line in the guide that never lights up.
  it("reaches every stage in at least one page run", () => {
    const reached = new Set(runs.flatMap((run) => run.steps.map(run.stageFor)));
    for (const id of ids) expect(reached, `stage "${id}" is never reached`).toContain(id);
  });

  it("starts each run on the first stage and ends on a final one", () => {
    for (const run of runs) {
      expect(run.stageFor(run.steps[0])).toBe(ids[0]);
      expect(finalStages).toContain(run.stageFor(run.steps[run.steps.length - 1]));
    }
  });

  it("is complete enough to teach from", () => {
    expect(guide.idea.length).toBeGreaterThan(0);
    expect(guide.whenToUse.length).toBeGreaterThan(0);
    expect(guide.pitfalls.length).toBeGreaterThan(0);
    expect(guide.tryThis.length).toBeGreaterThan(0);
    expect(guide.legend.length).toBeGreaterThan(0);
    // The ?raw import really loaded the file, rather than an empty string.
    expect(guide.python).toMatch(/^(def|class|from|import) /m);
  });
});
