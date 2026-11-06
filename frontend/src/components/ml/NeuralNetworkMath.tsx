// "The maths, step by step": one training step of a 2-2-1 network, with every
// number computed by lib/ml/neuronMath (and checked by its tests).

import * as React from "react";

import { nudgeTest, workedExample } from "../../lib/ml/neuronMath";
import { cn } from "../../lib/utils";
import { Surface } from "../ui/surface";
import { SectionTitle } from "./ActivationExplorer";
import { C } from "./colors";

const n4 = (v: number) => {
  const r = Math.abs(v) < 0.00005 ? 0 : v;
  return r.toFixed(4);
};
/** A starting value, written as given (0.6, not 0.6000). */
const short = (v: number) => String(+v.toFixed(4));
/** A starting value in a formula, with brackets when negative. */
const nb = (v: number) => (v < 0 ? `(${short(v)})` : short(v));
/** A computed value in a formula (4 decimals), with brackets when negative. */
const nc = (v: number) => (v < 0 ? `(${n4(v)})` : n4(v));

const Step: React.FC<{ n: number; title: string; plain: React.ReactNode; children: React.ReactNode; tone?: "forward" | "backward" | "update" }> = ({
  n,
  title,
  plain,
  children,
  tone = "forward",
}) => (
  <Surface variant="card" radius="2xl" as="li" className="list-none space-y-3 p-4 sm:p-5">
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-xs font-bold text-primary-foreground",
          tone === "forward" ? "bg-viz-current" : tone === "backward" ? "bg-viz-compare" : "bg-viz-found",
        )}
      >
        {n}
      </span>
      <div className="min-w-0 space-y-1">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <div className="text-sm leading-relaxed text-muted-foreground">{plain}</div>
      </div>
    </div>
    <div className="space-y-1.5 overflow-x-auto rounded-xl border border-white/[0.06] bg-black/25 p-3 font-mono text-[13px] leading-relaxed text-foreground/90">
      {children}
    </div>
  </Surface>
);

/** One formula line: symbols, then the numbers plugged in, then the result. */
const Eq: React.FC<{ lhs: React.ReactNode; rule?: React.ReactNode; nums?: string; result: number; accent?: string }> = ({ lhs, rule, nums, result, accent = C.teal }) => (
  <p className="whitespace-nowrap">
    <span className="text-foreground">{lhs}</span>
    {rule && <span className="text-muted-foreground"> = {rule}</span>}
    {nums && <span className="text-muted-foreground"> = {nums}</span>}
    <span> = </span>
    <span className="font-semibold" style={{ color: accent }}>
      {n4(result)}
    </span>
  </p>
);

const NetDiagram: React.FC<{ ex: ReturnType<typeof workedExample> }> = ({ ex }) => {
  const xs = [40, 190, 330];
  const inY = [55, 145];
  const hidY = [55, 145];
  const lbl = (x1: number, y1: number, x2: number, y2: number, t: string, t2 = 0.32) => (
    <text x={x1 + (x2 - x1) * t2} y={y1 + (y2 - y1) * t2 - 5} fontSize={11} fill={C.amber} textAnchor="middle">
      {t}
    </text>
  );
  const names = ["A", "B"];
  return (
    <svg viewBox="0 0 380 200" className="block h-auto w-full max-w-lg" role="img" aria-label="The 2-2-1 network used in the worked example, with its starting weights">
      {[0, 1].map((j) =>
        [0, 1].map((k) => <line key={`${j}${k}`} x1={xs[0]} y1={inY[k]} x2={xs[1]} y2={hidY[j]} stroke={C.grid} strokeWidth={1.5} />),
      )}
      {[0, 1].map((j) => (
        <line key={`o${j}`} x1={xs[1]} y1={hidY[j]} x2={xs[2]} y2={100} stroke={C.grid} strokeWidth={1.5} />
      ))}
      {lbl(xs[0], inY[0], xs[1], hidY[0], `w_A1 = ${ex.W1[0][0]}`, 0.45)}
      {lbl(xs[0], inY[1], xs[1], hidY[0], `w_A2 = ${ex.W1[0][1]}`, 0.2)}
      {lbl(xs[0], inY[0], xs[1], hidY[1], `w_B1 = ${ex.W1[1][0]}`, 0.8)}
      {lbl(xs[0], inY[1], xs[1], hidY[1], `w_B2 = ${ex.W1[1][1]}`, 0.5)}
      {lbl(xs[1], hidY[0], xs[2], 100, `v_A = ${ex.W2[0]}`, 0.5)}
      {lbl(xs[1], hidY[1], xs[2], 100, `v_B = ${ex.W2[1]}`, 0.5)}
      {[0, 1].map((k) => (
        <g key={k}>
          <circle cx={xs[0]} cy={inY[k]} r={24} fill={C.card} stroke={C.sky} strokeWidth={1.5} />
          <text x={xs[0]} y={inY[k] + 4} textAnchor="middle" fontSize={11} fill={C.fg}>
            x{k + 1}={ex.x[k]}
          </text>
        </g>
      ))}
      {[0, 1].map((j) => (
        <g key={j}>
          <circle cx={xs[1]} cy={hidY[j]} r={20} fill={C.card} stroke={C.fg} strokeWidth={1.5} />
          <text x={xs[1]} y={hidY[j] + 4} textAnchor="middle" fontSize={13} fill={C.fg}>
            {names[j]}
          </text>
          <text x={xs[1]} y={hidY[j] + 34} textAnchor="middle" fontSize={10} fill={C.muted}>
            b_{names[j]} = {ex.b1[j]}
          </text>
        </g>
      ))}
      <circle cx={xs[2]} cy={100} r={22} fill={C.card} stroke={C.teal} strokeWidth={1.5} />
      <text x={xs[2]} y={104} textAnchor="middle" fontSize={12} fill={C.fg}>
        p
      </text>
      <text x={xs[2]} y={138} textAnchor="middle" fontSize={10} fill={C.muted}>
        c = {ex.b2}
      </text>
      <text x={xs[0]} y={192} textAnchor="middle" fontSize={10} fill={C.muted}>inputs</text>
      <text x={xs[1]} y={192} textAnchor="middle" fontSize={10} fill={C.muted}>hidden (tanh)</text>
      <text x={xs[2]} y={192} textAnchor="middle" fontSize={10} fill={C.muted}>output (sigmoid)</text>
    </svg>
  );
};

