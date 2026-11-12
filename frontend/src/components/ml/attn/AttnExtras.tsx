// The rest of the paper's attention story: the decoder's mask, multi-head
// attention, why word order needs positional encoding, the cost, and the
// citation. Claims are checked by attentionMath.test.ts.

import * as React from "react";

import { tokenize, WQ, D, SENTENCES } from "../../../lib/ml/attention";
import {
  positionalEncoding,
  selfAttention,
} from "../../../lib/ml/attentionMath";
import { cn } from "../../../lib/utils";
import { Surface } from "../../ui/surface";
import { C } from "../colors";
import { SectionTitle } from "../mathBlocks";
import { Arrowhead } from "../shared";

const IDENTITY = Array.from({ length: D }, (_, i) =>
  Array.from({ length: D }, (_, j) => (i === j ? 1 : 0)),
);

const toyAttention = (sentence: string, causal = false) => {
  const tokens = tokenize(sentence);
  return {
    tokens,
    ...selfAttention(
      tokens.map((t) => t.embedding),
      WQ,
      IDENTITY,
      IDENTITY,
      causal,
    ),
  };
};

// ---------------------------------------------------------------------------

const Heat: React.FC<{ words: string[]; m: number[][]; masked?: boolean }> = ({
  words,
  m,
  masked,
}) => (
  <div className="overflow-x-auto">
    <table className="border-separate border-spacing-0.5 font-mono text-[10px]">
      <thead>
        <tr>
          <th />
          {words.map((w, j) => (
            <th
              key={j}
              className="h-14 w-7 align-bottom font-sans font-normal text-muted-foreground"
            >
              <span className="inline-block origin-bottom-left translate-x-3 -rotate-45 whitespace-nowrap">
                {w}
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {m.map((r, i) => (
          <tr key={i}>
            <th className="pr-1.5 text-right font-sans font-normal text-muted-foreground">
              {words[i]}
            </th>
            {r.map((w, j) => {
              const hidden = masked && j > i;
              return (
                <td
                  key={j}
                  title={
                    hidden
                      ? `${words[i]} can't see ${words[j]}`
                      : `${words[i]} → ${words[j]}: ${Math.round(w * 100)}%`
                  }
                  className="h-7 w-7 rounded-sm text-center text-foreground/80"
                  style={{
                    background: hidden
                      ? "transparent"
                      : `color-mix(in srgb, ${C.green} ${Math.min(100, Math.round(w * 160))}%, hsl(var(--muted)))`,
                    border: hidden
                      ? "1px dashed hsl(var(--border))"
                      : undefined,
                  }}
                >
                  {hidden ? "" : Math.round(w * 100)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const MaskDemo: React.FC = () => {
  const [causal, setCausal] = React.useState(true);
  const a = React.useMemo(() => toyAttention(SENTENCES[0], causal), [causal]);
  const words = a.tokens.map((t) => t.word);
  const it = words.indexOf("it");
  return (
    <section aria-labelledby="attn-mask-title" className="space-y-4">
      <SectionTitle
        id="attn-mask-title"
        kicker="No peeking"
        title="Masking: hiding the future"
      >
        <p>
          A model that writes text one word at a time (the paper's decoder, and
          chat models like GPT and Claude) mustn't see words that haven't been
          written yet. The paper does this inside the attention formula by
          “masking out (setting to −∞) all values in the input of the softmax
          which correspond to illegal connections”. Since e^−∞ = 0, those words
          get exactly 0% attention.
        </p>
      </SectionTitle>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <Surface variant="card" radius="2xl" className="min-w-0 p-4">
          <p className="mb-2 text-xs text-muted-foreground">
            Attention weights (%) for the toy sentence. Row = the word looking,
            column = the word looked at.
          </p>
          <Heat words={words} m={a.weights} masked={causal} />
        </Surface>
        <Surface
          variant="card"
          radius="2xl"
          className="flex flex-col gap-3 p-4"
        >
          <div
            role="radiogroup"
            aria-label="Mask"
            className="glass-pill inline-flex gap-1 !rounded-[1.4rem] p-1"
          >
            {[
              { v: true, l: "Masked (decoder)" },
              { v: false, l: "Unmasked" },
            ].map((o) => (
              <button
                key={o.l}
                type="button"
                role="radio"
                aria-checked={causal === o.v}
                onClick={() => setCausal(o.v)}
                className={cn(
                  "min-h-9 rounded-full px-3.5 text-sm transition-colors",
                  causal === o.v
                    ? "bg-white/[0.14] font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {o.l}
              </button>
            ))}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {causal
              ? `Everything above the diagonal is hidden: each word sees only itself and the words before it. “it” can still find “cat” (${Math.round(a.weights[it][1] * 100)}%), because the cat came earlier, but “the” at the start can only look at itself.`
              : "Without the mask every word sees the whole sentence, including words after it. That's what the encoder does (and models like BERT)."}
          </p>
        </Surface>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------

const HeadsFigure: React.FC = () => {
  const heads = 8;
  return (
    <svg
      viewBox="0 0 520 190"
      className="mx-auto block h-auto w-full max-w-2xl"
      role="img"
      aria-label="512 numbers per word split into 8 heads of 64, each runs attention, then they're joined and mixed by W_O"
    >
      <defs>
        <Arrowhead id="mh-a" color={C.muted} />
      </defs>
      <rect
        x={6}
        y={70}
        width={84}
        height={50}
        rx={10}
        fill={C.card}
        stroke={C.fg}
        strokeOpacity={0.5}
      />
      <text x={48} y={91} textAnchor="middle" fontSize={11} fill={C.fg}>
        each word
      </text>
      <text x={48} y={107} textAnchor="middle" fontSize={10} fill={C.muted}>
        512 numbers
      </text>
      {Array.from({ length: heads }, (_, h) => {
        const y = 10 + h * 22;
        return (
          <g key={h}>
            <path
              d={`M90,95 C120,95 120,${y + 9} 150,${y + 9}`}
              fill="none"
              stroke={C.muted}
              strokeOpacity={0.6}
            />
            <rect
              x={150}
              y={y}
              width={170}
              height={18}
              rx={5}
              fill={C.card}
              stroke={h === 0 ? C.violet : h === 1 ? C.sky : C.grid}
            />
            <text
              x={235}
              y={y + 13}
              textAnchor="middle"
              fontSize={9.5}
              fill={C.fg}
            >
              head {h + 1}: own W_Q, W_K, W_V → 64
            </text>
            <path
              d={`M320,${y + 9} C345,${y + 9} 345,95 370,95`}
              fill="none"
              stroke={C.muted}
              strokeOpacity={0.6}
            />
          </g>
        );
      })}
      <rect
        x={370}
        y={70}
        width={66}
        height={50}
        rx={10}
        fill={C.card}
        stroke={C.amber}
      />
      <text x={403} y={91} textAnchor="middle" fontSize={10} fill={C.amber}>
        concat
      </text>
      <text x={403} y={107} textAnchor="middle" fontSize={10} fill={C.muted}>
        8 × 64
      </text>
      <path d="M436,95 L452,95" stroke={C.muted} markerEnd="url(#mh-a)" />
      <rect
        x={456}
        y={70}
        width={58}
        height={50}
        rx={10}
        fill={C.card}
        stroke={C.green}
      />
      <text x={485} y={91} textAnchor="middle" fontSize={10} fill={C.green}>
        × W_O
      </text>
      <text x={485} y={107} textAnchor="middle" fontSize={10} fill={C.muted}>
        512
      </text>
    </svg>
  );
};

const MultiHead: React.FC = () => (
  <section aria-labelledby="attn-heads-title" className="space-y-4">
    <SectionTitle
      id="attn-heads-title"
      kicker="Section 3.2.2"
      title="Multi-head attention: several lookups at once"
    >
      <p>
        One attention lookup blends everything into a single average, so a word
        can't easily look for two different things (say, its subject and its
        object) at the same time. The paper's fix is to run several attention
        “heads” side by side, each with its own W_Q, W_K and W_V.
      </p>
    </SectionTitle>
    <Surface variant="card" radius="2xl" className="space-y-4 p-4 sm:p-5">
      <HeadsFigure />
      <div className="space-y-1.5 overflow-x-auto rounded-xl border border-white/[0.06] bg-black/25 p-3 font-mono text-[13px] leading-relaxed text-foreground/90">
        <p className="whitespace-nowrap">
          head_i = Attention(Q·W_i^Q, K·W_i^K, V·W_i^V)
        </p>
        <p className="whitespace-nowrap">
          MultiHead(Q, K, V) = Concat(head_1, …, head_h) · W^O
        </p>
        <p className="whitespace-nowrap text-muted-foreground">
          h = 8, d_model = 512, d_k = d_v = d_model / h = 64
        </p>
      </div>
      <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
        <li>
          In the paper's words, multiple heads let the model “jointly attend to
          information from different representation subspaces at different
          positions. With a single attention head, averaging inhibits this.”
        </li>
        <li>
          Each head works with 64 numbers instead of 512, so 8 heads cost about
          the same as one full-size head.
        </li>
        <li>
          The paper tested this (Table 3): a single head was 0.9 BLEU worse than
          the best setting, but quality also dropped with too many heads. More
          isn't always better.
        </li>
      </ul>
    </Surface>
  </section>
);

// ---------------------------------------------------------------------------

const PeFigure: React.FC = () => {
  const positions = 24;
  const dims = 32;
  const cw = 480 / dims;
  const ch = 6;
  return (
    <svg
      viewBox={`0 0 500 ${positions * ch + 30}`}
      className="block h-auto w-full"
      role="img"
      aria-label="Positional encoding: each row is a position, each column a dimension; early columns wave fast, later ones slowly"
    >
      {Array.from({ length: positions }, (_, p) =>
        positionalEncoding(p, dims).map((v, j) => (
          <rect
            key={`${p}-${j}`}
            x={16 + j * cw}
            y={4 + p * ch}
            width={cw - 0.5}
            height={ch - 0.5}
            fill={v >= 0 ? C.teal : C.violet}
            opacity={0.15 + Math.abs(v) * 0.85}
          />
        )),
      )}
      <text x={12} y={10} textAnchor="end" fontSize={8} fill={C.muted}>
        0
      </text>
      <text
        x={12}
        y={4 + positions * ch}
        textAnchor="end"
        fontSize={8}
        fill={C.muted}
      >
        {positions - 1}
      </text>
      <text x={16} y={positions * ch + 22} fontSize={9} fill={C.muted}>
        dimension 0 (fast wave)
      </text>
      <text
        x={496}
        y={positions * ch + 22}
        textAnchor="end"
        fontSize={9}
        fill={C.muted}
      >
        dimension {dims - 1} (slow wave)
      </text>
    </svg>
  );
};

const OrderDemo: React.FC = () => {
  const s1 = "maya chased the dog";
  const s2 = "the dog chased maya";
  const a1 = React.useMemo(() => toyAttention(s1), []);
  const a2 = React.useMemo(() => toyAttention(s2), []);
  const i1 = a1.tokens.findIndex((t) => t.word === "chased");
  const i2 = a2.tokens.findIndex((t) => t.word === "chased");
  const v = (xs: number[]) => `[${xs.map((x) => x.toFixed(2)).join(", ")}]`;
  return (
    <section aria-labelledby="attn-order-title" className="space-y-4">
      <SectionTitle
        id="attn-order-title"
        kicker="Section 3.5"
        title="Attention can't see word order, so we add it"
      >
        <p>
          Attention only compares vectors; nothing in Equation (1) knows which
          word came first. Shuffle the words and each word's output is exactly
          the same. The paper: “Since our model contains no recurrence and no
          convolution, in order for the model to make use of the order of the
          sequence, we must inject some information about the relative or
          absolute position of the tokens”.
        </p>
      </SectionTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <Surface variant="card" radius="2xl" className="min-w-0 space-y-3 p-4">
          <h3 className="font-semibold text-foreground">
            Same words, opposite meaning, same answer
          </h3>
          <div className="space-y-1.5 overflow-x-auto rounded-xl border border-white/[0.06] bg-black/25 p-3 font-mono text-[12px] leading-relaxed text-foreground/90">
            <p className="whitespace-nowrap">
              “{s1}”: chased → {v(a1.out[i1])}
            </p>
            <p className="whitespace-nowrap">
              “{s2}”: chased → {v(a2.out[i2])}
            </p>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Using this page's toy model, “chased” comes out identical in both
            sentences, even though who chased whom is reversed. Without position
            information, attention treats a sentence as a bag of words.
          </p>
        </Surface>
        <Surface variant="card" radius="2xl" className="min-w-0 space-y-3 p-4">
          <h3 className="font-semibold text-foreground">
            The paper's fix: add a wave pattern for each position
          </h3>
          <div className="space-y-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-black/25 p-3 font-mono text-[12px] leading-relaxed text-foreground/90">
            <p className="whitespace-nowrap">
              PE(pos, 2i) = sin(pos / 10000^(2i / d_model))
            </p>
            <p className="whitespace-nowrap">
              PE(pos, 2i+1) = cos(pos / 10000^(2i / d_model))
            </p>
          </div>
          <PeFigure />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Each position gets its own pattern of sines and cosines (rows above,
            d_model = 32 to fit), added to the word's embedding before
            attention. The authors also tried learned position vectors and got
            “nearly identical results”; they chose the waves because they “may
            allow the model to extrapolate to sequence lengths longer than the
            ones encountered during training”.
          </p>
        </Surface>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------

const Cost: React.FC = () => (
  <section aria-labelledby="attn-cost-title" className="space-y-4">
    <SectionTitle
      id="attn-cost-title"
      kicker="Section 4, Table 1"
      title="What it costs, and why it won"
    >
      <p>
        n is the number of words and d the vector size. Self-attention compares
        every word with every word, so its work grows with n². In exchange,
        every word reaches every other word in one step, and nothing has to wait
        for the previous word.
      </p>
    </SectionTitle>
    <Surface variant="card" radius="2xl" className="overflow-x-auto p-4">
      <table className="w-full min-w-[34rem] text-left text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr>
            <th className="pb-2 pr-4 font-medium">Layer type</th>
            <th className="pb-2 pr-4 font-medium">Work per layer</th>
            <th className="pb-2 pr-4 font-medium">
              Steps that must wait in line
            </th>
            <th className="pb-2 font-medium">Longest path between two words</th>
          </tr>
        </thead>
        <tbody className="font-mono text-muted-foreground [&_td]:py-1.5 [&_td]:pr-4">
          <tr className="text-foreground">
            <td className="font-sans">Self-attention</td>
            <td>O(n² · d)</td>
            <td>O(1)</td>
            <td>O(1)</td>
          </tr>
          <tr>
            <td className="font-sans">Recurrent (RNN)</td>
            <td>O(n · d²)</td>
            <td>O(n)</td>
            <td>O(n)</td>
          </tr>
          <tr>
            <td className="font-sans">Convolutional</td>
            <td>O(k · n · d²)</td>
            <td>O(1)</td>
            <td>O(log_k n)</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        The paper notes self-attention is cheaper than a recurrent layer when n
        is smaller than d, which was usual for sentences in translation. For
        very long texts the n² term dominates, which is why long context windows
        are expensive.
      </p>
    </Surface>
  </section>
);

// ---------------------------------------------------------------------------

const Uses: React.FC = () => (
  <section aria-labelledby="attn-uses-title" className="space-y-4">
    <SectionTitle
      id="attn-uses-title"
      kicker="Section 3.2.3"
      title="Three places attention appears in the Transformer"
    />
    <div className="grid gap-3 md:grid-cols-3">
      {[
        {
          t: "Encoder self-attention",
          d: "Q, K and V all come from the input sentence. Every word can look at every other word (no mask).",
        },
        {
          t: "Decoder self-attention",
          d: "Q, K and V come from the output written so far, with the mask, so each word sees itself and earlier words.",
        },
        {
          t: "Encoder–decoder attention",
          d: "Queries come from the decoder; keys and values come from the encoder's output. This is how the translation looks back at the source sentence. It's attention, but not self-attention.",
        },
      ].map((u) => (
        <Surface
          key={u.t}
          variant="card"
          radius="2xl"
          className="space-y-2 p-4"
        >
          <h3 className="font-semibold text-foreground">{u.t}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{u.d}</p>
        </Surface>
      ))}
    </div>
  </section>
);

const Citation: React.FC = () => (
  <section aria-labelledby="attn-cite-title" className="space-y-4">
    <SectionTitle
      id="attn-cite-title"
      kicker="Read the original"
      title="The paper"
    />
    <Surface variant="card" radius="2xl" className="space-y-3 p-4 sm:p-5">
      <p className="text-sm leading-relaxed text-foreground">
        Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones,
        Aidan N. Gomez, Łukasz Kaiser and Illia Polosukhin.{" "}
        <span className="font-semibold">“Attention Is All You Need.”</span>{" "}
        Advances in Neural Information Processing Systems 30 (NIPS 2017), pages
        5998–6008.
      </p>
      <p className="text-sm leading-relaxed text-muted-foreground">
        It introduced the Transformer, a translation model built from attention
        alone, with no recurrence or convolution. Its big model scored 28.4 BLEU
        on WMT 2014 English-to-German translation, beating previous results
        including ensembles by over 2 BLEU, after 3.5 days of training on 8
        NVIDIA P100 GPUs. The same building block now sits inside GPT, Claude,
        BERT and vision transformers.
      </p>
      <div className="flex flex-wrap gap-2 text-sm">
        <a
          className="glass-pill glass-hover px-3.5 py-1.5 text-foreground"
          href="https://arxiv.org/abs/1706.03762"
          target="_blank"
          rel="noreferrer"
        >
          arXiv:1706.03762
        </a>
        <a
          className="glass-pill glass-hover px-3.5 py-1.5 text-foreground"
          href="https://papers.nips.cc/paper/2017/hash/3f5ee243547dee91fbd053c1c4a845aa-Abstract.html"
          target="_blank"
          rel="noreferrer"
        >
          NeurIPS proceedings
        </a>
      </div>
      <p className="text-xs text-muted-foreground">
        Sections used on this page: 3.2 (attention), 3.2.1 (Equation 1 and the
        √d_k footnote), 3.2.2 (multi-head), 3.2.3 (masking and the three uses),
        3.5 (positional encoding), 4 (Table 1), 6.2 (Table 3).
      </p>
    </Surface>
  </section>
);

const AttnExtras: React.FC = () => (
  <>
    <MaskDemo />
    <MultiHead />
    <OrderDemo />
    <Uses />
    <Cost />
    <Citation />
  </>
);

export default AttnExtras;
