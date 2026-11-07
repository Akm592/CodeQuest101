// "The maths, step by step" for gradient boosting: one round on five points.
// Numbers come from lib/ml/gradientBoosting (checked by gradientBoosting.test.ts).

import * as React from "react";

import { bestStump, evalSteps, fitBoost, mse, predictBoost, type XY } from "../../../lib/ml/gradientBoosting";
import { C } from "../colors";
import { Eq, SectionTitle, Step } from "../mathBlocks";

const POINTS: XY[] = [1, 3, 2, 5, 4].map((y, i) => ({ x: i + 1, y }));
const LR = 0.5;
const r = (v: number, d = 4) => String(+v.toFixed(d));
const b = (v: number) => (v < 0 ? `(${r(v)})` : r(v));

const GbMath: React.FC = () => {
  const m = React.useMemo(() => fitBoost(POINTS, LR, 1, 1), []);
  const tree = m.trees[0];
  const residuals = POINTS.map((p) => ({ x: p.x, y: p.y - m.base }));
  const t = bestStump(residuals)!;
  const left = residuals.filter((p) => p.x <= t.threshold).map((p) => p.y);
  const right = residuals.filter((p) => p.x > t.threshold).map((p) => p.y);
  const after = POINTS.map((p) => predictBoost(m, p.x));
  const newRes = POINTS.map((p, i) => p.y - after[i]);

  return (
    <section aria-labelledby="gb-math-title" className="space-y-4">
      <SectionTitle id="gb-math-title" kicker="No magic, just averages" title="The maths, step by step">
        <p>
          One round of boosting on five points, (1, 1), (2, 3), (3, 2), (4, 5), (5, 4), with a one-question tree (a stump) and a learning rate
          of {LR}. Every number is calculated by the same code as the plots above.
        </p>
      </SectionTitle>

      <ol className="space-y-3 p-0">
        <Step n={1} title="Start with the average" plain="Before any trees, the best single number to predict everywhere is the mean of y.">
          <Eq lhs="F₀" rule="(1 + 3 + 2 + 5 + 4) ÷ 5" result={m.base} />
          <Eq lhs="error (MSE)" rule="mean of (y − 3)²" nums="(4 + 0 + 1 + 4 + 1) ÷ 5" result={mse(POINTS, () => m.base)} accent={C.redText} />
        </Step>

        <Step
          n={2}
          tone="backward"
          title="Residuals: what's still wrong"
          plain="For each point, subtract the prediction from the true value. Positive means the model is too low there, negative means too high."
        >
          <p>r = y − F₀ = ({residuals.map((p) => r(p.y)).join(", ")})</p>
          <p className="pt-1 text-muted-foreground">
            Why “gradient”? With the loss ½(y − F)², the slope with respect to F is −(y − F). So the residual is exactly the negative gradient:
            the downhill direction for each prediction. Each tree is a step of gradient descent.
          </p>
        </Step>

        <Step
          n={3}
          tone="backward"
          title="Fit a small tree to the residuals"
          plain={`Try every cut between neighbouring x values and keep the one whose two sides are most uniform (lowest squared error). Here that's x ≤ ${t.threshold}. Each side predicts the mean of its residuals.`}
        >
          <Eq lhs={`left (x ≤ ${t.threshold})`} rule={`(${left.map(r).join(" + ")}) ÷ ${left.length}`} result={tree.values[0]} accent={C.amber} />
          <Eq lhs={`right (x > ${t.threshold})`} rule={`(${right.map(r).join(" + ")}) ÷ ${right.length}`} result={tree.values[1]} accent={C.amber} />
        </Step>

        <Step
          n={4}
          tone="update"
          title="Add a shrunken copy of the tree"
          plain={`Don't add the whole tree: multiply it by the learning rate (${LR}) first. That's the “shrinkage” that stops each tree from overcorrecting.`}
        >
          <Eq lhs={`F₁ for x ≤ ${t.threshold}`} rule={`${m.base} + ${LR} × ${b(tree.values[0])}`} result={m.base + LR * evalSteps(tree, 1)} accent={C.green} />
          <Eq lhs={`F₁ for x > ${t.threshold}`} rule={`${m.base} + ${LR} × ${b(tree.values[1])}`} result={m.base + LR * evalSteps(tree, 5)} accent={C.green} />
        </Step>

        <Step n={5} tone="update" title="The error went down" plain="Measure again. The new residuals are smaller, and the next tree would be fitted to these.">
          <p>new residuals = ({newRes.map((v) => r(v)).join(", ")})</p>
          <Eq lhs="error (MSE)" rule="mean of new residuals²" result={mse(POINTS, (x) => predictBoost(m, x))} accent={C.green} />
          <p className="pt-1 text-muted-foreground">
            From {r(mse(POINTS, () => m.base))} to {r(mse(POINTS, (x) => predictBoost(m, x)))} with one tree. Repeat this hundreds of times and you
            have gradient boosting. With squared error and a learning rate between 0 and 1, the training error can never go up from one tree to the next.
          </p>
        </Step>
      </ol>
    </section>
  );
};

export default GbMath;