const NeuralNetworkMath: React.FC = () => {
  const ex = React.useMemo(() => workedExample(), []);
  const nudge = React.useMemo(() => nudgeTest("W2_0"), []);
  const [x1, x2] = ex.x;
  const [[wA1, wA2], [wB1, wB2]] = ex.W1;
  const [bA, bB] = ex.b1;
  const [vA, vB] = ex.W2;
  const [zA, zB] = ex.z1;
  const [hA, hB] = ex.h;

  return (
    <section aria-labelledby="nn-math-title" className="space-y-4">
      <SectionTitle id="nn-math-title" kicker="No magic, just arithmetic" title="The maths, step by step">
        <p>
          Here is one complete training step for the smallest interesting network: 2 inputs, 2 hidden neurons (A and B) and 1 output. We
          use one example, x = ({x1}, {x2}), whose correct answer is y = {ex.y}, and a learning rate of η = {ex.lr}. Every number below
          is calculated live by the same code this page trains with.
        </p>
      </SectionTitle>

      <Surface variant="card" radius="2xl" className="flex flex-col items-center gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
        <NetDiagram ex={ex} />
        <div className="space-y-2 text-sm text-muted-foreground sm:max-w-xs">
          <p>
            <span className="font-medium text-foreground">w</span> are the weights into the hidden neurons,{" "}
            <span className="font-medium text-foreground">b</span> their biases, <span className="font-medium text-foreground">v</span> the
            weights into the output and <span className="font-medium text-foreground">c</span> its bias.
          </p>
          <p>These start as small random numbers. Training is the job of nudging them until the output is right.</p>
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            <span className="text-viz-current">● forward pass</span>
            <span className="text-viz-compare">● backward pass</span>
            <span className="text-viz-found">● update</span>
          </p>
        </div>
      </Surface>

      <ol className="space-y-3 p-0">
        <Step n={1} title="Weigh and add" plain="Each hidden neuron multiplies each input by its weight, adds them up, and adds its bias. Call the total z.">
          <Eq lhs="z_A" rule="w_A1·x1 + w_A2·x2 + b_A" nums={`${wA1}·${x1} + ${nb(wA2)}·${x2} + ${bA}`} result={zA} />
          <Eq lhs="z_B" rule="w_B1·x1 + w_B2·x2 + b_B" nums={`${nb(wB1)}·${x1} + ${wB2}·${x2} + ${nb(bB)}`} result={zB} />
        </Step>

        <Step n={2} title="Squash with the activation" plain="Each neuron passes its total through tanh, which bends it into the range −1 to 1. This bend is what lets the network learn curves.">
          <Eq lhs="h_A" rule="tanh(z_A)" nums={`tanh(${n4(zA)})`} result={hA} />
          <Eq lhs="h_B" rule="tanh(z_B)" nums={`tanh(${nc(zB)})`} result={hB} />
        </Step>

        <Step n={3} title="The output neuron gives a probability" plain="The output does the same weigh-and-add with the hidden values, then a sigmoid turns the total into a probability between 0 and 1: how sure it is that the answer is 1.">
          <Eq lhs="z_out" rule="v_A·h_A + v_B·h_B + c" nums={`${vA}·${n4(hA)} + ${nb(vB)}·${nc(hB)} + ${ex.b2}`} result={ex.zOut} />
          <Eq lhs="p" rule="σ(z_out) = 1 / (1 + e^(−z_out))" nums={`1 / (1 + e^(−${n4(ex.zOut)}))`} result={ex.p} />
        </Step>

        <Step
          n={4}
          title="Score the answer: the loss"
          plain={
            <>
              The right answer is {ex.y}, and the network said {(ex.p * 100).toFixed(1)}%. Cross-entropy loss is −log of the probability given
              to the right answer: 0 when the network is certain and right, and it grows without limit when it is confident and wrong.
            </>
          }
        >
          <p className="text-muted-foreground">L = −[ y·ln(p) + (1 − y)·ln(1 − p) ]</p>
          <Eq lhs="L" rule={ex.y === 1 ? "−ln(p)   (because y = 1)" : "−ln(1 − p)   (because y = 0)"} nums={`−ln(${n4(ex.y === 1 ? ex.p : 1 - ex.p)})`} result={ex.loss} accent="hsl(var(--destructive-bright))" />
        </Step>

        <Step
          n={5}
          tone="backward"
          title="Go backwards with the chain rule"
          plain={
            <>
              Now we ask: if we changed z_out a little, how much would the loss change? The chain rule says <em>rates of change multiply</em> along
              a path. (Here L changes by {ex.dLdp.toFixed(2)} for every 1 that p changes, and p changes by {ex.dpdz.toFixed(2)} for every 1 that
              z_out changes, so L changes by {ex.dLdp.toFixed(2)} × {ex.dpdz.toFixed(2)} for every 1 that z_out changes.) The two parts
              simplify to something very neat: p − y.
            </>
          }
        >
          <Eq lhs="∂L/∂p" rule="−y/p + (1 − y)/(1 − p)" nums={`−${ex.y}/${n4(ex.p)} + ${1 - ex.y}/${n4(1 - ex.p)}`} result={ex.dLdp} accent={C.amber} />
          <Eq lhs="∂p/∂z_out" rule="p·(1 − p)   (sigmoid's slope)" nums={`${n4(ex.p)}·${n4(1 - ex.p)}`} result={ex.dpdz} accent={C.amber} />
          <Eq lhs="∂L/∂z_out" rule="∂L/∂p · ∂p/∂z_out = p − y" nums={`${n4(ex.p)} − ${ex.y}`} result={ex.dzOut} accent={C.amber} />
          <p className="pt-1 text-xs text-muted-foreground">
            Negative means “raising z_out would lower the loss”, which makes sense: the answer should be 1 and we said only {n4(ex.p)}.
          </p>
        </Step>

        <Step
          n={6}
          tone="backward"
          title="Blame for the output weights"
          plain="z_out = v_A·h_A + …, so raising v_A by 1 raises z_out by h_A. Multiply that by the blame on z_out from step 5. The bias c adds to z_out directly, so its blame is just p − y."
        >
          <Eq lhs="∂L/∂v_A" rule="(p − y)·h_A" nums={`${nc(ex.dzOut)}·${n4(hA)}`} result={ex.dW2[0]} accent={C.amber} />
          <Eq lhs="∂L/∂v_B" rule="(p − y)·h_B" nums={`${nc(ex.dzOut)}·${nc(hB)}`} result={ex.dW2[1]} accent={C.amber} />
          <Eq lhs="∂L/∂c" rule="p − y" result={ex.db2} accent={C.amber} />
        </Step>

        <Step
          n={7}
          tone="backward"
          title="Pass the blame back into the hidden layer"
          plain="Same idea, one more link at a time. A hidden neuron's output reaches the loss through its output weight v. Then we go back through tanh, whose slope is 1 − tanh², and finally through each input weight, whose effect is the input value x."
        >
          <Eq lhs="∂L/∂h_A" rule="(p − y)·v_A" nums={`${nc(ex.dzOut)}·${vA}`} result={ex.dh[0]} accent={C.amber} />
          <Eq lhs="∂L/∂z_A" rule="∂L/∂h_A · (1 − h_A²)" nums={`${nc(ex.dh[0])}·(1 − ${n4(hA)}²)`} result={ex.dz1[0]} accent={C.amber} />
          <Eq lhs="∂L/∂w_A1" rule="∂L/∂z_A · x1" nums={`${nc(ex.dz1[0])}·${x1}`} result={ex.dW1[0][0]} accent={C.amber} />
          <Eq lhs="∂L/∂w_A2" rule="∂L/∂z_A · x2" nums={`${nc(ex.dz1[0])}·${x2}`} result={ex.dW1[0][1]} accent={C.amber} />
          <Eq lhs="∂L/∂b_A" rule="∂L/∂z_A" result={ex.db1[0]} accent={C.amber} />
          <p className="pt-1 text-xs text-muted-foreground">Neuron B works the same way:</p>
          <Eq lhs="∂L/∂z_B" rule="(p − y)·v_B · (1 − h_B²)" nums={`${nc(ex.dzOut)}·${nb(vB)}·(1 − ${nc(hB)}²)`} result={ex.dz1[1]} accent={C.amber} />
          <Eq lhs="∂L/∂w_B1" rule="∂L/∂z_B · x1" result={ex.dW1[1][0]} accent={C.amber} />
          <Eq lhs="∂L/∂w_B2" rule="∂L/∂z_B · x2" result={ex.dW1[1][1]} accent={C.amber} />
          <Eq lhs="∂L/∂b_B" rule="∂L/∂z_B" result={ex.db1[1]} accent={C.amber} />
        </Step>

        <Step
          n={8}
          tone="update"
          title="Update every weight"
          plain={
            <>
              Each weight takes a small step against its blame: new = old − η × blame, with η = {ex.lr}. A negative blame means the weight
              goes up.
            </>
          }
        >
          <table className="w-full min-w-[26rem] text-left text-[13px]">
            <thead>
              <tr className="text-[11px] text-muted-foreground">
                <th className="pb-1 pr-4 font-medium">Weight</th>
                <th className="pb-1 pr-4 text-right font-medium">Old</th>
                <th className="pb-1 pr-4 text-right font-medium">Blame</th>
                <th className="pb-1 text-right font-medium">New</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {[
                ["w_A1", wA1, ex.dW1[0][0], ex.newW1[0][0]],
                ["w_A2", wA2, ex.dW1[0][1], ex.newW1[0][1]],
                ["b_A", bA, ex.db1[0], ex.newB1[0]],
                ["w_B1", wB1, ex.dW1[1][0], ex.newW1[1][0]],
                ["w_B2", wB2, ex.dW1[1][1], ex.newW1[1][1]],
                ["b_B", bB, ex.db1[1], ex.newB1[1]],
                ["v_A", vA, ex.dW2[0], ex.newW2[0]],
                ["v_B", vB, ex.dW2[1], ex.newW2[1]],
                ["c", ex.b2, ex.db2, ex.newB2],
              ].map(([name, old, g, nw]) => (
                <tr key={name as string}>
                  <td className="pr-4">{name}</td>
                  <td className="pr-4 text-right">{n4(old as number)}</td>
                  <td className="pr-4 text-right text-viz-compare">{n4(g as number)}</td>
                  <td className="text-right text-viz-found">{n4(nw as number)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="pt-2">
            Run the forward pass again with the new weights: p goes from <span className="text-foreground">{n4(ex.p)}</span> to{" "}
            <span className="text-viz-found">{n4(ex.newP)}</span>, and the loss falls from <span className="text-foreground">{n4(ex.loss)}</span>{" "}
            to <span className="text-viz-found">{n4(ex.newLoss)}</span>. The network is a little less wrong. Training repeats this many times.
          </p>
        </Step>

        <Step
          n={9}
          tone="update"
          title="Check it: the nudge test"
          plain="How do we know backprop got the right answer? Nudge one weight up and down by a tiny amount, measure how much the loss changes, and divide. Real libraries use this “gradient check” to test their maths."
        >
          <p>
            Loss with v_A + {nudge.eps}: <span className="text-foreground">{nudge.up.toFixed(8)}</span>
          </p>
          <p>
            Loss with v_A − {nudge.eps}: <span className="text-foreground">{nudge.down.toFixed(8)}</span>
          </p>
          <p>
            (first − second) ÷ {2 * nudge.eps} = <span className="text-viz-found">{nudge.numeric.toFixed(6)}</span>
          </p>
          <p>
            Backprop said ∂L/∂v_A = <span className="text-viz-found">{ex.dW2[0].toFixed(6)}</span>. They match.
          </p>
        </Step>
      </ol>

      <p className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">How the trainer above differs:</span> it does exactly these steps, but for all 120 points at
        once. It averages their blames before each update (full-batch gradient descent), and it can use other activations in the hidden layer,
        in which case step 7 uses that activation's slope instead of 1 − tanh².
      </p>
    </section>
  );
};

export default NeuralNetworkMath;
