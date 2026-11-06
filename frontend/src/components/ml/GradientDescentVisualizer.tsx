// Gradient Descent: the idea, one weight, the maths, the map, batch sizes,
// optimizers, schedules and common problems, in that order: simplest first.

import * as React from "react";

import type { Gd1dStep } from "../../lib/ml/gd1d";
import { gd1dGuideStepFor, gradientDescentGuide } from "../../lib/guides/mlGuides";
import AlgorithmGuidePanel from "../Visualizer/AlgorithmGuide";
import { gradientDescentFigures } from "./figures/regressionFigures";
import BatchCompare from "./gd/BatchCompare";
import { Problems, Schedules, WhichToUse } from "./gd/GdExtras";
import GdMath from "./gd/GdMath";
import MapView from "./gd/MapView";
import OneWeight from "./gd/OneWeight";
import OptimizerRace from "./gd/OptimizerRace";
import { ConceptFigures } from "./shared";

const JUMPS: [string, string][] = [
  ["#gd-one-title", "One weight"],
  ["#gd-math-title", "The maths"],
  ["#gd-map-title", "Map view"],
  ["#gd-batch-title", "Batch vs SGD"],
  ["#gd-opt-title", "Momentum & Adam"],
  ["#gd-sched-title", "Schedules"],
  ["#gd-problems-title", "Problems"],
  ["#gd-guide", "Summary"],
];

const GradientDescentVisualizer: React.FC = () => {
  const [oneStep, setOneStep] = React.useState<Gd1dStep | null>(null);

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <ConceptFigures figures={gradientDescentFigures} />
        <nav aria-label="On this page" className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Jump to:</span>
          {JUMPS.map(([href, label]) => (
            <a key={href} href={href} className="glass-pill glass-hover px-3.5 py-1.5 text-foreground">
              {label}
            </a>
          ))}
        </nav>
      </div>

      <OneWeight onStep={setOneStep} />
      <GdMath />
      <MapView />
      <BatchCompare />
      <OptimizerRace />
      <Schedules />
      <Problems />
      <WhichToUse />

      <div id="gd-guide" className="scroll-mt-20">
        <AlgorithmGuidePanel guide={gradientDescentGuide} activeStageId={oneStep ? gd1dGuideStepFor(oneStep) : null} />
      </div>
    </div>
  );
};

export default GradientDescentVisualizer;
