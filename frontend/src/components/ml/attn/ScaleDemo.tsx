// "Why divide by √d_k?": random queries and keys, as in the paper's footnote 4,
// with and without the scaling. Numbers are measured live; the claims in the
// text are checked by attentionMath.test.ts.

import { Shuffle } from "lucide-react";
import * as React from "react";

import { oneDraw, scaleStats } from "../../../lib/ml/attentionMath";
import { Button } from "../../ui/button";
import { Surface } from "../../ui/surface";
import { C } from "../colors";
import { SectionTitle } from "../mathBlocks";
import { Segmented, Stat } from "../shared";

const DKS = [4, 16, 64, 512] as const;
type Dk = (typeof DKS)[number];
const KEYS = 10;
const f2 = (v: number) => v.toFixed(2);

const Bars: React.FC<{ title: string; weights: number[]; tone: string }> = ({
  title,
  weights,
  tone,
}) => (
  <div className="min-w-0 flex-1 space-y-2">
    <p className="text-sm font-semibold text-foreground">{title}</p>
    <svg
      viewBox="0 0 220 110"
      className="block h-auto w-full max-w-sm"
      role="img"
      aria-label={`${title}: largest weight ${Math.round(Math.max(...weights) * 100)}%`}
    >
      <line x1={4} x2={216} y1={96} y2={96} stroke={C.grid} />
      {weights.map((w, i) => (
        <rect
          key={i}
          x={8 + i * 21}
          y={96 - w * 88}
          width={15}
          height={Math.max(0.5, w * 88)}
          rx={2}
          fill={tone}
          opacity={0.85}
        />
      ))}
      <text x={4} y={8} fontSize={9} fill={C.muted}>
        100%
      </text>
      <text x={110} y={108} textAnchor="middle" fontSize={9} fill={C.muted}>
        {KEYS} keys
      </text>
    </svg>
  </div>
);

const ScaleDemo: React.FC = () => {
  const [dk, setDk] = React.useState<Dk>(64);
  const [seed, setSeed] = React.useState(1);
  const draw = React.useMemo(() => oneDraw(dk, KEYS, seed), [dk, seed]);
  const stats = React.useMemo(() => scaleStats(dk, KEYS), [dk]);

  return (
    <section aria-labelledby="attn-scale-title" className="space-y-4">
      <SectionTitle
        id="attn-scale-title"
        kicker="The √d_k in Equation (1)"
        title="Why divide by √d_k?"
      >
        <p>
          The paper's reason: “for large values of d_k, the dot products grow
          large in magnitude, pushing the softmax function into regions where it
          has extremely small gradients”. (The authors say they “suspect” this;
          it's their explanation, not a proof.) Here it is, measured: random
          queries and keys whose numbers have mean 0 and spread 1, exactly as in
          the paper's footnote.
        </p>
      </SectionTitle>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
          <p className="text-xs text-muted-foreground">
            One random query against {KEYS} random keys, d_k = {dk}. Bars are
            the softmax weights.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Bars title="Without scaling" weights={draw.raw} tone={C.red} />
            <Bars
              title={`Divided by √${dk}`}
              weights={draw.scaled}
              tone={C.green}
            />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {stats.topRaw > 0.8
              ? "Without scaling, one key usually grabs nearly all the attention, and the rest get almost nothing."
              : "With short vectors the difference is small. Try a bigger d_k."}
          </p>
        </Surface>
        <Surface
          variant="card"
          radius="2xl"
          className="flex flex-col gap-3 p-4"
        >
          <Segmented
            label="Key length d_k"
            value={dk}
            onChange={setDk}
            options={DKS.map((d) => ({ value: d, label: String(d) }))}
          />
          <Button variant="outline" onClick={() => setSeed((s) => s + 1)}>
            <Shuffle /> New query
          </Button>
          <p className="text-xs text-muted-foreground">
            Averages over 400 random queries:
          </p>
          <dl className="grid grid-cols-2 gap-2">
            <Stat
              label="Spread of q·k"
              value={f2(stats.spreadRaw)}
              tone={C.redText}
            />
            <Stat
              label="… after ÷ √d_k"
              value={f2(stats.spreadScaled)}
              tone={C.green}
            />
            <Stat
              label="Top weight"
              value={`${Math.round(stats.topRaw * 100)}%`}
              tone={C.redText}
            />
            <Stat
              label="… after ÷ √d_k"
              value={`${Math.round(stats.topScaled * 100)}%`}
              tone={C.green}
            />
            <Stat
              label="Its slope a(1−a)"
              value={f2(stats.slopeRaw)}
              tone={C.redText}
            />
            <Stat
              label="… after ÷ √d_k"
              value={f2(stats.slopeScaled)}
              tone={C.green}
            />
          </dl>
        </Surface>
      </div>

      <ol className="grid list-none gap-3 p-0 md:grid-cols-3">
        <Surface variant="card" radius="2xl" as="li" className="space-y-2 p-4">
          <h3 className="font-semibold text-foreground">
            1. Scores grow with length
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            q·k adds up d_k products. The paper's footnote: if each number has
            mean 0 and variance 1, the sum has mean 0 and variance d_k, so its
            spread is √d_k. Measured above: about {f2(stats.spreadRaw)} for d_k
            = {dk} (√{dk} = {f2(Math.sqrt(dk))}).
          </p>
        </Surface>
        <Surface variant="card" radius="2xl" as="li" className="space-y-2 p-4">
          <h3 className="font-semibold text-foreground">
            2. Big scores make softmax pick one
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Softmax uses e^score, so a gap of 10 between two scores means a
            ratio of e¹⁰ ≈ 22,000. Spread-out scores turn into one weight near
            100%.
          </p>
        </Surface>
        <Surface variant="card" radius="2xl" as="li" className="space-y-2 p-4">
          <h3 className="font-semibold text-foreground">
            3. Then learning stalls
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A softmax weight a changes with its own score at rate a(1 − a). Near
            a = 1 that's almost 0, so training gets almost no signal to adjust
            the scores. Dividing by √d_k brings the spread back to about 1,
            whatever d_k is.
          </p>
        </Surface>
      </ol>
    </section>
  );
};

export default ScaleDemo;
