import React, { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";

import { useAlgorithmPlayer } from "../hooks/useAlgorithmPlayer";
import { buildFloydSteps, MAX_NODES, type FloydMode as Mode } from "../lib/algorithms/floydSteps";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import VisualizerControls from "./Visualizer/VisualizerControls";

// Floyd's tortoise and hare, in two modes:
//   cycle  — does the list loop? If so, where does the loop start?
//   middle — the middle node (LeetCode 876: the second middle for even length).
//
// Steps are computed up front so the page can pause, step back and change
// speed. The old page advanced from a setInterval, could only step forward,
// and its "Create cycle" button always pointed the tail at the middle node.

const SPACING = 76;
const PAD = 36;
const R = 20;

const FloydsAlgorithmVisualizer: React.FC = () => {
  const [mode, setMode] = useState<Mode>("cycle");
  const [count, setCount] = useState(6);
  const [cycleTo, setCycleTo] = useState<number | null>(2);

  const effectiveCycle = mode === "cycle" ? cycleTo : null;
  const steps = useMemo(() => buildFloydSteps(count, effectiveCycle, mode), [count, effectiveCycle, mode]);
  const player = useAlgorithmPlayer(steps, { initialDelayMs: 800 });
  const step = player.current;
  const locked = player.status === "running";

  const changeCount = (delta: number) => {
    const n = Math.min(MAX_NODES, Math.max(2, count + delta));
    setCount(n);
    if (cycleTo !== null && cycleTo >= n) setCycleTo(n - 1);
  };

  const width = PAD * 2 + (count - 1) * SPACING;
  const height = 150;
  const y = 82;
  const x = (i: number) => PAD + i * SPACING;

  const nodeColor = (i: number) => {
    if (step?.answer === i) return "hsl(var(--viz-found))";
    if (step && step.tortoise === i && step.hare === i) return "hsl(var(--viz-visited))";
    if (step?.tortoise === i) return "hsl(var(--viz-pointer))";
    if (step?.hare === i) return "hsl(var(--viz-compare))";
    if (step?.met === i) return "hsl(var(--viz-visited) / 0.6)";
    return "hsl(var(--border))";
  };

  return (
    <Card className="mx-auto w-full max-w-5xl overflow-hidden">
      <CardContent className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <span className="block text-sm font-medium text-muted-foreground">Problem</span>
            <Select value={mode} onValueChange={(v: Mode) => setMode(v)} disabled={locked}>
              <SelectTrigger className="w-[13rem]" aria-label="Problem">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cycle">Detect a cycle</SelectItem>
                <SelectItem value="middle">Find the middle node</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <span className="block text-sm font-medium text-muted-foreground">Nodes</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => changeCount(-1)} disabled={locked || count <= 2} aria-label="Remove a node">
                <Minus />
              </Button>
              <span className="w-8 text-center font-mono text-sm">{count}</span>
              <Button variant="outline" size="icon" onClick={() => changeCount(1)} disabled={locked || count >= MAX_NODES} aria-label="Add a node">
                <Plus />
              </Button>
            </div>
          </div>

          {mode === "cycle" && (
            <div className="space-y-1">
              <span className="block text-sm font-medium text-muted-foreground">Last node points to</span>
              <Select
                value={cycleTo === null ? "none" : String(cycleTo)}
                onValueChange={(v) => setCycleTo(v === "none" ? null : Number(v))}
                disabled={locked}
              >
                <SelectTrigger className="w-[11rem]" aria-label="Last node points to">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nothing (no cycle)</SelectItem>
                  {Array.from({ length: count }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>
                      Node {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="border-t border-border pt-4">
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
        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-black/20 py-2">
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="mx-auto block"
            role="img"
            aria-label={`Linked list of ${count} nodes${effectiveCycle !== null ? `, last node points back to node ${effectiveCycle + 1}` : ""}`}
          >
            <defs>
              <marker id="floyd-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M0,0 L8,4 L0,8 z" fill="hsl(var(--muted-foreground))" />
              </marker>
            </defs>

            {Array.from({ length: count - 1 }, (_, i) => (
              <line
                key={`e${i}`}
                x1={x(i) + R}
                y1={y}
                x2={x(i + 1) - R - 2}
                y2={y}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
                markerEnd="url(#floyd-arrow)"
              />
            ))}

            {effectiveCycle !== null && (
              <path
                d={
                  effectiveCycle === count - 1
                    ? `M ${x(count - 1) + 8} ${y - R + 2} C ${x(count - 1) + 50} ${y - 70}, ${x(count - 1) - 50} ${y - 70}, ${x(count - 1) - 8} ${y - R}`
                    : `M ${x(count - 1)} ${y - R} C ${x(count - 1)} ${y - 70}, ${x(effectiveCycle)} ${y - 70}, ${x(effectiveCycle)} ${y - R - 2}`
                }
                fill="none"
                stroke="hsl(var(--viz-visited))"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                markerEnd="url(#floyd-arrow)"
              />
            )}

            {Array.from({ length: count }, (_, i) => (
              <g key={i}>
                <circle
                  cx={x(i)}
                  cy={y}
                  r={R}
                  fill="hsl(var(--muted))"
                  stroke={nodeColor(i)}
                  strokeWidth={step && (step.tortoise === i || step.hare === i || step.answer === i) ? 3 : 1.5}
                  style={{ transition: "stroke 200ms" }}
                />
                <text x={x(i)} y={y + 5} textAnchor="middle" fontSize={14} fontWeight={600} fill="hsl(var(--foreground))">
                  {i + 1}
                </text>
                {step?.tortoise === i && (
                  <text x={x(i) - (step.hare === i ? 8 : 0)} y={y + R + 18} textAnchor="middle" fontSize={12} fontWeight={700} fill="hsl(var(--viz-pointer))">
                    T
                  </text>
                )}
                {step?.hare === i && (
                  <text x={x(i) + (step.tortoise === i ? 8 : 0)} y={y + R + 18} textAnchor="middle" fontSize={12} fontWeight={700} fill="hsl(var(--viz-compare))">
                    H
                  </text>
                )}
              </g>
            ))}
            {step && step.hare === null && (
              <text x={width - 6} y={y + R + 18} textAnchor="end" fontSize={11} fill="hsl(var(--viz-compare))">
                H: past the end
              </text>
            )}
          </svg>
        </div>

        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-viz-pointer" /> T: tortoise, 1 step
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-viz-compare" /> H: hare, 2 steps
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-viz-found" /> Answer
          </span>
        </div>

        <p className="min-h-[2.5rem] border-t border-border pt-3 text-center text-sm text-foreground" aria-live="polite">
          {step ? step.log : "Press Start to move the two pointers."}
        </p>
      </CardContent>
    </Card>
  );
};

export default FloydsAlgorithmVisualizer;
