import { motion, useReducedMotion } from "framer-motion";

import { C } from "../colors";
import { Arrowhead, Art, type ConceptFigure } from "../shared";

const FINGERPRINT_ROWS = [
  [0.85, 0.25, 0.65, 0.4, 0.9, 0.3],
  [0.35, 0.8, 0.5, 0.75, 0.3, 0.6],
  [0.6, 0.45, 0.9, 0.25, 0.55, 0.8],
];

const BAND_COLORS = [C.violet, C.teal, C.sky];

function PrepareFigure() {
  const reduced = useReducedMotion();
  return (
    <Art label="A handbook becomes three passages, each stored beside a vector of numbers">
      <Arrowhead id="rag-prepare-arrow" color={C.teal} />
      {/* Handbook with color-coded sentence bands */}
      <rect x={10} y={24} width={60} height={98} rx={8} fill={C.card} stroke={C.violet} strokeWidth={1.2} />
      <text x={40} y={42} textAnchor="middle" fontSize={9.5} fontWeight={600} fill={C.fg}>
        Handbook
      </text>
      {[52, 64, 76, 88, 100, 110].map((y, i) => (
        <rect
          key={y}
          x={18}
          y={y}
          width={44}
          height={5}
          rx={2.5}
          fill={BAND_COLORS[Math.floor(i / 2)]}
          fillOpacity={0.55}
        />
      ))}

      {/* Animated split & embed flow paths */}
      {[38, 74, 110].map((targetY, i) => (
        <motion.path
          key={targetY}
          d={`M72 ${58 + i * 16} C90 ${58 + i * 16}, 90 ${targetY}, 105 ${targetY}`}
          fill="none"
          stroke={BAND_COLORS[i]}
          strokeWidth={1.4}
          strokeDasharray="3 3"
          markerEnd="url(#rag-prepare-arrow)"
          animate={reduced ? undefined : { strokeDashoffset: [12, 0] }}
          transition={reduced ? undefined : { duration: 1.8, repeat: Infinity, ease: "linear", delay: i * 0.25 }}
        />
      ))}

      {/* Overlapping passage cards + vector fingerprints */}
      {[23, 59, 95].map((y, i) => (
        <motion.g
          key={y}
          initial={reduced ? undefined : { opacity: 0.75 }}
          animate={reduced ? undefined : { opacity: [0.75, 1, 0.75] }}
          transition={reduced ? undefined : { duration: 2.6, repeat: Infinity, delay: i * 0.35 }}
        >
          <rect x={110} y={y} width={66} height={28} rx={6} fill={C.card} stroke={BAND_COLORS[i]} strokeWidth={1.2} />
          <text x={143} y={y + 13} textAnchor="middle" fontSize={9} fontWeight={600} fill={C.fg}>
            Passage {i + 1}
          </text>
          <text x={143} y={y + 23} textAnchor="middle" fontSize={7.5} fill={C.muted}>
            {i > 0 ? "↺ overlap" : "chunk"}
          </text>
          {/* Vector fingerprint bars */}
          <rect x={182} y={y + 4} width={48} height={20} rx={4} fill={C.card} stroke={C.grid} />
          {FINGERPRINT_ROWS[i].map((v, j) => (
            <rect
              key={j}
              x={186 + j * 7}
              y={y + 20 - v * 12}
              width={4.5}
              height={v * 12}
              rx={1.5}
              fill={BAND_COLORS[i]}
              fillOpacity={0.35 + v * 0.6}
            />
          ))}
        </motion.g>
      ))}
    </Art>
  );
}

