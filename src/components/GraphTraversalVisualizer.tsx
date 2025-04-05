import React, { useState, useEffect, useCallback } from "react";
import GraphVisualization from "./Graphs/GraphVisualization"; // Assume this is styled for dark mode
import TraversalControls from "./Graphs/TraversalControls";   // Assume this is styled for dark mode
import ExplanationPanel from "./Graphs/ExplanationPanel";   // Assume this is styled for dark mode
import Explanation from "./Graphs/Explanation";           // Assume this is styled for dark mode
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"; // Adjust path

type Node = string;
type Edge = [string, string];
type Graph = {
  nodes: Node[];
  edges: Edge[];
  directed: boolean;
};

type TraversalStep = {
  visited: Node[];
  queue?: Node[]; // For BFS
  stack?: Node[]; // For DFS
  currentNode: Node;
  // Add path or parent info if needed for path highlighting
};

// Predefined directed graph
const directedGraph: Graph = {
  nodes: ["A", "B", "C", "D", "E", "F", "G"],
  edges: [ ["A", "B"], ["A", "C"], ["B", "D"], ["C", "E"], ["B", "E"], ["D", "F"], ["E", "F"], ["F", "G"], ["D", "A"] ], // Added cycle D->A
  directed: true,
};

// Predefined non-directed graph
const nonDirectedGraph: Graph = {
  nodes: ["A", "B", "C", "D", "E", "F", "G"],
  edges: [ ["A", "B"], ["A", "C"], ["B", "D"], ["C", "E"], ["B", "E"], ["D", "F"], ["E", "F"], ["F", "G"], ["A", "G"] ],
  directed: false,
};

const MIN_SPEED_MS = 100;
const MAX_SPEED_MS = 2000;
const DEFAULT_SPEED_MS = 1000;

