// After the fit: judging it (R²), what one outlier does, and when a curve
// beats a line (and when it just memorises noise). Numbers are computed live
// from lib/ml; the claims in the text are checked by regressionExtras.test.ts.

import { Shuffle } from "lucide-react";
import * as React from "react";

import { leastSquares, mse, r2, samplePoints, type LineFit } from "../../../lib/ml/linearRegression";
import { cosData, evalPoly, fitPoly, trueCurve } from "../../../lib/ml/polyRegression";
import { Button } from "../../ui/button";
import { Surface } from "../../ui/surface";
import { C } from "../colors";
import { SectionTitle } from "../mathBlocks";
import { Plot, Segmented, Stat, type Scale } from "../shared";

const f2 = (v: number) => v.toFixed(2);
const f3 = (v: number) => (Math.abs(v) >= 100 ? v.toExponential(1) : v.toFixed(3));
const at = (l: LineFit) => (x: number) => l.slope * x + l.intercept;
const linePath = (l: LineFit, s: Scale) => `M${s.x(0)},${s.y(at(l)(0))}L${s.x(10)},${s.y(at(l)(10))}`;
const BASE = samplePoints(1);
const OUTLIER = { x: 9.5, y: 0.5 };

// ---------------------------------------------------------------------------

type Which = "mean" | "best" | "bad";

const R2Demo: React.FC = () => {
  const [which, setWhich] = React.useState<Which>("best");
  const my = BASE.reduce((a, p) => a + p.y, 0) / BASE.length;
  const best = leastSquares(BASE)!;
  const lines: Record<Which, LineFit> = {
    mean: { slope: 0, intercept: my },
    best,
    bad: { slope: -best.slope, intercept: my + best.slope * 5 },
  };
  const line = lines[which];
  const score = r2(BASE, at(line));

  return (
    <section aria-labelledby="lr-r2-title" className="space-y-4">
      <SectionTitle id="lr-r2-title" kicker="Is it any good?" title="R²: compared with just guessing the average">
        <p>
          MSE tells you how far off the line is, but in squared units of y, so “0.8” means nothing on its own. R² compares the line with the laziest
          model there is: always predicting the average of y. Pick a line to see its score.
        </p>
      </SectionTitle>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <Surface variant="card" radius="2xl" className="min-w-0 p-3 sm:p-4">
          <Plot xDomain={[0, 10]} yDomain={[0, 10]} width={520} height={300} ticks={[0, 2, 4, 6, 8, 10]} label={`Points with the ${which} line and its misses`}>
            {(s) => (
              <>
                {BASE.map((p, i) => (
                  <line key={`m${i}`} x1={s.x(p.x)} x2={s.x(p.x)} y1={s.y(p.y)} y2={s.y(at(line)(p.x))} stroke={C.red} strokeWidth={1.6} opacity={0.8} />
                ))}
                <path d={linePath(line, s)} stroke={which === "best" ? C.teal : which === "mean" ? C.muted : C.amber} strokeWidth={2.6} strokeDasharray={which === "mean" ? "6 4" : undefined} />
                {BASE.map((p, i) => (
                  <circle key={i} cx={s.x(p.x)} cy={s.y(p.y)} r={4} fill={C.fg} opacity={0.85} />
                ))}
              </>
            )}
          </Plot>
        </Surface>
        <Surface variant="card" radius="2xl" className="flex flex-col gap-3 p-4">
          <Segmented
            label="Line"
            value={which}
            onChange={setWhich}
            options={[
              { value: "best", label: "Best fit" },
              { value: "mean", label: "Average" },
              { value: "bad", label: "Wrong way" },
            ]}
          />
          <dl className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <Stat label="R²" value={f2(score)} tone={score < 0 ? C.redText : which === "best" ? C.green : undefined} />
            <Stat label="MSE" value={f2(mse(BASE, line))} />
          </dl>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {which === "best" && "The least-squares line: no straight line scores higher on these points."}
            {which === "mean" && "A flat line at the average of y scores exactly 0. That's the baseline."}
            {which === "bad" && "Worse than just guessing the average, so R² goes below zero."}
          </p>
        </Surface>
      </div>
      <Surface variant="card" radius="2xl" className="space-y-2 p-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          <span className="text-foreground">R² = 1 − (line's squared misses) ÷ (squared misses of always guessing the average)</span>
        </p>
        <ul className="list-disc space-y-1 pl-5 marker:text-primary">
          <li>1 means every point is exactly on the line.</li>
          <li>0 means the line is no better than the average. Despite the “²”, R² can be negative: the model is worse than the average.</li>
          <li>
            Mean absolute error (MAE) is another common score: the average size of the misses, in y's own units. It's never larger than the square
            root of the MSE, because squaring makes big misses count extra.
          </li>
        </ul>
      </Surface>
    </section>
  );
};

