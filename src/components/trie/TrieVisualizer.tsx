// A trie, built and queried character by character.
//
// The demo scripts lead with the thing everyone gets wrong: after inserting
// "cat", "car", "card" and "care", searching "ca" must return false. Every
// character matches, and it is still not a word — the end-of-word marker is
// the only thing that distinguishes them, so the renderer gives those nodes a
// double ring and the explanation says so out loud.
//
// The layout is fresh rather than reused. trees/TreeVisualizer computes a
// child's x as `x ± width / 2^(level+1)`, which is a binary-tree assumption; a
// trie node can have 26 children and siblings would overlap by about depth 3.
// See lib/algorithms/trieLayout.ts. The framer-motion variants in
// trees/treeAnimations.ts are generic, so those are reused.

import { motion } from "framer-motion";
import * as React from "react";

import { layoutTrie } from "../../lib/algorithms/trieLayout";
import {
  buildTrieSteps,
  TRIE_DEMO_WORDS,
  type TrieScript,
  type TrieStep,
} from "../../lib/algorithms/trieSteps";
import { useAlgorithmPlayer } from "../../hooks/useAlgorithmPlayer";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Surface } from "../ui/surface";
import VisualizerControls from "../Visualizer/VisualizerControls";

const SEED: TrieScript[] = TRIE_DEMO_WORDS.map((word) => ({ op: "insert" as const, word }));

type DemoKey = "build" | "searchHit" | "searchPrefix" | "prefixQuery" | "custom";

const DEMOS: Record<Exclude<DemoKey, "custom">, { label: string; script: TrieScript[] }> = {
  build: { label: "Build the trie", script: SEED },
  searchHit: { label: 'search("card") → found', script: [...SEED, { op: "search", word: "card" }] },
  searchPrefix: {
    label: 'search("ca") → a prefix is not a word',
    script: [...SEED, { op: "search", word: "ca" }],
  },
  prefixQuery: {
    label: 'startsWith("ca") → four words',
    script: [...SEED, { op: "prefix", word: "ca" }],
  },
};

const R = 17;

/** Shown before the first step: an empty trie is still a root. */
const ROOT_ONLY = [{ id: "", char: "", parentId: null, isEnd: false, depth: 0 }];

