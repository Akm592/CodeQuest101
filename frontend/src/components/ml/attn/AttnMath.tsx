// "The maths, step by step" for self-attention: Equation (1) of "Attention Is
// All You Need" on three words, by hand. Numbers come from lib/ml/attentionMath
// (checked by attentionMath.test.ts).

import * as React from "react";

import {
  HAND_WK,
  HAND_WORDS,
  HAND_WQ,
  HAND_WV,
  HAND_X,
  selfAttention,
} from "../../../lib/ml/attentionMath";
import { C } from "../colors";
import { SectionTitle, Step } from "../mathBlocks";
import { MatrixView } from "./MatrixView";

const r = (v: number) => String(+v.toFixed(4));
const FEATS = ["animal", "action", "small"] as const;
const W = HAND_WORDS;

const AttnMath: React.FC = () => {
  const a = React.useMemo(
    () => selfAttention(HAND_X, HAND_WQ, HAND_WK, HAND_WV),
    [],
  );
  const dk = a.K[0].length;
  const rootDk = Math.sqrt(dk);
  const exps = a.scaled[0].map((s) => Math.exp(s));
  const total = exps.reduce((x, y) => x + y, 0);

  return (
    <section aria-labelledby="attn-math-title" className="space-y-4">
      <SectionTitle
        id="attn-math-title"
        kicker="Equation (1), by hand"
        title="The maths, step by step"
      >
        <p>
          The whole of attention is one line from the paper:{" "}
          <span className="font-mono text-foreground">
            Attention(Q, K, V) = softmax(QKᵀ / √d_k) V
          </span>
          . Here it is on three words, “{W.join(" ")}”, with tiny matrices you
          can check with a pencil. The numbers in the weight matrices are chosen
          to be easy, not learned. Every result is calculated by the same code
          the tests check.
        </p>
      </SectionTitle>

      <ol className="space-y-3 p-0">
        <Step
          n={1}
          title="Each word is a row of numbers"
          plain="Stack the words' embeddings into a matrix X: one row per word. These three features have names so you can read them; a real model learns hundreds of unnamed ones (512 in the paper's base model)."
        >
          <MatrixView
            name="X (3 words × 3 features)"
            m={HAND_X}
            rows={W}
            cols={FEATS}
            tone={C.fg}
          />
        </Step>

        <Step
          n={2}
          title="Make Q, K and V with three weight matrices"
          plain="Multiply X by three different matrices. Each one asks a different question of the same word. In a real model these matrices are learned during training."
        >
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <MatrixView name="W_Q" m={HAND_WQ} rows={FEATS} tone={C.violet} />
            <MatrixView name="W_K" m={HAND_WK} rows={FEATS} tone={C.sky} />
            <MatrixView name="W_V" m={HAND_WV} rows={FEATS} tone={C.amber} />
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2">
            <MatrixView name="Q = X · W_Q" m={a.Q} rows={W} tone={C.violet} />
            <MatrixView name="K = X · W_K" m={a.K} rows={W} tone={C.sky} />
            <MatrixView name="V = X · W_V" m={a.V} rows={W} tone={C.amber} />
          </div>
          <p className="whitespace-normal pt-2 text-muted-foreground">
            One row worked out: “chase” is [0, 1, 0], so its query is 0 × (row
            1) + 1 × (row 2) + 0 × (row 3) of W_Q = [{a.Q[1].join(", ")}]. Its
            query points at column 1 of the keys, the “I'm an animal” column: an
            action looks for who's involved.
          </p>
        </Step>

        <Step
          n={3}
          title="Score every query against every key: QKᵀ"
          plain="Row i, column j is query i · key j: multiply matching numbers and add. A big score means word j has what word i is looking for."
        >
          <MatrixView
            name="QKᵀ (rows: who looks, columns: who is looked at)"
            m={a.scores}
            rows={W}
            cols={W}
            tone={C.teal}
          />
          <p className="whitespace-normal pt-2 text-muted-foreground">
            For example, cats → chase = q_cats · k_chase = {a.Q[0][0]} ×{" "}
            {a.K[1][0]} + {a.Q[0][1]} × {a.K[1][1]} = {r(a.scores[0][1])}.
            Notice the matrix isn't symmetric in general: what cats looks for
            and what chase looks for are different questions.
          </p>
        </Step>

        <Step
          n={4}
          title={`Divide by √d_k = √${dk}`}
          plain={`d_k is the length of each key (here ${dk}). Dividing keeps the scores in a range where softmax still spreads attention. The section below shows why this matters when d_k is large.`}
        >
          <MatrixView
            name={`QKᵀ ÷ √${dk} (√${dk} ≈ ${r(rootDk)})`}
            m={a.scaled}
            rows={W}
            cols={W}
            tone={C.teal}
          />
        </Step>

        <Step
          n={5}
          tone="backward"
          title="Softmax each row"
          plain="Turn each row into shares that are all positive and add up to 1: raise e to each number, then divide by the row's total. These are the attention weights."
        >
          <p>
            row “cats”: e^{r(a.scaled[0][0])} = {r(exps[0])}, e^
            {r(a.scaled[0][1])} = {r(exps[1])}, e^{r(a.scaled[0][2])} ={" "}
            {r(exps[2])}
          </p>
          <p>
            total = {r(total)}, so weights ={" "}
            {exps.map((e) => `${r(e)} ÷ ${r(total)}`).join(", ")} = [
            {a.weights[0].map(r).join(", ")}]
          </p>
          <div className="pt-2">
            <MatrixView
              name="softmax(QKᵀ ÷ √d_k): the attention weights"
              m={a.weights}
              rows={W}
              cols={W}
              tone={C.green}
              heat
            />
          </div>
          <p className="whitespace-normal pt-2 text-muted-foreground">
            “cats” gives {Math.round(a.weights[0][1] * 100)}% of its attention
            to “chase”, but “chase” gives only{" "}
            {Math.round(a.weights[1][0] * 100)}% back to “cats” (it splits
            between cats and mice). Separate queries and keys are what let
            attention be one-sided like this.
          </p>
        </Step>

        <Step
          n={6}
          tone="update"
          title="Blend the values: weights × V"
          plain="Each word's output is the value rows mixed by its weights. That's the word's new vector, now carrying information from the words it attended to."
        >
          <p>
            out_cats ={" "}
            {a.weights[0]
              .map((w, j) => `${r(w)} × [${a.V[j].join(", ")}]`)
              .join(" + ")}
          </p>
          <p>= [{a.out[0].map(r).join(", ")}]</p>
          <div className="pt-2">
            <MatrixView
              name="Output = weights · V"
              m={a.out}
              rows={W}
              tone={C.green}
            />
          </div>
          <p className="whitespace-normal pt-2 text-muted-foreground">
            That's Equation (1), done. Every word is handled at once with matrix
            multiplication, instead of one word after another as in recurrent
            networks. That's why the paper calls the Transformer “more
            parallelizable” and quick to train.
          </p>
        </Step>
      </ol>
    </section>
  );
};

export default AttnMath;
