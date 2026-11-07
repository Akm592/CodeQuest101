// "The maths, step by step" for linear regression: the exact least-squares
// line on five points, by hand. Numbers come from lib/ml/linearRegression
// (checked by regressionExtras.test.ts).

import * as React from "react";

import { HAND_POINTS, leastSquares, mse, r2 } from "../../../lib/ml/linearRegression";
import { C } from "../colors";
import { Eq, SectionTitle, Step } from "../mathBlocks";

const r = (v: number, d = 4) => String(+v.toFixed(d));
const b = (v: number) => (v < 0 ? `(${r(v)})` : r(v));

const LrMath: React.FC = () => {
  const pts = HAND_POINTS;
  const n = pts.length;
  const mx = pts.reduce((a, p) => a + p.x, 0) / n;
  const my = pts.reduce((a, p) => a + p.y, 0) / n;
  const line = leastSquares(pts)!;
  const pred = (x: number) => line.slope * x + line.intercept;
  const sxy = pts.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0);
  const sxx = pts.reduce((a, p) => a + (p.x - mx) ** 2, 0);
  const ssRes = pts.reduce((a, p) => a + (p.y - pred(p.x)) ** 2, 0);
  const ssTot = pts.reduce((a, p) => a + (p.y - my) ** 2, 0);

  return (
    <section aria-labelledby="lr-math-title" className="space-y-4">
      <SectionTitle id="lr-math-title" kicker="No magic, just averages" title="The maths, step by step">
        <p>
          For a straight line there's an exact answer, no stepping needed. Here it is, worked by hand on five points: ({pts.map((p) => `${p.x}, ${p.y}`).join("), (")}). Every
          number is calculated by the same code as the plot above.
        </p>
      </SectionTitle>

      <ol className="space-y-3 p-0">
        <Step n={1} title="Find the middle of the data" plain="Average the x values and the y values. The best line always passes through this point.">
          <Eq lhs="x̄ (mean of x)" rule={`(${pts.map((p) => p.x).join(" + ")}) ÷ ${n}`} result={mx} />
          <Eq lhs="ȳ (mean of y)" rule={`(${pts.map((p) => p.y).join(" + ")}) ÷ ${n}`} result={my} />
        </Step>

        <Step
          n={2}
          title="The slope: how x and y move together"
          plain="For each point, multiply how far x is from its mean by how far y is from its mean. Add those up, and divide by the total of x's squared distances. If y tends to be above average when x is, the slope is positive."
        >
          <p className="text-muted-foreground">slope = Σ (x − x̄)(y − ȳ) ÷ Σ (x − x̄)²</p>
          <table className="w-full min-w-[26rem] text-right text-[13px]">
            <thead>
              <tr className="text-[11px] text-muted-foreground">
                <th className="pb-1 pr-3 text-left font-medium">x</th>
                <th className="pb-1 pr-3 text-left font-medium">y</th>
                <th className="pb-1 pr-3 font-medium">x − x̄</th>
                <th className="pb-1 pr-3 font-medium">y − ȳ</th>
                <th className="pb-1 pr-3 font-medium">product</th>
                <th className="pb-1 font-medium">(x − x̄)²</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {pts.map((p) => (
                <tr key={p.x}>
                  <td className="pr-3 text-left">{p.x}</td>
                  <td className="pr-3 text-left">{p.y}</td>
                  <td className="pr-3">{r(p.x - mx)}</td>
                  <td className="pr-3">{r(p.y - my)}</td>
                  <td className="pr-3">{r((p.x - mx) * (p.y - my))}</td>
                  <td>{r((p.x - mx) ** 2)}</td>
                </tr>
              ))}
              <tr className="border-t border-white/10 text-foreground">
                <td colSpan={4} className="pr-3 pt-1 text-left">totals</td>
                <td className="pr-3 pt-1">{r(sxy)}</td>
                <td className="pt-1">{r(sxx)}</td>
              </tr>
            </tbody>
          </table>
          <Eq lhs="slope" rule={`${r(sxy)} ÷ ${r(sxx)}`} result={line.slope} accent={C.teal} />
        </Step>

        <Step n={3} title="The intercept" plain="The line goes through the middle point (x̄, ȳ), so the intercept is whatever makes that true.">
          <Eq lhs="intercept" rule="ȳ − slope × x̄" nums={`${r(my)} − ${r(line.slope)} × ${r(mx)}`} result={line.intercept} accent={C.amber} />
          <p className="pt-1">
            So the best line is <span className="text-foreground">y = {r(line.slope)}x + {r(line.intercept)}</span>.
          </p>
        </Step>

        <Step n={4} tone="backward" title="Measure the misses" plain="Predict each point with the line, subtract, square, and average. That's the mean squared error.">
          {pts.map((p) => (
            <Eq
              key={p.x}
              lhs={`x = ${p.x}: (y − prediction)²`}
              rule={`(${p.y} − ${r(pred(p.x))})²`}
              nums={`${b(p.y - pred(p.x))}²`}
              result={(p.y - pred(p.x)) ** 2}
              accent={C.redText}
            />
          ))}
          <Eq lhs="MSE" rule={`${r(ssRes)} ÷ ${n}`} result={mse(pts, line)} accent={C.redText} />
          <p className="pt-1 text-muted-foreground">No other straight line has a smaller total of squared misses for these points: that's what “least squares” means.</p>
        </Step>

        <Step
          n={5}
          tone="update"
          title="How good is it? R²"
          plain="Compare the line's squared misses with those of the laziest possible model: always predicting the mean, ȳ. R² is the share of that spread the line explains."
        >
          <Eq lhs="SS_res (line's misses²)" rule="from step 4" result={ssRes} />
          <Eq lhs="SS_tot (misses² of always guessing ȳ)" rule="Σ (y − ȳ)²" result={ssTot} />
          <Eq lhs="R²" rule="1 − SS_res ÷ SS_tot" nums={`1 − ${r(ssRes)} ÷ ${r(ssTot)}`} result={r2(pts, pred)} accent={C.green} />
          <p className="pt-1 text-muted-foreground">
            The line explains {Math.round(r2(pts, pred) * 100)}% of the variation in y. R² is 1 for a perfect fit, 0 for a line no better than the
            mean, and negative for a line that's worse than just guessing the mean.
          </p>
        </Step>

        <Step
          n={6}
          tone="update"
          title="Why squares, and what about many features?"
          plain="Squaring stops misses above and below from cancelling out, punishes big misses most, and makes the maths smooth enough to have an exact answer."
        >
          <p>With many features the same idea becomes the normal equation:</p>
          <p className="text-foreground">(XᵀX) β = Xᵀy</p>
          <p className="text-muted-foreground">
            where each row of X is one example's features (plus a 1 for the intercept) and β holds all the weights. Libraries don't invert XᵀX
            directly; scikit-learn's LinearRegression solves it with a more stable method (singular value decomposition).
          </p>
        </Step>
      </ol>
    </section>
  );
};

export default LrMath;