// ---------------------------------------------------------------------------

const OutlierDemo: React.FC = () => {
  const [on, setOn] = React.useState(false);
  const pts = on ? [...BASE, OUTLIER] : BASE;
  const before = leastSquares(BASE)!;
  const after = leastSquares([...BASE, OUTLIER])!;
  const line = on ? after : before;

  return (
    <section aria-labelledby="lr-outlier-title" className="space-y-4">
      <SectionTitle id="lr-outlier-title" kicker="One bad point" title="What a single outlier does">
        <p>
          Squaring makes a big miss count a lot: a point 4 away costs 16, as much as sixteen points 1 away. So the line bends towards a point that's far
          from the rest, even if it's just a typo.
        </p>
      </SectionTitle>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <Surface variant="card" radius="2xl" className="min-w-0 p-3 sm:p-4">
          <Plot xDomain={[0, 10]} yDomain={[0, 10]} width={520} height={300} ticks={[0, 2, 4, 6, 8, 10]} label={on ? "The line pulled down by one outlier" : "The line without the outlier"}>
            {(s) => (
              <>
                {on && <path d={linePath(before, s)} stroke={C.muted} strokeWidth={2} strokeDasharray="6 4" />}
                <path d={linePath(line, s)} stroke={C.teal} strokeWidth={2.6} />
                {pts.map((p, i) => (
                  <circle key={i} cx={s.x(p.x)} cy={s.y(p.y)} r={p === OUTLIER ? 6 : 4} fill={p === OUTLIER ? C.red : C.fg} opacity={0.9} />
                ))}
              </>
            )}
          </Plot>
        </Surface>
        <Surface variant="card" radius="2xl" className="flex flex-col gap-3 p-4">
          <Button variant="outline" aria-pressed={on} onClick={() => setOn((v) => !v)}>
            {on ? "Remove the outlier" : `Add an outlier at (${OUTLIER.x}, ${OUTLIER.y})`}
          </Button>
          <dl className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <Stat label="Slope without it" value={f2(before.slope)} />
            <Stat label="Slope now" value={f2(line.slope)} tone={on ? C.redText : undefined} />
          </dl>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {on
              ? `One point out of ${pts.length} changed the slope from ${f2(before.slope)} to ${f2(after.slope)}. The dashed line is the fit without it.`
              : `${BASE.length} points that follow a clear upward trend.`}
          </p>
        </Surface>
      </div>
      <Surface variant="card" radius="2xl" className="p-4 text-sm leading-relaxed text-muted-foreground">
        <p className="mb-1 font-semibold text-foreground">What to do about it</p>
        <ul className="list-disc space-y-1 pl-5 marker:text-primary">
          <li>Plot your data first, and check whether an odd point is a mistake.</li>
          <li>
            Use a loss that punishes big misses less. Absolute error grows in a straight line instead of a square; the Huber loss is squared for
            small misses and absolute for big ones. Both let an outlier pull the line less.
          </li>
        </ul>
      </Surface>
    </section>
  );
};

// ---------------------------------------------------------------------------

const DEGREES = [1, 4, 15] as const;
type Degree = (typeof DEGREES)[number];

function curvePath(f: (x: number) => number, s: Scale): string {
  const pts: string[] = [];
  for (let i = 0; i <= 200; i++) {
    const x = i / 200;
    const y = Math.max(-3, Math.min(3, f(x)));
    pts.push(`${i ? "L" : "M"}${s.x(x).toFixed(1)},${s.y(y).toFixed(1)}`);
  }
  return pts.join("");
}

