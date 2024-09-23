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

interface TraversalControlsProps {
  traversalType: "bfs" | "dfs";
  setTraversalType: (type: "bfs" | "dfs") => void;
  startTraversal: () => void;
  resetTraversal: () => void;
  isRunning: boolean;
  speed: number;
  setSpeed: (speed: number) => void;
  isDirected: boolean;
  toggleDirected: () => void;
  startNode: string | null;
}

const TraversalControls: React.FC<TraversalControlsProps> = ({
  traversalType,
  setTraversalType,
  startTraversal,
  resetTraversal,
  isRunning,
  speed,
  setSpeed,
  isDirected,
  toggleDirected,
  startNode,
}) => {
  return (
    <div className="flex flex-wrap gap-4 mb-4">
      <Select value={traversalType} onValueChange={setTraversalType}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select traversal type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="bfs">Breadth-First Search</SelectItem>
          <SelectItem value="dfs">Depth-First Search</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={startTraversal} disabled={isRunning || !startNode}>
        {isRunning ? "Pause" : "Start"} Traversal
      </Button>
      <Button onClick={resetTraversal}>Reset</Button>
      <Select
        value={speed.toString()}
        onValueChange={(value) => setSpeed(parseInt(value))}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select speed" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="500">Fast</SelectItem>
          <SelectItem value="1000">Normal</SelectItem>
          <SelectItem value="2000">Slow</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex items-center space-x-2">
        <Switch
          id="directed-mode"
          checked={isDirected}
          onCheckedChange={toggleDirected}
        />
        <label htmlFor="directed-mode" className="text-sm font-medium">
          Directed Graph
        </label>
      </div>
      <div className="text-sm font-medium">
        Start Node: {startNode || "Not selected"}
      </div>
    </div>
  );
};

export default TraversalControls;