const TrieVisualizer: React.FC = () => {
  const [demo, setDemo] = React.useState<DemoKey>("build");
  const [customWord, setCustomWord] = React.useState("cart");

  const script: TrieScript[] = React.useMemo(() => {
    if (demo === "custom") {
      const word = customWord.trim().toLowerCase().replace(/[^a-z]/g, "").slice(0, 10);
      return word ? [...SEED, { op: "insert" as const, word }] : SEED;
    }
    return DEMOS[demo].script;
  }, [demo, customWord]);

  const { steps } = React.useMemo(() => buildTrieSteps(script), [script]);
  const player = useAlgorithmPlayer(steps, { initialDelayMs: 450 });
  const step: TrieStep | null = player.current;

  // Memoised, not an inline `??`: a fallback expression gets a new identity
  // every render, which would re-run the layout on every frame.
  const nodes = React.useMemo(() => step?.nodes ?? ROOT_ONLY, [step]);
  const { positions, width, height } = React.useMemo(() => layoutTrie(nodes), [nodes]);

  const activePath = new Set(step?.activePath ?? []);
  const matched = new Set(step?.matched ?? []);

  const PAD = 28;
  const viewW = Math.max(width + PAD * 2, 320);
  const viewH = Math.max(height + PAD, 140);

  const nodeFill = (id: string, isEnd: boolean): string => {
    if (!step) return "hsl(var(--viz-idle))";
    if (step.action === "miss" && id === step.nodeId) return "hsl(var(--viz-swap))";
    if (step.action === "create" && id === step.nodeId) return "hsl(var(--viz-compare))";
    if (id === step.nodeId && id !== "") return "hsl(var(--viz-current))";
    if (matched.size > 0 && [...matched].some((w) => w.startsWith(id)) && id.startsWith(step.nodeId) && id !== "") {
      return "hsl(var(--viz-visited))";
    }
    if (activePath.has(id) && id !== "") return "hsl(var(--viz-current) / 0.45)";
    return isEnd ? "hsl(var(--viz-found) / 0.35)" : "hsl(var(--viz-idle))";
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <Surface variant="card" radius="2xl" className="p-4 sm:p-6">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(DEMOS) as (keyof typeof DEMOS)[]).map((key) => (
            <Button
              key={key}
              variant={demo === key ? "default" : "outline"}
              size="sm"
              onClick={() => setDemo(key)}
            >
              {DEMOS[key].label}
            </Button>
          ))}
          <Button
            variant={demo === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => setDemo("custom")}
          >
            Insert your own
          </Button>
        </div>

        {demo === "custom" && (
          <div className="mt-4 max-w-xs">
            <Label htmlFor="trie-word" className="mb-1 text-xs text-muted-foreground">
              Word to insert (letters only)
            </Label>
            <Input
              id="trie-word"
              value={customWord}
              maxLength={10}
              onChange={(e) => setCustomWord(e.target.value)}
              className="font-mono"
            />
          </div>
        )}

        <p className="mt-4 text-sm text-muted-foreground">
          Seeded with {TRIE_DEMO_WORDS.map((w) => `"${w}"`).join(", ")}. Nodes with a double ring
          end a word; every other node is only a prefix.
        </p>
      </Surface>

      <Surface variant="well" radius="2xl" className="overflow-x-auto p-4 sm:p-6">
        <svg width={viewW} height={viewH} className="mx-auto" role="img" aria-label="Trie structure">
          {/* Links first, so nodes draw over them. */}
          {nodes.map((node) => {
            if (node.parentId === null) return null;
            const from = positions.get(node.parentId);
            const to = positions.get(node.id);
            if (!from || !to) return null;
            const onPath = activePath.has(node.id) && activePath.has(node.parentId);
            return (
              <line
                key={`link-${node.id}`}
                x1={from.x + PAD}
                y1={from.y + PAD}
                x2={to.x + PAD}
                y2={to.y + PAD}
                stroke={onPath ? "hsl(var(--viz-current))" : "hsl(var(--border))"}
                strokeWidth={onPath ? 2.5 : 1.5}
              />
            );
          })}

          {nodes.map((node) => {
            const p = positions.get(node.id);
            if (!p) return null;
            return (
              <motion.g
                key={`node-${node.id}`}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {/* Outer ring marks end-of-word — the only thing separating a
                    stored word from a prefix that merely exists. */}
                {node.isEnd && (
                  <circle
                    cx={p.x + PAD}
                    cy={p.y + PAD}
                    r={R + 4}
                    fill="none"
                    stroke="hsl(var(--viz-found))"
                    strokeWidth={2}
                  />
                )}
                <circle
                  cx={p.x + PAD}
                  cy={p.y + PAD}
                  r={R}
                  fill={nodeFill(node.id, node.isEnd)}
                  stroke="hsl(var(--border))"
                  strokeWidth={1}
                />
                <text
                  x={p.x + PAD}
                  y={p.y + PAD + 5}
                  textAnchor="middle"
                  className="select-none font-mono text-sm font-semibold"
                  fill="hsl(var(--foreground))"
                >
                  {node.char || "•"}
                </text>
              </motion.g>
            );
          })}
        </svg>
      </Surface>

      <Surface variant="card" radius="2xl" className="p-4 sm:p-6">
        <VisualizerControls
          status={player.status}
          onPlay={player.play}
          onPause={player.pause}
          onReset={player.reset}
          onStepForward={player.stepForward}
          onStepBack={player.stepBack}
          delayMs={player.delayMs}
          onDelayChange={player.setDelayMs}
          stepIndex={player.index}
          stepCount={player.stepCount}
        />

        <p className="mt-4 min-h-[3rem] text-sm text-foreground" aria-live="polite">
          {step?.explanation ?? "Press Start."}
        </p>

        {step?.result !== undefined && (
          <p
            className={cn(
              "mt-2 font-mono text-sm",
              Array.isArray(step.result)
                ? "text-viz-found"
                : step.result
                  ? "text-viz-found"
                  : "text-viz-swap",
            )}
          >
            {Array.isArray(step.result)
              ? `→ [${step.result.join(", ")}]`
              : `→ ${step.result}`}
          </p>
        )}
      </Surface>
    </div>
  );
};

export default TrieVisualizer;