function SearchFigure() {
  const reduced = useReducedMotion();
  const candidates = [
    { x: 162, y: 34, score: "0.84", selected: true },
    { x: 170, y: 76, score: "0.71", selected: true },
    { x: 196, y: 120, score: "0.18", selected: false },
  ];

  return (
    <Art label="A question is compared with stored passages; the closest two passages are selected">
      <Arrowhead id="rag-search-arrow" color={C.teal} />
      {/* Similarity rings */}
      <circle cx={60} cy={75} r={44} fill="none" stroke={C.grid} strokeDasharray="3 3" opacity={0.7} />
      <circle cx={60} cy={75} r={74} fill="none" stroke={C.teal} strokeOpacity={0.3} strokeDasharray="4 3" />

      {/* Pulsing query radar */}
      {!reduced && (
        <motion.circle
          cx={56}
          cy={75}
          r={22}
          fill="none"
          stroke={C.sky}
          strokeWidth={1.2}
          animate={{ r: [20, 62], opacity: [0.55, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
        />
      )}

      {/* Query node */}
      <rect x={12} y={55} width={84} height={38} rx={9} fill={C.card} stroke={C.sky} strokeWidth={1.5} />
      <text x={54} y={72} textAnchor="middle" fontSize={9.5} fontWeight={600} fill={C.fg}>
        Your question
      </text>
      <text x={54} y={85} textAnchor="middle" fontSize={8} fill={C.sky}>
        query vector
      </text>

      {/* Similarity beams & passage nodes */}
      {candidates.map((c, i) => (
        <g key={c.y}>
          <motion.path
            d={`M98 74 Q${(98 + c.x) / 2} ${74 + (c.y - 74) * 0.35} ${c.x - 4} ${c.y}`}
            fill="none"
            stroke={c.selected ? C.teal : C.grid}
            strokeWidth={c.selected ? 1.8 : 1}
            strokeDasharray={c.selected ? "none" : "3 3"}
            markerEnd={c.selected ? "url(#rag-search-arrow)" : undefined}
            animate={reduced || !c.selected ? undefined : { opacity: [0.45, 1, 0.45] }}
            transition={reduced ? undefined : { duration: 1.8, repeat: Infinity, delay: i * 0.3 }}
          />
          <rect
            x={c.x}
            y={c.y - 14}
            width={c.selected ? 68 : 38}
            height={28}
            rx={6}
            fill={C.card}
            stroke={c.selected ? C.teal : C.grid}
            strokeOpacity={c.selected ? 1 : 0.6}
          />
          <text
            x={c.x + (c.selected ? 34 : 19)}
            y={c.y - 1}
            textAnchor="middle"
            fontSize={8.5}
            fontWeight={c.selected ? 600 : 400}
            fill={c.selected ? C.teal : C.muted}
          >
            {c.selected ? `✓ ${c.score}` : c.score}
          </text>
          <text x={c.x + (c.selected ? 34 : 19)} y={c.y + 9} textAnchor="middle" fontSize={7.5} fill={C.muted}>
            {c.selected ? "Retrieved" : "Out"}
          </text>
        </g>
      ))}
    </Art>
  );
}

function AnswerFigure() {
  const reduced = useReducedMotion();
  return (
    <Art label="The question and retrieved passages enter a language model, producing an answer with source citations">
      <Arrowhead id="rag-answer-arrow" color={C.violet} />
      <Arrowhead id="rag-answer-out" color={C.green} />

      {/* Inputs: Question & Passages */}
      <rect x={10} y={18} width={84} height={32} rx={7} fill={C.card} stroke={C.sky} strokeWidth={1.3} />
      <text x={52} y={38} textAnchor="middle" fontSize={9.5} fill={C.fg}>
        Question
      </text>

      <rect x={10} y={64} width={84} height={34} rx={7} fill={C.card} stroke={C.teal} strokeWidth={1.3} />
      <text x={52} y={79} textAnchor="middle" fontSize={9} fill={C.fg}>
        Passages
      </text>
      <text x={52} y={91} textAnchor="middle" fontSize={8.5} fontWeight={600} fill={C.teal}>
        [1]  [2]
      </text>

      {/* Converging animated paths into LLM */}
      <motion.path
        d="M96 34 C112 34, 110 56, 127 56"
        fill="none"
        stroke={C.sky}
        strokeWidth={1.4}
        strokeDasharray="3 3"
        markerEnd="url(#rag-answer-arrow)"
        animate={reduced ? undefined : { strokeDashoffset: [12, 0] }}
        transition={reduced ? undefined : { duration: 1.6, repeat: Infinity, ease: "linear" }}
      />
      <motion.path
        d="M96 81 C112 81, 110 62, 127 62"
        fill="none"
        stroke={C.teal}
        strokeWidth={1.4}
        strokeDasharray="3 3"
        markerEnd="url(#rag-answer-arrow)"
        animate={reduced ? undefined : { strokeDashoffset: [12, 0] }}
        transition={reduced ? undefined : { duration: 1.6, repeat: Infinity, ease: "linear", delay: 0.25 }}
      />

      {/* LLM node */}
      <rect x={132} y={32} width={96} height={52} rx={9} fill={C.card} stroke={C.violet} strokeWidth={1.4} />
      <text x={180} y={54} textAnchor="middle" fontSize={10} fontWeight={600} fill={C.fg}>
        Language model
      </text>
      <text x={180} y={69} textAnchor="middle" fontSize={8.5} fill={C.violet}>
        grounded synthesis
      </text>

      {/* Output path to Answer + sources */}
      <path d="M180 86 V106" stroke={C.green} strokeWidth={1.5} markerEnd="url(#rag-answer-out)" />
      <motion.g
        animate={reduced ? undefined : { opacity: [0.85, 1, 0.85] }}
        transition={reduced ? undefined : { duration: 2.4, repeat: Infinity }}
      >
        <rect x={42} y={110} width={166} height={28} rx={7} fill={C.card} stroke={C.green} strokeWidth={1.3} />
        <text x={125} y={128} textAnchor="middle" fontSize={9.5} fontWeight={600} fill={C.green}>
          Answer + citations [1] [2]
        </text>
      </motion.g>
    </Art>
  );
}

export const ragFigures: ConceptFigure[] = [
  {
    title: "Prepare a small library",
    caption: "Split your documents into passages. An embedding model gives each passage a vector: numbers used to compare meaning.",
    art: <PrepareFigure />,
  },
  {
    title: "Find useful passages",
    caption: "Embed the question too. Compare its vector with the passage vectors and retrieve the closest matches.",
    art: <SearchFigure />,
  },
  {
    title: "Answer with the book open",
    caption: "Give the language model the question and retrieved text. Ask for a supported answer with sources, or an honest “not enough information”.",
    art: <AnswerFigure />,
  },
];
