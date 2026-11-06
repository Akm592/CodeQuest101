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
import { buildAttentionSteps, SENTENCES, tokenize } from "../ml/attention";
import { GD_DEFAULT_LR, KMEANS_DEFAULT, kMeansPoints, LR_DEFAULT, MLP_DEFAULT, SAMPLING_DEFAULT } from "../ml/demos";
import { buildGd1dSteps } from "../ml/gd1d";
import { buildGdSteps, SURFACES } from "../ml/gradientDescent";
import { buildKMeansSteps } from "../ml/kMeans";
import { buildLrSteps, samplePoints } from "../ml/linearRegression";
import { buildMlpSteps, makeDataset } from "../ml/mlp";
import { buildSamplingSteps, PROMPTS } from "../ml/sampling";
import {
  attentionGuide,
  attentionGuideStepFor,
  gd1dGuideStepFor,
  gdGuideStepFor,
  gradientDescentGuide,
  kMeansGuide,
  kMeansGuideStepFor,
  linearRegressionGuide,
  lrGuideStepFor,
  mlpGuideStepFor,
  neuralNetworkGuide,
  samplingGuide,
  samplingGuideStepFor,
} from "./mlGuides";

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

/** Wrap a typed run for the table below. */
function run<T extends BaseStep>(steps: T[], stageFor: (s: T) => string) {
  return { steps: steps as BaseStep[], stageFor: (s: BaseStep) => stageFor(s as T) };
}

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
  [
    "gradient descent",
    {
      guide: gradientDescentGuide,
      runs: [
        ...Object.values(SURFACES).map((surf) =>
          run(buildGdSteps(surf, { lr: GD_DEFAULT_LR[surf.key], optimizer: "plain", start: surf.start }), gdGuideStepFor),
        ),
        run(buildGdSteps(SURFACES.valley, { lr: 0.1, optimizer: "momentum", start: SURFACES.valley.start }), gdGuideStepFor),
        run(buildGdSteps(SURFACES.bowl, { lr: 1.1, optimizer: "plain", start: SURFACES.bowl.start }), gdGuideStepFor),
        // The one-weight view that drives the highlighted stage on the page.
        ...[0.1, 0.5, 0.8, 1, 1.05].map((lr) => run(buildGd1dSteps(0, lr), gd1dGuideStepFor)),
      ],
      finalStages: ["stop", "diverged"],
    },
  ],
  [
    "linear regression",
    {
      guide: linearRegressionGuide,
      runs: [LR_DEFAULT.lr, 1.05].map((lr) => run(buildLrSteps(samplePoints(LR_DEFAULT.seed), lr), lrGuideStepFor)),
      finalStages: ["done", "diverged"],
    },
  ],
  [
    "k-means",
    {
      guide: kMeansGuide,
      runs: (["plusplus", "random"] as const).map((init) =>
        run(buildKMeansSteps(kMeansPoints(KMEANS_DEFAULT.seed), KMEANS_DEFAULT.k, init, KMEANS_DEFAULT.startSeed), kMeansGuideStepFor),
      ),
      finalStages: ["converged"],
    },
  ],
  [
    "self-attention",
    {
      guide: attentionGuide,
      runs: SENTENCES.map((sentence) => {
        const tokens = tokenize(sentence);
        return run(buildAttentionSteps(tokens, tokens.findIndex((t) => t.word === "it")), attentionGuideStepFor);
      }),
      finalStages: ["blend"],
    },
  ],
  [
    "next-token sampling",
    {
      guide: samplingGuide,
      runs: PROMPTS.map((p) => run(buildSamplingSteps(p, SAMPLING_DEFAULT, 1), samplingGuideStepFor)),
      finalStages: ["sample"],
    },
  ],
  [
    "neural network",
    {
      guide: neuralNetworkGuide,
      runs: [
        run(
          buildMlpSteps(makeDataset(MLP_DEFAULT.dataset, MLP_DEFAULT.seed), MLP_DEFAULT.hidden, MLP_DEFAULT.lr, MLP_DEFAULT.epochs, MLP_DEFAULT.seed),
          mlpGuideStepFor,
        ),
      ],
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
