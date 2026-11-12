// "The maths, step by step" for gradient descent, with every number computed
// by lib/ml/gd1d (and checked by gd.test.ts).

import * as React from "react";

import { buildGd1dSteps, error1d, shrinkFactor, slope1d } from "../../../lib/ml/gd1d";
import { SURFACES } from "../../../lib/ml/gradientDescent";
import { C } from "../colors";
import { Eq, SectionTitle, Step } from "../mathBlocks";

const r = (v: number, d = 3) => String(+v.toFixed(d));
/** A value inside a formula: bracketed when negative. */
const b = (v: number) => (v < 0 ? `(${r(v)})` : r(v));

const GdMath: React.FC = () => {
  const lr = 0.1;
  const hist = React.useMemo(() => buildGd1dSteps(0, lr).at(-1)!.history, []);
  const h = 0.001;
  const e0 = error1d(0);
  const eh = error1d(h);
  const bowl = SURFACES.bowl;
  const [px, py] = bowl.start;
  const [gx, gy] = bowl.grad(px, py);

  return (
    <section aria-labelledby="gd-math-title" className="space-y-4">
      <SectionTitle id="gd-math-title" kicker="No magic, just arithmetic" title="The maths, step by step">
        <p>
          We use the same curve as above: error(w) = (w − 3)², starting from w = 0 with a learning rate of η = {lr} (η, “eta”, is the usual
          symbol for the learning rate). Every number here is calculated by the same code that runs the ball above.
        </p>
      </SectionTitle>

      <ol className="space-y-3 p-0">
        <Step
          n={1}
          title="What “slope” means"
          plain="The slope tells you how fast the error changes when you nudge w. You can measure it directly: move w a tiny bit, see how much the error moves, and divide."
        >
          <Eq lhs="error(0)" rule="(0 − 3)²" result={e0} />
          <Eq lhs={`error(${h})`} rule={`(${h} − 3)²`} result={eh} />
          <Eq lhs="slope ≈ change ÷ nudge" nums={`(${eh.toFixed(6)} − ${e0}) ÷ ${h}`} result={(eh - e0) / h} accent={C.amber} />
          <p className="pt-1 text-muted-foreground">
            Calculus gives the exact slope without nudging: for (w − 3)² it is 2·(w − 3), which at w = 0 is{" "}
            <span className="text-viz-compare">{slope1d(0)}</span>. The nudge gets almost the same answer.
          </p>
        </Step>

        <Step
          n={2}
          tone="update"
          title="The one rule"
          plain="Step against the slope. If the slope is positive, the error rises as w grows, so make w smaller. If it's negative, make w bigger. The learning rate η decides how big the step is."
        >
          <p className="text-[15px] text-foreground">new w = w − η × slope</p>
          <p className="text-muted-foreground">That's all gradient descent is. Everything else on this page is a variation on how big the step should be and which way it points.</p>
        </Step>

        <Step n={3} tone="update" title="Run it with real numbers" plain="Apply the rule three times from w = 0. Each line uses the slope at the current w.">
          {[0, 1, 2].map((i) => (
            <Eq
              key={i}
              lhs={`w${i + 1}`}
              rule={`w${i} − η × 2·(w${i} − 3)`}
              nums={`${r(hist[i].w)} − ${lr} × ${b(hist[i].slope)}`}
              result={hist[i + 1].w}
              accent={C.green}
            />
          ))}
          <p className="pt-1 text-muted-foreground">
            The error falls each time: {hist.slice(0, 4).map((x) => r(x.error)).join(" → ")}. Steps get smaller on their own, because the slope
            gets flatter near the bottom.
          </p>
        </Step>

        <Step
          n={4}
          tone="update"
          title="The pattern: the gap shrinks by the same factor"
          plain="Put the slope into the rule and simplify. The distance to the answer is multiplied by the same number, (1 − 2η), every single step."
        >
          <p>new w − 3 = (w − 3) − η·2·(w − 3) = (1 − 2η)·(w − 3)</p>
          <Eq lhs="factor for η = 0.1" rule="1 − 2 × 0.1" result={shrinkFactor(0.1)} accent={C.green} />
          <p className="text-muted-foreground">
            Gaps to the answer: {hist.slice(0, 5).map((x) => r(Math.abs(x.w - 3))).join(" → ")}, each one 0.8 times the last.
          </p>
        </Step>

        <Step
          n={5}
          tone="backward"
          title="Why the learning rate matters so much"
          plain="Because the gap is multiplied by (1 − 2η) every step, that one number decides what happens. If it's between −1 and 1 the gap shrinks; outside that, it grows."
        >
          <table className="w-full min-w-[28rem] text-left text-[13px]">
            <thead>
              <tr className="text-[11px] text-muted-foreground">
                <th className="pb-1 pr-4 font-medium">η</th>
                <th className="pb-1 pr-4 text-right font-medium">1 − 2η</th>
                <th className="pb-1 font-medium">What happens</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {[
                [0.1, "Small steps, approaches from one side"],
                [0.5, "Lands exactly on 3 in one step"],
                [0.8, "Overshoots, bounces, still settles"],
                [1, "Bounces between two points forever"],
                [1.05, "Each bounce is bigger: blows up"],
              ].map(([eta, what]) => (
                <tr key={String(eta)}>
                  <td className="pr-4">{eta}</td>
                  <td className="pr-4 text-right text-viz-compare">{r(shrinkFactor(eta as number), 2)}</td>
                  <td>{what}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="pt-1 text-muted-foreground">
            So for this curve, any η strictly between 0 and 1 converges from a non-optimal start, while η above 1 diverges. For a one-dimensional quadratic bowl,
            the upper limit is 2 ÷ its constant second derivative. This curve bends by 2, so the limit is 1; a steeper quadratic has a smaller limit.
          </p>
        </Step>

        <Step
          n={6}
          title="More than one weight: the gradient"
          plain="Real models have many weights. You measure one slope per weight (each one says how the error changes if only that weight moves). That list of slopes is called the gradient, written ∇. The rule is the same for every weight."
        >
          <p>error(x, y) = x² + y²   →   gradient = (2x, 2y)</p>
          <p>
            gradient at ({px}, {py}) = (2 × {b(px)}, 2 × {py}) = <span className="font-semibold text-viz-compare">({r(gx)}, {r(gy)})</span>
          </p>
          <Eq lhs="new x" rule="x − η × slope_x" nums={`${px} − 0.1 × ${b(gx)}`} result={px - 0.1 * gx} accent={C.green} />
          <Eq lhs="new y" rule="y − η × slope_y" nums={`${py} − 0.1 × ${b(gy)}`} result={py - 0.1 * gy} accent={C.green} />
          <p className="pt-1 text-muted-foreground">
            The gradient points straight uphill on the map, so stepping against it is the steepest way down. The map below shows exactly this,
            for two weights at once.
          </p>
        </Step>
      </ol>
    </section>
  );
};

export default GdMath;
