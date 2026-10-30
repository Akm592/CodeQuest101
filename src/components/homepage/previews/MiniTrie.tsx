// Inserting "car", "cat", "do". Positions come from the finished trie, so nodes
// appear in place instead of the whole drawing reshuffling as leaves are added.

import { MINI_TRIE_GAPS } from "../../../lib/algorithms/previewStages";
import type { TrieNodeSnapshot, TrieStep } from "../../../lib/algorithms/trieSteps";
import type { TrieLayout } from "../../../lib/algorithms/trieLayout";

const R = 10;
const PAD = 16;

interface MiniTrieProps {
  step: TrieStep;
  layout: TrieLayout;
}

export function MiniTrie({ step, layout }: MiniTrieProps) {
  const { positions } = layout;
  const active = new Set(step.activePath);
  const at = (n: TrieNodeSnapshot) => positions.get(n.id);
  // layoutTrie's width and height include one trailing gap; the drawing spans
  // the positions themselves, so take it back off and pad both sides instead.
  const w = layout.width - MINI_TRIE_GAPS.xGap + PAD * 2;
  const h = layout.height - MINI_TRIE_GAPS.yGap + PAD * 2;

  const fill = (node: TrieNodeSnapshot): string => {
    if (node.id === step.nodeId) {
      return step.action === "create" ? "hsl(var(--viz-found) / 0.35)" : "hsl(var(--viz-current) / 0.35)";
    }
    if (active.has(node.id)) return "hsl(var(--viz-current) / 0.15)";
    return "hsl(var(--viz-idle) / 0.15)";
  };

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" aria-hidden="true">
      {step.nodes.map((node) => {
        if (node.parentId === null) return null;
        const parent = step.nodes.find((n) => n.id === node.parentId);
        const a = parent && at(parent);
        const b = at(node);
        if (!a || !b) return null;
        const onPath = active.has(node.id) && active.has(node.parentId);
        return (
          <line
            key={`link-${node.id}`}
            x1={a.x + PAD}
            y1={a.y + PAD}
            x2={b.x + PAD}
            y2={b.y + PAD}
            stroke={onPath ? "hsl(var(--viz-current))" : "hsl(var(--border))"}
            strokeWidth={onPath ? 2 : 1.25}
          />
        );
      })}

      {step.nodes.map((node) => {
        const p = at(node);
        if (!p) return null;
        return (
          <g key={`node-${node.id}`}>
            {/* The outer ring is what separates a stored word from a prefix. */}
            {node.isEnd && (
              <circle cx={p.x + PAD} cy={p.y + PAD} r={R + 3} fill="none" stroke="hsl(var(--viz-found))" strokeWidth={1.5} />
            )}
            <circle
              cx={p.x + PAD}
              cy={p.y + PAD}
              r={R}
              fill={fill(node)}
              stroke={node.id === step.nodeId ? "hsl(var(--viz-current))" : "hsl(var(--border))"}
              strokeWidth={node.id === step.nodeId ? 1.75 : 1}
              className="transition-[fill] duration-300"
            />
            <text
              x={p.x + PAD}
              y={p.y + PAD + 4}
              textAnchor="middle"
              className="font-mono text-[11px] font-semibold"
              fill="hsl(var(--foreground))"
            >
              {node.char || "•"}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