const PolyDemo: React.FC = () => {
  const [degree, setDegree] = React.useState<Degree>(4);
  const [seed, setSeed] = React.useState(5);
  const data = React.useMemo(() => cosData(seed), [seed]);
  const fresh = React.useMemo(() => cosData(1000 + seed, 1000), [seed]);
  const fits = React.useMemo(() => Object.fromEntries(DEGREES.map((d) => [d, fitPoly(data, d)])) as Record<Degree, ReturnType<typeof fitPoly>>, [data]);
  const err = (d: Degree, pts: typeof data) => pts.reduce((a, p) => a + (evalPoly(fits[d], p.x) - p.y) ** 2, 0) / pts.length;
  const train = err(degree, data);
  const test = err(degree, fresh);
  const bestTest = DEGREES.reduce((b, d) => (err(d, fresh) < err(b, fresh) ? d : b), DEGREES[0]);

  const verdict: Record<Degree, string> = {
    1: "Underfitting: a straight line can't bend, so it misses the shape everywhere. Bad on the training points and on new ones.",
    4: "About right: it follows the shape of the true curve without chasing every wobble.",
    15: "Overfitting: it wiggles through the training points, learning the noise. Training error is the lowest, but new points suffer.",
  };

  return (
    <section aria-labelledby="lr-poly-title" className="space-y-4">
      <SectionTitle id="lr-poly-title" kicker="Bending the line" title="Curves are linear regression too">
        <p>
          Add x², x³ … as extra features and the same least-squares maths fits a curve, because the model is still a weighted sum (linear in its
          weights). The danger is giving it too much freedom. This is scikit-learn's classic example: 30 noisy points from a cosine curve, fitted with
          degree 1, 4 and 15.
        </p>
      </SectionTitle>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <Surface variant="card" radius="2xl" className="min-w-0 p-3 sm:p-4">
          <Plot
            xDomain={[0, 1]}
            yDomain={[-2, 2]}
            width={520}
            height={300}
            ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
            yTicks={[-2, -1, 0, 1, 2]}
            label={`Degree ${degree} polynomial fitted to 30 noisy points from a cosine curve`}
          >
            {(s) => (
              <>
                <path d={curvePath(trueCurve, s)} fill="none" stroke={C.muted} strokeWidth={2} strokeDasharray="6 4" />
                <path d={curvePath((x) => evalPoly(fits[degree], x), s)} fill="none" stroke={degree === 4 ? C.teal : C.amber} strokeWidth={2.6} />
                {data.map((p, i) => (
                  <circle key={i} cx={s.x(p.x)} cy={s.y(p.y)} r={3.6} fill={C.fg} opacity={0.85} />
                ))}
              </>
            )}
          </Plot>
          <p className="px-1 pt-2 text-xs text-muted-foreground">Dashed: the true curve the points came from. Solid: the fitted polynomial.</p>
        </Surface>
        <Surface variant="card" radius="2xl" className="flex flex-col gap-3 p-4">
          <Segmented label="Degree" value={degree} onChange={setDegree} options={DEGREES.map((d) => ({ value: d, label: String(d) }))} />
          <Button variant="outline" onClick={() => setSeed((v) => v + 1)}>
            <Shuffle /> New sample
          </Button>
          <dl className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <Stat label="Error on the 30 training points" value={f3(train)} />
            <Stat label="Error on 1000 new points" value={f3(test)} tone={degree === bestTest ? C.green : degree === 15 ? C.redText : undefined} />
          </dl>
          <p className="text-sm leading-relaxed text-muted-foreground">{verdict[degree]}</p>
        </Surface>
      </div>
      <Surface variant="card" radius="2xl" className="space-y-2 p-4 text-sm leading-relaxed text-muted-foreground">
        <p className="font-semibold text-foreground">What “New sample” shows</p>
        <ul className="list-disc space-y-1 pl-5 marker:text-primary">
          <li>Degree 15 always has the lowest training error: more freedom can only fit the training points better.</li>
          <li>On new points it did worse than degree 4 in all 300 samples we tested, but how much worse jumps around from sample to sample. Sometimes it's close; sometimes it's wildly off.</li>
          <li>
            So training error can't pick the degree. Measure error on data the model hasn't seen; scikit-learn's example uses cross-validation for
            this. Ridge regression is another fix: it shrinks the weights, which calms the wiggles.
          </li>
        </ul>
      </Surface>
    </section>
  );
};

// ---------------------------------------------------------------------------

const FitExtras: React.FC = () => (
  <>
    <R2Demo />
    <OutlierDemo />
    <PolyDemo />
    <section aria-label="Strengths and weaknesses" className="grid gap-3 md:grid-cols-2">
      <Surface variant="card" radius="2xl" className="space-y-2 p-4">
        <h3 className="font-semibold text-foreground">Good at</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li>Easy to explain: each weight says how much y changes when that feature goes up by one.</li>
          <li>Fast, with an exact answer: no learning rate to tune if you solve it directly.</li>
          <li>A strong first baseline before trying anything fancier.</li>
        </ul>
      </Surface>
      <Surface variant="card" radius="2xl" className="space-y-2 p-4">
        <h3 className="font-semibold text-foreground">Watch out for</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li>It assumes a straight-line relationship (in its features). Plot the data first.</li>
          <li>Outliers pull the line, because misses are squared.</li>
          <li>
            Features that move together (say, height in cm and height in inches) make the weights unstable: tiny changes in the data can swing them
            wildly. Ridge regression helps here too.
          </li>
        </ul>
      </Surface>
    </section>
  </>
);

export default FitExtras;
