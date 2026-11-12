// "Activation functions": what they are, why a network needs them, and how
// the common ones differ. Facts are from CS231n and the PyTorch docs; the
// numbers on screen come from lib/ml, which the tests check.

import * as React from "react";

import { ACTIVATION_ORDER, ACTIVATIONS, type ActivationKey } from "../../lib/ml/activations";
import { collapseExample } from "../../lib/ml/neuronMath";
import { Slider } from "../ui/slider";
import { Surface } from "../ui/surface";
import { C } from "./colors";
import { SectionTitle } from "./mathBlocks";
import { Plot, Segmented } from "./shared";

const Z = 5;
const curve = (f: (z: number) => number) =>
  Array.from({ length: 201 }, (_, i) => {
    const z = -Z + (2 * Z * i) / 200;
    return [z, f(z)] as const;
  });

const fmt = (v: number) => (Math.abs(v) < 0.00005 ? "0" : v.toFixed(4));



const ActivationExplorer: React.FC = () => {
  const [key, setKey] = React.useState<ActivationKey>("tanh");
  const [z, setZ] = React.useState(1);
  const a = ACTIVATIONS[key];
  const fz = a.f(z);
  const dz = a.df(z);
  const yMax = Math.max(1.5, Math.ceil(a.f(Z)));
  const c = collapseExample();
  const sigmoidChain = Array.from({ length: 10 }, (_, i) => 0.25 ** (i + 1));

  const path = (pts: readonly (readonly [number, number])[], s: { x: (v: number) => number; y: (v: number) => number }) =>
    pts.map(([zz, v], i) => `${i ? "L" : "M"}${s.x(zz).toFixed(1)},${s.y(v).toFixed(1)}`).join(" ");

  return (
    <section aria-labelledby="activations-title" className="space-y-4">
      <SectionTitle id="activations-title" kicker="Inside every neuron" title="Activation functions">
        <p>
          After a neuron adds up its weighted inputs (call the total <span className="font-mono text-foreground">z</span>), it passes{" "}
          <span className="font-mono text-foreground">z</span> through an activation function. That's the step that lets a network learn
          curves instead of only straight lines. Pick one below and drag <span className="font-mono text-foreground">z</span> to see its
          output and its slope. The slope matters because it's what carries the learning signal backwards during training.
        </p>
      </SectionTitle>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Surface variant="card" radius="2xl" className="min-w-0 space-y-4 p-4 sm:p-5">
          <Segmented label="Function" value={key} onChange={setKey} options={ACTIVATION_ORDER.map((k) => ({ value: k, label: ACTIVATIONS[k].label }))} />
          <Plot xDomain={[-Z, Z]} yDomain={[-1.5, yMax]} width={480} height={300} ticks={[-4, -2, 0, 2, 4]} yTicks={Array.from({ length: Math.floor(yMax) + 2 }, (_, i) => i - 1)} label={`${a.label} and its slope`}>
            {(s) => (
              <>
                <line x1={s.x(-Z)} x2={s.x(Z)} y1={s.y(0)} y2={s.y(0)} stroke={C.muted} strokeWidth={0.8} />
                <line x1={s.x(0)} x2={s.x(0)} y1={s.y(-1.5)} y2={s.y(yMax)} stroke={C.muted} strokeWidth={0.8} />
                <path d={path(curve(a.df), s)} fill="none" stroke={C.amber} strokeWidth={2} strokeDasharray="6 4" />
                <path d={path(curve(a.f), s)} fill="none" stroke={C.teal} strokeWidth={2.8} />
                <line x1={s.x(z)} x2={s.x(z)} y1={s.y(-1.5)} y2={s.y(yMax)} stroke={C.fg} strokeOpacity={0.25} />
                <circle cx={s.x(z)} cy={s.y(fz)} r={6} fill={C.teal} stroke="hsl(var(--background))" strokeWidth={2} />
                <circle cx={s.x(z)} cy={s.y(dz)} r={5} fill={C.amber} stroke="hsl(var(--background))" strokeWidth={2} />
              </>
            )}
          </Plot>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-viz-current" /> output f(z)</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 border-t-2 border-dashed border-viz-compare" /> slope f′(z)</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <label htmlFor="act-z" className="text-sm font-medium text-muted-foreground">
                Input z
              </label>
              <span className="font-mono text-sm text-foreground">{z.toFixed(2)}</span>
            </div>
            <Slider id="act-z" value={[z]} min={-Z} max={Z} step={0.05} onValueChange={([v]) => setZ(v)} aria-label="Input z" />
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2">
              <dt className="text-[11px] text-muted-foreground">Output f({z.toFixed(2)})</dt>
              <dd className="font-mono font-semibold text-viz-current">{fmt(fz)}</dd>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2">
              <dt className="text-[11px] text-muted-foreground">Slope f′({z.toFixed(2)})</dt>
              <dd className="font-mono font-semibold text-viz-compare">{fmt(dz)}</dd>
            </div>
          </dl>
        </Surface>

        <Surface variant="card" radius="2xl" className="space-y-4 p-4 sm:p-5">
          <h3 className="text-lg font-semibold text-foreground">{a.label}</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-[11px] text-muted-foreground">Formula</dt>
              <dd className="font-mono text-foreground">{a.formula}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground">Slope (derivative)</dt>
              <dd className="font-mono text-foreground">{a.derivative}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground">Output range</dt>
              <dd className="text-foreground">{a.range}</dd>
            </div>
          </dl>
          <div>
            <p className="mb-1 text-xs font-semibold text-viz-found">Good</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground marker:text-viz-found">
              {a.good.map((g) => <li key={g}>{g}</li>)}
            </ul>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-destructive-bright">Watch out</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground marker:text-destructive-bright">
              {a.bad.map((b) => <li key={b}>{b}</li>)}
            </ul>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Where it's used: </span>
            {a.usedIn}
          </p>
        </Surface>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Surface variant="card" radius="2xl" className="space-y-3 p-4 sm:p-5">
          <h3 className="font-semibold text-foreground">Why not just skip the activation?</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Without one, a layer only multiplies and adds. Two layers that only multiply and add can always be merged into a single layer
            that does the same thing, so stacking them gains nothing: the network can still only draw straight lines. Here's the check with
            real numbers, for the input x = ({c.x.join(", ")}):
          </p>
          <div className="space-y-1.5 rounded-xl border border-white/[0.06] bg-black/25 p-3 font-mono text-xs leading-relaxed text-foreground/90">
            <p>Layer 1: h = ({c.hidden.join(", ")})</p>
            <p>Layer 2: {c.W2[0]}·{c.hidden[0]} + ({c.W2[1]})·{c.hidden[1]} + {c.b2} = <span className="text-viz-current">{c.twoLayers}</span></p>
            <p className="pt-1 text-muted-foreground">One merged layer: w = ({c.w.join(", ")}), b = {c.b}</p>
            <p>{c.w[0]}·{c.x[0]} + ({c.w[1]})·{c.x[1]} + {c.b} = <span className="text-viz-current">{c.oneLayer}</span>, the same answer.</p>
          </div>
          <p className="text-sm text-muted-foreground">An activation between the layers breaks this merge, and that's what lets the network bend its boundary.</p>
        </Surface>

        <Surface variant="card" radius="2xl" className="space-y-3 p-4 sm:p-5">
          <h3 className="font-semibold text-foreground">Why the slope matters: vanishing gradients</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            When the network learns, the error signal travels backwards and is multiplied by each layer's activation slope (and its
            weights). Sigmoid's slope is never more than 0.25, so after a few sigmoid layers the signal is tiny and the early layers barely
            learn. ReLU's slope is exactly 1 for positive inputs, so the activation doesn't shrink it there.
          </p>
          <div className="space-y-1" aria-label="Largest product of n sigmoid slopes">
            {sigmoidChain.map((v, i) => (
              <div key={i} className="grid grid-cols-[4.5rem_minmax(0,1fr)_5.5rem] items-center gap-2 text-xs">
                <span className="text-muted-foreground">{i + 1} layer{i ? "s" : ""}</span>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-viz-compare" style={{ width: `${Math.max(v * 400, 0.6)}%` }} />
                </div>
                <span className="text-right font-mono tabular-nums text-foreground">{v < 0.001 ? v.toExponential(1) : v.toFixed(4)}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">The most that n sigmoid slopes multiplied together can be: 0.25ⁿ. Weights multiply in too; this is only the activations' share.</p>
        </Surface>
      </div>
    </section>
  );
};

export default ActivationExplorer;
