// "Q, K and V in plain words": what each of the three vectors is for, why a
// word needs all three, and their real sizes in the paper.

import * as React from "react";

import {
  HAND_WK,
  HAND_WQ,
  HAND_WV,
  HAND_X,
  selfAttention,
} from "../../../lib/ml/attentionMath";
import { Surface } from "../../ui/surface";
import { C } from "../colors";
import { SectionTitle } from "../mathBlocks";
import { Arrowhead } from "../shared";

/** One embedding becomes three vectors through three learned matrices. */
const SplitFigure: React.FC = () => (
  <svg
    viewBox="0 0 360 170"
    className="block h-auto w-full max-w-md"
    role="img"
    aria-label="A word's embedding multiplied by three matrices, giving a query, a key and a value"
  >
    <defs>
      {[C.violet, C.sky, C.amber].map((c, i) => (
        <Arrowhead key={i} id={`qkv-a${i}`} color={c} />
      ))}
    </defs>
    <rect
      x={8}
      y={62}
      width={92}
      height={46}
      rx={10}
      fill={C.card}
      stroke={C.fg}
      strokeOpacity={0.5}
    />
    <text x={54} y={81} textAnchor="middle" fontSize={11} fill={C.fg}>
      embedding x
    </text>
    <text x={54} y={98} textAnchor="middle" fontSize={10} fill={C.muted}>
      the word itself
    </text>
    {[
      {
        y: 22,
        c: C.violet,
        m: "× W_Q",
        t: "query q",
        s: "what am I looking for?",
      },
      { y: 85, c: C.sky, m: "× W_K", t: "key k", s: "what can I be found by?" },
      {
        y: 148,
        c: C.amber,
        m: "× W_V",
        t: "value v",
        s: "what do I hand over?",
      },
    ].map((r, i) => (
      <g key={i}>
        <path
          d={`M100,85 C140,85 140,${r.y} 196,${r.y}`}
          fill="none"
          stroke={r.c}
          strokeWidth={1.8}
          markerEnd={`url(#qkv-a${i})`}
        />
        <text
          x={150}
          y={r.y + (i === 1 ? -6 : i === 0 ? -6 : 14)}
          textAnchor="middle"
          fontSize={10}
          fill={r.c}
        >
          {r.m}
        </text>
        <rect
          x={200}
          y={r.y - 17}
          width={152}
          height={34}
          rx={9}
          fill={C.card}
          stroke={r.c}
        />
        <text x={276} y={r.y - 3} textAnchor="middle" fontSize={11} fill={r.c}>
          {r.t}
        </text>
        <text
          x={276}
          y={r.y + 11}
          textAnchor="middle"
          fontSize={10}
          fill={C.fg}
        >
          {r.s}
        </text>
      </g>
    ))}
  </svg>
);

const QkvExplain: React.FC = () => {
  const a = React.useMemo(
    () => selfAttention(HAND_X, HAND_WQ, HAND_WK, HAND_WV),
    [],
  );
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  return (
    <section aria-labelledby="attn-qkv-title" className="space-y-4">
      <SectionTitle
        id="attn-qkv-title"
        kicker="The three roles"
        title="Query, key and value in plain words"
      >
        <p>
          The paper defines attention as “mapping a query and a set of key-value
          pairs to an output”, where the output is a weighted sum of the values.
          In self-attention, every word plays all three parts at once.
        </p>
      </SectionTitle>

      <div className="grid gap-4 lg:grid-cols-2">
        <Surface variant="card" radius="2xl" className="min-w-0 space-y-3 p-4">
          <h3 className="font-semibold text-foreground">
            Think of a library search
          </h3>
          <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>
              <span className="font-semibold" style={{ color: C.violet }}>
                Query
              </span>
              : what you type into the search box. For a word, it describes what
              information would help it. “it” looks for the thing it refers to.
            </li>
            <li>
              <span className="font-semibold" style={{ color: C.sky }}>
                Key
              </span>
              : the label on each book's spine that your search is matched
              against. For a word, it advertises what the word is: “I'm an
              animal”, “I'm a verb”.
            </li>
            <li>
              <span className="font-semibold" style={{ color: C.amber }}>
                Value
              </span>
              : what's inside the book, the thing you actually take away. For a
              word, it's the information it passes on to whoever attends to it.
            </li>
          </ul>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The twist: you don't take one book. You take a little from every
            book, more from the ones whose labels match your search best. That
            “soft” lookup is what softmax does.
          </p>
        </Surface>
        <Surface
          variant="card"
          radius="2xl"
          className="grid place-items-center p-4"
        >
          <SplitFigure />
          <p className="mt-2 text-xs text-muted-foreground">
            Three different learned matrices turn the same word into three
            different vectors.
          </p>
        </Surface>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Surface variant="card" radius="2xl" className="space-y-2 p-4">
          <h3 className="font-semibold text-foreground">Why not one vector?</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Looking and being found are different jobs. In the worked example
            below, “cats” gives {pct(a.weights[0][1])} of its attention to
            “chase”, but “chase” gives only {pct(a.weights[1][0])} back. If
            query and key were the same vector, the score from cats to chase
            would always equal the score from chase to cats.
          </p>
        </Surface>
        <Surface variant="card" radius="2xl" className="space-y-2 p-4">
          <h3 className="font-semibold text-foreground">
            Why is the value separate?
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            What a word is matched on doesn't have to be what it hands over. In
            the example, keys ignore the “small” feature, but values carry it,
            so “mice” can pass on “small” to “chase” even though size played no
            part in the match.
          </p>
        </Surface>
        <Surface variant="card" radius="2xl" className="space-y-2 p-4">
          <h3 className="font-semibold text-foreground">Real sizes</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            In the paper's base model each word is a vector of d_model = 512
            numbers. Each attention head projects it down to a query and key of
            d_k = 64 and a value of d_v = 64. The matrices W_Q, W_K, W_V start
            random and are learned during training; nobody sets them by hand.
          </p>
        </Surface>
      </div>
    </section>
  );
};

export default QkvExplain;
