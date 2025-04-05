// src/components/Graphs/AlgorithmControls.tsx
import React from "react";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import { Play, Pause, RotateCcw, SkipForward, SkipBack, FastForward } from "lucide-react";
import { AlgorithmType, NodeId } from "./Types";

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
  // totalSteps,
}) => {
  const isPathfinding = algorithmType === 'dijkstra' || algorithmType === 'astar';
  const canStart = !!startNode && (!isPathfinding || !!endNode);

  const maxMs = 2000;
  const minMs = 100;
  const speedToSliderValue = (ms: number): number => {
    const clampedMs = Math.max(minMs, Math.min(maxMs, ms));
    return Math.round(100 * (maxMs - clampedMs) / (maxMs - minMs));
  };
  const sliderValueToSpeed = (value: number): number => {
    const ms = maxMs - (value / 100) * (maxMs - minMs);
    return Math.round(ms);
  };

  const handleSpeedChange = (value: number[]) => {
    setSpeed(sliderValueToSpeed(value[0]));
  };

  return (
    <div className="space-y-6 p-6 bg-gray-800 rounded-lg border border-gray-700/50 shadow-lg">
      {/* Header: Algorithm and Node Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Algorithm Selection */}
        <div>
          <Label htmlFor="algo-select" className="text-xs text-gray-400 mb-1">Algorithm</Label>
          <Select 
            value={algorithmType} 
            onValueChange={(v) => setAlgorithmType(v as AlgorithmType)} 
            disabled={isRunning && !isPaused}
          >
            <SelectTrigger id="algo-select" className="w-full bg-gray-700 border-gray-600 text-gray-200">
              <SelectValue placeholder="Algorithm" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600 text-gray-200">
              <SelectItem value="bfs">BFS</SelectItem>
              <SelectItem value="dfs">DFS</SelectItem>
              <SelectItem value="dijkstra">Dijkstra</SelectItem>
              <SelectItem value="astar">A* (A-Star)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Start Node Selection */}
        <div>
          <Label htmlFor="start-node-select" className="text-xs text-gray-400 mb-1">Start Node</Label>
          <Select 
            value={startNode ?? ""} 
            onValueChange={(v) => setStartNode(v || null)} 
            disabled={isRunning && !isPaused}
          >
            <SelectTrigger id="start-node-select" className="w-full bg-gray-700 border-gray-600 text-gray-200">
              <SelectValue placeholder="Select Start" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600 text-gray-200 max-h-60">
              {nodes.map(node => (
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
            <Label htmlFor="end-node-select" className="text-xs text-gray-400 mb-1">End Node</Label>
            <Select 
              value={endNode ?? ""} 
              onValueChange={(v) => setEndNode(v || null)} 
              disabled={isRunning && !isPaused}
            >
              <SelectTrigger id="end-node-select" className="w-full bg-gray-700 border-gray-600 text-gray-200">
                <SelectValue placeholder="Select End" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600 text-gray-200 max-h-60">
                {nodes.map(node => (
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
          disabled={isRunning && !isPaused}
          className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-600"
          aria-label="Toggle Directed Mode"
        />
        <Label htmlFor="directed-mode" className="text-sm font-medium text-gray-300">
          Directed Graph
        </Label>
      </div>

      {/* Playback Controls */}
      <div className="flex flex-wrap justify-center items-center gap-4 bg-gray-700 p-4 rounded-lg border border-gray-600">
        <Button
          variant="outline"
          size="icon"
          onClick={resetAlgorithm}
          title="Reset Algorithm"
          className="border-gray-600 hover:bg-gray-600 text-gray-300 hover:text-white"
        >
          <RotateCcw className="h-5 w-5"/>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={stepBackward}
          disabled={!isRunning || currentStep <= 0}
          title="Step Backward"
          className="border-gray-600 hover:bg-gray-600 text-gray-300 hover:text-white disabled:opacity-50"
        >
          <SkipBack className="h-5 w-5"/>
        </Button>
        <Button
          variant={isRunning && !isPaused ? "destructive" : "secondary"}
          size="icon"
          onClick={isRunning ? pauseResume : startAlgorithm}
          disabled={!canStart && !isRunning}
          title={isRunning ? (isPaused ? "Resume" : "Pause") : "Start"}
          className={`border-gray-600 disabled:opacity-50 ${
            isRunning && !isPaused
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isRunning && !isPaused ? <Pause className="h-5 w-5"/> : <Play className="h-5 w-5"/>}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={stepForward}
          disabled={!isRunning || isFinished}
          title="Step Forward"
          className="border-gray-600 hover:bg-gray-600 text-gray-300 hover:text-white disabled:opacity-50"
        >
          <SkipForward className="h-5 w-5"/>
        </Button>
      </div>

      {/* Speed Slider */}
      <div className="flex items-center gap-3">
        <Label htmlFor="speed-slider" className="text-xs text-gray-400">Speed</Label>
        <Slider
          id="speed-slider"
          min={0}
          max={100}
          step={1}
          value={[speedToSliderValue(speed)]}
          onValueChange={handleSpeedChange}
          className="w-full [&>span:first-child]:h-1 [&>span>span]:bg-blue-500 [&>span>span]:h-1"
          disabled={isRunning && !isPaused}
        />
        <FastForward className="h-5 w-5 text-gray-400" />
      </div>
    </div>
  );
};

export default AlgorithmControls;
