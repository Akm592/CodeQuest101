// src/components/Graphs/AlgorithmControls.tsx
//
// Graph-specific settings (algorithm, start/end node, directed toggle) plus the
// shared playback surface.
//
// The prop signature is unchanged on purpose: GraphTraversalVisualizer already
// stores speed in milliseconds and exposes handleSetSpeed(ms), so the whole
// migration fits inside this file and its 650-line host needs no edits.
//
// Three things went away with the hand-rolled controls:
//   - a 0-100% speed mapping (the only one in the app) with a bg-blue-500
//     literal outside the token system;
//   - step-forward and step-back disabled unless `isRunning`, so a run that had
//     not been started could not be stepped through at all — the one thing a
//     precomputed step array is good for;
//   - a speed slider locked while running.

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { AlgorithmType, NodeId } from "./Types";

import type { PlayerStatus } from "../../hooks/useAlgorithmPlayer";
import VisualizerControls from "../Visualizer/VisualizerControls";

interface AlgorithmControlsProps {
  algorithmType: AlgorithmType;
  setAlgorithmType: (type: AlgorithmType) => void;
  startAlgorithm: () => void;
  resetAlgorithm: () => void;
  pauseResume: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  isRunning: boolean;
  isPaused: boolean;
  isFinished: boolean;
  speed: number; // Speed in ms
  setSpeed: (speed: number) => void;
  isDirected: boolean;
  toggleDirected: () => void;
  startNode: NodeId | null;
  setStartNode: (nodeId: NodeId | null) => void;
  endNode: NodeId | null; // Optional end node for pathfinding
  setEndNode: (nodeId: NodeId | null) => void;
  nodes: NodeId[]; // List of available nodes
  currentStep: number; // 0-based index
  totalSteps: number;
}

const AlgorithmControls: React.FC<AlgorithmControlsProps> = ({
  algorithmType,
  setAlgorithmType,
  startAlgorithm,
  resetAlgorithm,
  pauseResume,
  stepForward,
  stepBackward,
  isRunning,
  isPaused,
  isFinished,
  speed,
  setSpeed,
  isDirected,
  toggleDirected,
  startNode,
  setStartNode,
  endNode,
  setEndNode,
  nodes,
  currentStep,
  totalSteps,
}) => {
  const isPathfinding = algorithmType === "dijkstra" || algorithmType === "astar";
  const canStart = !!startNode && (!isPathfinding || !!endNode);
  const settingsLocked = isRunning && !isPaused;

  // This host tracks playback as three booleans; the shared control surface
  // takes one status. Collapsing them here rather than in the host keeps the
  // migration to a single file.
  const status: PlayerStatus = isFinished
    ? "finished"
    : isRunning
      ? (isPaused ? "paused" : "running")
      : "idle";

  // Every generator in GraphTraversalVisualizer pushes an INITIAL/INITIALIZE
  // step first, so its step 0 is "nothing has happened yet" — the same frame
  // useAlgorithmPlayer calls index -1. Shifting by one lines the two up, so the
  // readout counts real steps and step-back is disabled on the initial frame.
  const stepIndex = currentStep - 1;
  const stepCount = Math.max(0, totalSteps - 1);

  return (
    <div className="space-y-6 rounded-lg border border-border bg-muted p-6 text-foreground shadow-lg">
      {/* Header: Algorithm and Node Settings */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Algorithm Selection */}
        <div>
          <Label htmlFor="algo-select" className="mb-1 text-xs text-muted-foreground">Algorithm</Label>
          <Select
            value={algorithmType}
            onValueChange={(v) => setAlgorithmType(v as AlgorithmType)}
            disabled={settingsLocked}
          >
            <SelectTrigger id="algo-select" className="w-full border-border bg-muted text-foreground">
              <SelectValue placeholder="Algorithm" />
            </SelectTrigger>
            <SelectContent className="border-border bg-muted text-foreground">
              <SelectItem value="bfs">BFS</SelectItem>
              <SelectItem value="dfs">DFS</SelectItem>
              <SelectItem value="dijkstra">Dijkstra</SelectItem>
              <SelectItem value="astar">A* (A-Star)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Start Node Selection */}
        <div>
          <Label htmlFor="start-node-select" className="mb-1 text-xs text-muted-foreground">Start Node</Label>
          <Select
            value={startNode ?? ""}
            onValueChange={(v) => setStartNode(v || null)}
            disabled={settingsLocked}
          >
            <SelectTrigger id="start-node-select" className="w-full border-border bg-muted text-foreground">
              <SelectValue placeholder="Select Start" />
            </SelectTrigger>
            <SelectContent className="max-h-60 border-border bg-muted text-foreground">
              {nodes.map((node) => (
                <SelectItem key={node} value={node} disabled={node === endNode}>
                  {node}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* End Node Selection for Pathfinding */}
        {isPathfinding && (
          <div>
            <Label htmlFor="end-node-select" className="mb-1 text-xs text-muted-foreground">End Node</Label>
            <Select
              value={endNode ?? ""}
              onValueChange={(v) => setEndNode(v || null)}
              disabled={settingsLocked}
            >
              <SelectTrigger id="end-node-select" className="w-full border-border bg-muted text-foreground">
                <SelectValue placeholder="Select End" />
              </SelectTrigger>
              <SelectContent className="max-h-60 border-border bg-muted text-foreground">
                {nodes.map((node) => (
                  <SelectItem key={node} value={node} disabled={node === startNode}>
                    {node}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Directed Toggle */}
      <div className="flex items-center space-x-3">
        <Switch
          id="directed-mode"
          checked={isDirected}
          onCheckedChange={toggleDirected}
          disabled={settingsLocked}
          className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-border"
          aria-label="Toggle Directed Mode"
        />
        <Label htmlFor="directed-mode" className="text-sm font-medium text-muted-foreground">
          Directed Graph
        </Label>
      </div>

      <VisualizerControls
        status={status}
        // Resuming a paused run and starting a fresh one are different calls in
        // this host; the shared surface only knows "play".
        onPlay={isRunning && isPaused ? pauseResume : startAlgorithm}
        onPause={pauseResume}
        onReset={resetAlgorithm}
        onStepForward={stepForward}
        onStepBack={stepBackward}
        delayMs={speed}
        onDelayChange={setSpeed}
        minDelayMs={100}
        maxDelayMs={2000}
        stepIndex={stepIndex}
        stepCount={stepCount}
        disabledReason={
          canStart
            ? null
            : isPathfinding
              ? "Choose a start and an end node."
              : "Choose a start node."
        }
      />
    </div>
  );
};

export default AlgorithmControls;
