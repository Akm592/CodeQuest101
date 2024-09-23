import React, { useState, useEffect, useCallback } from "react";
import GraphVisualization from "./Graphs/GraphVisualization";
import TraversalControls from "./Graphs/TraversalControls";
import ExplanationPanel from "./Graphs/ExplanationPanel";
import Explanation from "./Graphs/Explanation";
import { Switch } from "./ui/switch";

type Node = string;
type Edge = [string, string];
type Graph = {
  nodes: Node[];
  edges: Edge[];
  directed: boolean;
};

type TraversalStep = {
  visited: Node[];
  queue?: Node[];
  stack?: Node[];
  currentNode: Node;
};

const generateRandomGraph = (): Graph => {
  const nodeCount = Math.floor(Math.random() * 6) + 3; // 5 to 10 nodes
  const nodes = Array.from({ length: nodeCount }, (_, i) =>
    String.fromCharCode(65 + i)
  );
  const edges: Edge[] = [];
  const directed = Math.random() < 0.5; // 50% chance of being directed

  // Generate random edges
  for (let i = 0; i < nodes.length; i++) {
    const edgeCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 edges per node
    for (let j = 0; j < edgeCount; j++) {
      const target = nodes[Math.floor(Math.random() * nodes.length)];
      if (target !== nodes[i]) {
        edges.push([nodes[i], target]);
      }
    }
  }

  return { nodes, edges, directed };
};

const GraphTraversalVisualizer: React.FC = () => {
  const [graph, setGraph] = useState<Graph>(generateRandomGraph());
  const [traversalType, setTraversalType] = useState<"bfs" | "dfs">("bfs");
  const [currentStep, setCurrentStep] = useState(0);
  const [traversalSteps, setTraversalSteps] = useState<TraversalStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);
  const [speed, setSpeed] = useState(1000);
  const [startNode, setStartNode] = useState<string | null>(null);

  useEffect(() => {
    const newGraph = generateRandomGraph();
    setGraph(newGraph);
    setStartNode(newGraph.nodes[0]); // Set the first node as the default start node
  }, []);

  const resetTraversal = useCallback(() => {
    setCurrentStep(0);
    setTraversalSteps([]);
    setIsRunning(false);
  }, []);

  const getNeighbors = useCallback(
    (node: Node): Node[] => {
      if (graph.directed) {
        return graph.edges
          .filter(([from]) => from === node)
          .map(([, to]) => to);
      } else {
        return graph.edges
          .filter(([from, to]) => from === node || to === node)
          .map(([from, to]) => (from === node ? to : from));
      }
    },
    [graph]
  );

  const bfs = useCallback(
    (startNode: Node): TraversalStep[] => {
      const steps: TraversalStep[] = [];
      const visited: Set<Node> = new Set();
      const queue: Node[] = [startNode];

      while (queue.length > 0) {
        const currentNode = queue.shift()!;
        if (!visited.has(currentNode)) {
          visited.add(currentNode);
          steps.push({
            visited: Array.from(visited),
            queue: [...queue],
            currentNode,
          });

          getNeighbors(currentNode)
            .filter((neighbor) => !visited.has(neighbor))
            .forEach((neighbor) => {
              queue.push(neighbor);
            });
        }
      }

      return steps;
    },
    [getNeighbors]
  );

  const dfs = useCallback(
    (startNode: Node): TraversalStep[] => {
      const steps: TraversalStep[] = [];
      const visited: Set<Node> = new Set();
      const stack: Node[] = [startNode];

      while (stack.length > 0) {
        const currentNode = stack.pop()!;
        if (!visited.has(currentNode)) {
          visited.add(currentNode);
          steps.push({
            visited: Array.from(visited),
            stack: [...stack],
            currentNode,
          });

          getNeighbors(currentNode)
            .filter((neighbor) => !visited.has(neighbor))
            .forEach((neighbor) => {
              stack.push(neighbor);
            });
        }
      }

      return steps;
    },
    [getNeighbors]
  );

  const startTraversal = useCallback(() => {
    if (!startNode) return;
    const steps = traversalType === "bfs" ? bfs(startNode) : dfs(startNode);
    setTraversalSteps(steps);
    setIsRunning(true);
    setCurrentStep(0);
  }, [traversalType, bfs, dfs, startNode]);

  const toggleDirected = useCallback(() => {
    setGraph((prevGraph) => ({
      ...prevGraph,
      directed: !prevGraph.directed,
    }));
    resetTraversal();
  }, [resetTraversal]);

  const handleNodeClick = useCallback((nodeId: string) => {
    if (!isRunning) {
      setStartNode(nodeId);
      resetTraversal();
    }
  }, [isRunning, resetTraversal]);

  useEffect(() => {
    if (isRunning && currentStep < traversalSteps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else if (currentStep === traversalSteps.length - 1) {
      setIsRunning(false);
    }
  }, [isRunning, currentStep, traversalSteps, speed]);

  return (
    <div className="flex flex-col items-center p-4 bg-gray-100 min-h-screen w-screen">
      <h1 className="text-4xl font-bold mb-6 text-gray-800">
        Graph Traversal Visualizer
      </h1>
      <div className="w-full max-w-7xl bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <TraversalControls
            traversalType={traversalType}
            setTraversalType={setTraversalType}
            startTraversal={startTraversal}
            resetTraversal={resetTraversal}
            isRunning={isRunning}
            speed={speed}
            setSpeed={setSpeed}
            isDirected={graph.directed}
            toggleDirected={toggleDirected}
            startNode={startNode}
          />
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">
              Show Explanation
            </span>
            <Switch
              checked={showExplanation}
              onCheckedChange={setShowExplanation}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <GraphVisualization
              graph={graph}
              currentStep={currentStep}
              traversalSteps={traversalSteps}
              onNodeClick={handleNodeClick}
              startNode={startNode}
            />
          </div>
          {showExplanation && (
            <div className="flex-1">
              <ExplanationPanel
                currentStep={currentStep}
                traversalSteps={traversalSteps}
                traversalType={traversalType}
              />
            </div>
          )}
        </div>

        {showExplanation && <Explanation />}
      </div>
    </div>
  );
};

export default GraphTraversalVisualizer;