const GraphTraversalVisualizer: React.FC = () => {
  const [graph, setGraph] = useState<Graph>(nonDirectedGraph);
  const [traversalType, setTraversalType] = useState<"bfs" | "dfs">("bfs");
  const [currentStep, setCurrentStep] = useState(0);
  const [traversalSteps, setTraversalSteps] = useState<TraversalStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // Added pause state
  const [speedValue, setSpeedValue] = useState(MAX_SPEED_MS + MIN_SPEED_MS - DEFAULT_SPEED_MS); // Slider inverse mapping
  const [startNode, setStartNode] = useState<string | null>(null); // Initialize as null

  // Set initial graph and start node
  useEffect(() => {
    setGraph(nonDirectedGraph);
    setStartNode(nonDirectedGraph.nodes[0] ?? null); // Set first node as default start
  }, []);

   // Reset simulation state
   const resetTraversal = useCallback(() => {
     setCurrentStep(0);
     setTraversalSteps([]);
     setIsRunning(false);
     setIsPaused(false);
   }, []);

    // Change graph type (directed/undirected)
    const toggleDirected = useCallback(() => {
        if (isRunning) return; // Prevent change while running
        setGraph(prev => (prev.directed ? nonDirectedGraph : directedGraph));
        setStartNode(prev => (prev.directed ? nonDirectedGraph.nodes[0] : directedGraph.nodes[0]) ?? null);
        resetTraversal();
      }, [isRunning, resetTraversal]);

      // Select start node
      const handleNodeClick = useCallback(
        (nodeId: string) => {
          if (!isRunning) {
            setStartNode(nodeId);
            resetTraversal(); // Reset when start node changes
          }
        },
        [isRunning, resetTraversal]
      );

  const calculateDelay = (sliderValue: number): number => {
    return MAX_SPEED_MS + MIN_SPEED_MS - sliderValue;
  }

  const getNeighbors = useCallback((node: Node): Node[] => {
    const neighbors = new Set<Node>();
    if (!graph) return [];

    graph.edges.forEach(([u, v]) => {
      if (u === node) {
        neighbors.add(v);
      }
      if (!graph.directed && v === node) {
        neighbors.add(u);
      }
    });
    // Optional: Sort neighbors alphabetically for consistent order
    return Array.from(neighbors).sort();
  }, [graph]);

  const bfs = useCallback((start: Node): TraversalStep[] => {
    const steps: TraversalStep[] = [];
    const visited: Set<Node> = new Set();
    const queue: Node[] = [start];
    visited.add(start); // Mark start as visited immediately

    steps.push({ visited: Array.from(visited), queue: [...queue], currentNode: start }); // Initial step

    let head = 0; // Use index for queue instead of shift for performance/clarity
    while(head < queue.length) {
        const currentNode = queue[head++]; // Dequeue

        // Add step showing dequeued node processing
        steps.push({ visited: Array.from(visited), queue: queue.slice(head), currentNode });

        const neighbors = getNeighbors(currentNode);
        const newlyAddedToQueue: Node[] = [];
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
                newlyAddedToQueue.push(neighbor);
            }
        }
         // Add step showing neighbors added to queue
        if (newlyAddedToQueue.length > 0) {
            steps.push({ visited: Array.from(visited), queue: queue.slice(head), currentNode });
        }
    }
    // Final step showing completion
    steps.push({ visited: Array.from(visited), queue: [], currentNode: "Traversal Complete" as Node });
    return steps;
  }, [getNeighbors]);

  const dfs = useCallback((start: Node): TraversalStep[] => {
    const steps: TraversalStep[] = [];
    const visited: Set<Node> = new Set();
    const stack: Node[] = [start];

    while (stack.length > 0) {
        const currentNode = stack.pop()!; // Pop from stack

        if (!visited.has(currentNode)) {
            visited.add(currentNode);
             // Step showing node visited after pop
             steps.push({ visited: Array.from(visited), stack: [...stack], currentNode });

            const neighbors = getNeighbors(currentNode).reverse(); // Reverse for typical LIFO stack behavior visual
            const newlyAddedToStack: Node[] = [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    stack.push(neighbor);
                    newlyAddedToStack.push(neighbor);
                }
            }
             // Step showing neighbors added to stack
            if (newlyAddedToStack.length > 0) {
                 steps.push({ visited: Array.from(visited), stack: [...stack], currentNode });
            }
        }
        // If already visited, just continue (implicitly shown by stack shrinking)
    }
     // Final step showing completion
     steps.push({ visited: Array.from(visited), stack: [], currentNode: "Traversal Complete" as Node });
    return steps;
  }, [getNeighbors]);


  const startTraversal = useCallback(() => {
    if (!startNode || !graph || graph.nodes.length === 0) return;
    resetTraversal();
    const steps = traversalType === "bfs" ? bfs(startNode) : dfs(startNode);
    setTraversalSteps(steps);
    setIsRunning(true);
    setIsPaused(false);
    setCurrentStep(0); // Start from the beginning
  }, [traversalType, bfs, dfs, startNode, graph, resetTraversal]);

  const pauseResume = useCallback(() => {
      setIsPaused(prev => !prev);
  }, []);

  // Effect for stepping through animation
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isRunning && !isPaused && currentStep < traversalSteps.length - 1) {
      const delay = calculateDelay(speedValue);
      timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, delay);
    } else if (currentStep >= traversalSteps.length - 1 && traversalSteps.length > 0) {
      setIsRunning(false); // Auto-stop when finished
    }
    return () => clearTimeout(timer);
  }, [isRunning, isPaused, currentStep, traversalSteps, speedValue]);

  // Handle manual stepping
  const handleStepForward = () => {
      if (currentStep < traversalSteps.length - 1) {
          setIsPaused(true); // Ensure paused for manual stepping
          setCurrentStep(prev => prev + 1);
      }
  }
  const handleStepBackward = () => {
       if (currentStep > 0) {
           setIsPaused(true);
           setCurrentStep(prev => prev - 1);
       }
  }


  return (
    // Dark theme page container
    <div className="flex flex-col items-center p-2 sm:p-4 bg-gradient-to-br from-gray-950 to-black min-h-screen w-screen text-gray-300">
      {/* Use dark Card */}
       <Card className="w-full max-w-7xl bg-gray-900 border border-gray-700/50 shadow-xl rounded-lg overflow-hidden">
           <CardHeader className="bg-gray-800 border-b border-gray-700/50 text-gray-100 p-4 sm:p-5">
                <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-center">
                    Graph Traversal Visualizer (BFS & DFS)
                </CardTitle>
           </CardHeader>
           <CardContent className="p-3 sm:p-6">
              {/* Controls - Assuming TraversalControls is styled for dark mode */}
              <div className="mb-4 sm:mb-6">
                <TraversalControls
                  traversalType={traversalType}
                  setTraversalType={(type) => { if (!isRunning) setTraversalType(type); resetTraversal(); }}
                  startTraversal={startTraversal}
                  resetTraversal={resetTraversal}
                  pauseResume={pauseResume}
                  stepForward={handleStepForward}
                  stepBackward={handleStepBackward}
                  isRunning={isRunning}
                  isPaused={isPaused}
                  isFinished={currentStep >= traversalSteps.length -1 && traversalSteps.length > 0}
                  speedValue={speedValue}
                  setSpeedValue={setSpeedValue}
                  minSpeed={MIN_SPEED_MS}
                  maxSpeed={MAX_SPEED_MS}
                  calculateDelay={calculateDelay}
                  isDirected={graph.directed}
                  toggleDirected={toggleDirected}
                  startNode={startNode}
                  nodes={graph.nodes} // Pass nodes for start node selection
                  setStartNode={(node) => { if(!isRunning) setStartNode(node); resetTraversal(); }}
                />
              </div>

              {/* Main Layout: Graph and Explanation Side-by-Side */}
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                {/* Graph Visualization Area - Assume GraphVisualization is styled */}
                <div className="w-full lg:w-2/3 xl:w-3/5 border border-gray-700/50 rounded-lg bg-black/20 p-2 min-h-[400px] sm:min-h-[500px]">
                  <GraphVisualization
                    graph={graph}
                    currentStepData={traversalSteps[currentStep]}
                    onNodeClick={handleNodeClick}
                    startNode={startNode}
                    traversalType={traversalType}
                  />
                </div>
                 {/* Explanation Panel Area - Assume ExplanationPanel is styled */}
                <div className="w-full lg:w-1/3 xl:w-2/5">
                  <ExplanationPanel
                    currentStepData={traversalSteps[currentStep]}
                    traversalType={traversalType}
                    stepNumber={currentStep}
                    totalSteps={traversalSteps.length}
                  />
                </div>
              </div>

              {/* General Explanation Section - Assume Explanation is styled */}
              <div className="mt-4 sm:mt-6 border-t border-gray-700/50 pt-4">
                <Explanation traversalType={traversalType} />
              </div>
           </CardContent>
       </Card>
    </div>
  );
};

export default GraphTraversalVisualizer;

// NOTE: Placeholder implementations for subcomponents if needed for testing:

// Example Placeholder for TraversalControls
// const TraversalControls = (props: any) => <div className="p-4 bg-gray-800 rounded text-xs">Traversal Controls Placeholder - Props: {JSON.stringify(Object.keys(props))}</div>;
// Example Placeholder for GraphVisualization
// const GraphVisualization = (props: any) => <div className="p-4 h-full bg-gray-700 rounded flex items-center justify-center text-xs">Graph Visualization Placeholder - Start Node: {props.startNode}</div>;
// Example Placeholder for ExplanationPanel
// const ExplanationPanel = (props: any) => <div className="p-4 bg-gray-800 rounded h-full text-xs">Explanation Panel Placeholder - Step: {props.stepNumber} / {props.totalSteps}</div>;
// Example Placeholder for Explanation
// const Explanation = (props: any) => <div className="p-4 bg-gray-800 rounded text-xs">General Explanation Placeholder - Type: {props.traversalType}</div>;