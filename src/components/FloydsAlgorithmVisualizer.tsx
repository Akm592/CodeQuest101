import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"; // Adjust path
import { Button } from "./ui/button"; // Adjust path
import { Slider } from "./ui/slider"; // Adjust path
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"; // Adjust path
import { Label } from "./ui/label"; // Added Label
import {
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Plus,
  Minus,
  ChevronRight,

  ExternalLink,

} from "lucide-react"; // Added Loader2

interface Node {
  value: number;
  next: number | null;
  id: string; // Added ID for unique key prop
}

const MIN_SPEED_MS = 100;
const MAX_SPEED_MS = 1500;
const DEFAULT_SPEED_MS = 750;

const FloydsAlgorithmVisualizer: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [tortoise, setTortoise] = useState<number | null>(null); // Index of tortoise
  const [hare, setHare] = useState<number | null>(null);       // Index of hare
  const [cycleDetected, setCycleDetected] = useState<boolean>(false);
  const [detectedAtNode, setDetectedAtNode] = useState<number | null>(null); // Store where cycle was detected
  const [middleNodes, setMiddleNodes] = useState<number[]>([]); // Indices of middle nodes
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speedValue, setSpeedValue] = useState(MAX_SPEED_MS + MIN_SPEED_MS - DEFAULT_SPEED_MS); // Slider maps inversely
  const [mode, setMode] = useState<"cycle" | "middle">("cycle");
  const [step, setStep] = useState<number>(0);
  const [explanation, setExplanation] = useState<string>("");
  const [currentOperation, setCurrentOperation] = useState<string | null>(null); // For detailed step info

  const generateId = () => Math.random().toString(36).substring(7);

  const initializeList = useCallback((type: "cycle" | "middle") => {
    let initialNodesData: { value: number; next: number | null }[];
    if (type === "cycle") {
      initialNodesData = [
        { value: 1, next: 1 }, { value: 2, next: 2 }, { value: 3, next: 3 },
        { value: 4, next: 4 }, { value: 5, next: 2 }, // Cycle back to node index 2 (value 3)
      ];
    } else {
      initialNodesData = [
        { value: 1, next: 1 }, { value: 2, next: 2 }, { value: 3, next: 3 },
        { value: 4, next: 4 }, { value: 5, next: null },
      ];
    }
    setNodes(initialNodesData.map(n => ({ ...n, id: generateId() })));
    setTortoise(0);
    setHare(0);
    setCycleDetected(false);
    setDetectedAtNode(null);
    setMiddleNodes([]);
    setIsRunning(false);
    setIsPaused(false);
    setStep(0);
    setExplanation("Ready to start.");
    setCurrentOperation("Initialization complete.");
  }, []);

  // Initialize on mode change or mount
  useEffect(() => {
    initializeList(mode);
  }, [mode, initializeList]);

  const resetSimulation = useCallback(() => {
    setTortoise(0);
    setHare(0);
    setCycleDetected(false);
    setDetectedAtNode(null);
    setMiddleNodes([]);
    setStep(0);
    setExplanation("Ready to start.");
    setCurrentOperation("Simulation reset.");
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  const calculateDelay = (sliderValue: number): number => {
    return MAX_SPEED_MS + MIN_SPEED_MS - sliderValue;
  }

  // const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const stepForwardAlgorithm = useCallback(async () => {
    if (tortoise === null || hare === null || nodes.length === 0) return;

    let nextTortoise = tortoise;
    let nextHare = hare;
    let explanationText = "";
    let operationText = "";

    // Move Tortoise
    if (nodes[tortoise]?.next !== null) {
      nextTortoise = nodes[tortoise].next as number;
      operationText += `Tortoise moves: ${nodes[tortoise].value} -> ${nodes[nextTortoise].value}. `;
    } else {
      operationText += "Tortoise reached end. ";
      // In middle node mode, if tortoise reaches end, hare should also stop or have stopped
      if (mode === "middle") {
         setIsRunning(false); // Tortoise reaching end stops middle search immediately
         // We calculate middle based on tortoise position when hare finishes
         return;
      }
    }

    // Move Hare
    let hareMove1 = nodes[hare]?.next;
    let hareMove2 = hareMove1 !== null ? nodes[hareMove1]?.next : null;

    if (hareMove1 !== null && hareMove2 !== null) {
       nextHare = hareMove2;
       operationText += `Hare moves: ${nodes[hare].value} -> ${nodes[hareMove1 as number].value} -> ${nodes[nextHare].value}.`;
    } else if (hareMove1 !== null) {
       nextHare = hareMove1; // Hare moves one step if it can't move two
       operationText += `Hare moves: ${nodes[hare].value} -> ${nodes[nextHare].value} (end reached).`;
       if (mode === 'cycle') setIsRunning(false); // Hare reaching end stops cycle search
    } else {
        operationText += "Hare reached end.";
        if (mode === 'cycle') setIsRunning(false); // Hare reaching end stops cycle search
    }

    setTortoise(nextTortoise);
    setHare(nextHare);
    setStep(prev => prev + 1);
    setCurrentOperation(operationText);

    // Check conditions after move
    if (mode === 'cycle') {
        if (nextTortoise === nextHare && nextTortoise !== null) {
             setCycleDetected(true);
             setDetectedAtNode(nextTortoise);
             explanationText = `Cycle detected! Tortoise and Hare met at node ${nodes[nextTortoise].value}.`;
             setIsRunning(false);
        } else if (nextHare === null || nodes[nextHare]?.next === null) {
             explanationText = "No cycle found. Hare reached the end.";
             setIsRunning(false);
        } else {
             explanationText = `Step ${step + 1}: Tortoise at ${nodes[nextTortoise].value}, Hare at ${nodes[nextHare].value}.`;
        }
    } else { // Middle mode
        // Hare stopping determines the end
        if (hareMove1 === null || hareMove2 === null) {
             // Hare has finished (or can't move two steps). Tortoise is at/near the middle.
             const middleIndex = nextTortoise; // Tortoise position when hare finishes
             if (nodes.length % 2 === 1) { // Odd length
                setMiddleNodes([middleIndex]);
                explanationText = `Hare finished. Middle node is ${nodes[middleIndex].value} (index ${middleIndex}).`;
             } else { // Even length
                // For even, the standard definition often uses the first of the two middle nodes
                // Tortoise position is correct here.
                setMiddleNodes([middleIndex]);
                 explanationText = `Hare finished. First middle node is ${nodes[middleIndex].value} (index ${middleIndex}).`;
                // If you want to highlight both: find the node before tortoise
                // let prevTortoise = Object.keys(nodes).find(key => nodes[key].next === middleIndex);
                // setMiddleNodes(prevTortoise ? [parseInt(prevTortoise), middleIndex] : [middleIndex]);
             }
             setIsRunning(false);
        } else {
             explanationText = `Step ${step + 1}: Tortoise at ${nodes[nextTortoise].value}, Hare at ${nodes[nextHare].value}.`;
        }
    }
    setExplanation(explanationText);

  }, [tortoise, hare, nodes, step, mode]);


  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (isRunning && !isPaused) {
      const delay = calculateDelay(speedValue);
      intervalId = setInterval(() => {
        stepForwardAlgorithm();
      }, delay);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, isPaused, speedValue, stepForwardAlgorithm]);


  // --- Node Manipulation ---
  const addNode = useCallback(() => {
    if (isRunning) return;
    setNodes((prevNodes) => {
      if (prevNodes.length >= 10) { // Limit size
          alert("Maximum 10 nodes allowed for clarity.");
          return prevNodes;
      };
      const newNodeValue = prevNodes.length > 0 ? prevNodes[prevNodes.length - 1].value + 1 : 1;
      const newNode: Node = { value: newNodeValue, next: null, id: generateId() };
      const updatedNodes = [...prevNodes];
      if (updatedNodes.length > 0) {
        updatedNodes[updatedNodes.length - 1].next = updatedNodes.length; // Point last node to new node index
      }
       resetSimulation(); // Reset state after modification
       return [...updatedNodes, newNode];
    });
  }, [isRunning, resetSimulation]);

  const removeNode = useCallback(() => {
     if (isRunning) return;
    setNodes((prevNodes) => {
      if (prevNodes.length <= 1) return prevNodes; // Keep at least one node
      const updatedNodes = prevNodes.slice(0, -1);
      if (updatedNodes.length > 0) {
        // Ensure the new last node points to null, unless cycle mode is active
        if (mode === 'middle' || updatedNodes[updatedNodes.length - 1].next === prevNodes.length -1) {
             updatedNodes[updatedNodes.length - 1].next = null;
        }
        // If the removed node was part of a cycle target, reset the cycle? Or just point to null?
        // For simplicity, we reset the simulation state after removal.
      }
      resetSimulation(); // Reset state after modification
      return updatedNodes;
    });
  }, [isRunning, mode, resetSimulation]);

  const toggleCycle = useCallback(() => {
    if (isRunning || mode !== "cycle") return;
    setNodes((prevNodes) => {
      if (prevNodes.length < 2) return prevNodes; // Need at least 2 nodes for a cycle
      const updatedNodes = JSON.parse(JSON.stringify(prevNodes)); // Deep copy
      const lastNodeIndex = updatedNodes.length - 1;
      const lastNode = updatedNodes[lastNodeIndex];

      if (lastNode.next === null) {
        // Create cycle back to a random-ish node (e.g., middle)
        const cycleTargetIndex = Math.max(0, Math.floor(lastNodeIndex / 2)); // Point to middle-ish node
        lastNode.next = cycleTargetIndex;
      } else {
        // Remove cycle
        lastNode.next = null;
      }
       resetSimulation(); // Reset state after modification
      return updatedNodes;
    });
  }, [isRunning, mode, resetSimulation]);


  // --- Control Actions ---
  const runAlgorithm = useCallback(() => {
    if (nodes.length === 0) return;
    resetSimulation(); // Reset state before starting
    setIsRunning(true);
    setIsPaused(false);
    setExplanation("Starting algorithm...");
    setCurrentOperation("Algorithm started.");
    // Initial state is set by reset, first step happens in useEffect
  }, [nodes, resetSimulation]);

  const pauseResume = useCallback(() => {
    if (!isRunning) return;
    setIsPaused((prev) => !prev);
    setExplanation(isPaused ? "Resumed." : "Paused.");
    setCurrentOperation(isPaused ? "Resumed." : "Paused.");
  }, [isRunning, isPaused]);

  const handleStepForward = () => {
      if (isRunning && !isPaused) return; // Don't step manually if automatically running
      if (nodes.length === 0) return;
      if (!isRunning && !isPaused && step === 0) { // If idle, start simulation paused
          resetSimulation();
          setIsRunning(true);
          setIsPaused(true);
          setExplanation("Starting step-by-step.");
          setCurrentOperation("Simulation started paused.");
          // Need a small delay to allow state update before first step
          setTimeout(() => stepForwardAlgorithm(), 50);
      } else {
          setIsPaused(true); // Ensure it's paused for manual stepping
          stepForwardAlgorithm();
      }
  }

  // --- Rendering ---
  const renderNodes = () => {
      // Simple horizontal layout for now
      const nodeSpacing = 90; // Distance between node centers
      const containerPadding = 20;
      const svgWidth = nodes.length * nodeSpacing + containerPadding * 2;
      const svgHeight = 150; // Fixed height
      const yPosition = svgHeight / 2;

      return (
        <div className="flex justify-center items-center min-h-[180px] overflow-x-auto py-4 bg-black/20 rounded border border-gray-700/50 relative">
            {nodes.length === 0 ? <p className="text-gray-500">Add nodes to begin</p> :
             <svg width={svgWidth} height={svgHeight} style={{ overflow: "visible" }}>
                <AnimatePresence>
                    {/* Render Arrows First */}
                     {nodes.map((node, index) => {
                         if (node.next === null) return null;
                         const targetIndex = node.next;
                         const sourceX = containerPadding + index * nodeSpacing;
                         const targetX = containerPadding + targetIndex * nodeSpacing;
                         const isCycle = targetIndex <= index; // Simple check for cycle arrow

                         const pathData = isCycle
                            ? `M ${sourceX} ${yPosition - 15} C ${sourceX + nodeSpacing/2} ${yPosition - 60}, ${targetX - nodeSpacing/2} ${yPosition - 60}, ${targetX} ${yPosition - 15}` // Arc up for cycle
                            : `M ${sourceX + 20} ${yPosition} L ${targetX - 20} ${yPosition}`; // Straight line

                         return (
                            <motion.path
                                key={`${node.id}-arrow`}
                                d={pathData}
                                stroke="rgb(100 116 139)" // gray-500
                                strokeWidth="1.5"
                                fill="none"
                                markerEnd="url(#arrowhead-gray)"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                            />
                         );
                     })}

                    {/* Render Nodes */}
                     {nodes.map((node, index) => {
                        const x = containerPadding + index * nodeSpacing;
                        const isTortoise = index === tortoise;
                        const isHare = index === hare;
                        const isMiddle = middleNodes.includes(index);
                        const isDetect = cycleDetected && index === detectedAtNode;

                        let borderColor = "border-gray-600"; // Default
                        if (isDetect) borderColor = "border-yellow-400 ring-2 ring-yellow-400/50";
                        else if (isTortoise && isHare) borderColor = "border-purple-500 ring-2 ring-purple-500/50"; // Met
                        else if (isTortoise) borderColor = "border-blue-500";
                        else if (isHare) borderColor = "border-red-500";
                        else if (isMiddle) borderColor = "border-green-500";

                         let bgColor = "bg-gray-800"; // Default
                         if (isDetect) bgColor = "bg-yellow-600/50";

                         let shadowClass = "";
                         if (isTortoise) shadowClass += " shadow-lg shadow-blue-500/30";
                         if (isHare) shadowClass += " shadow-lg shadow-red-500/30";
                         if (isMiddle) shadowClass += " shadow-lg shadow-green-500/30";


                        return (
                            <motion.g
                                key={node.id}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transform={`translate(${x}, ${yPosition})`}
                            >
                                 <foreignObject x="-24" y="-24" width="48" height="48">
                                     <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-300 ${borderColor} ${bgColor} ${shadowClass}`}>
                                        <span className="text-gray-100">{node.value}</span>
                                    </div>
                                 </foreignObject>

                                 {/* Labels */}
                                 {isTortoise && (
                                    <motion.text
                                        x="0" y="-30" textAnchor="middle" fontSize="10" fill="#60a5fa" // blue-400
                                        initial={{ y: -35, opacity: 0 }} animate={{ y: -30, opacity: 1 }}
                                    > T </motion.text>
                                 )}
                                 {isHare && (
                                    <motion.text
                                        x="0" y="42" textAnchor="middle" fontSize="10" fill="#f87171" // red-400
                                        initial={{ y: 47, opacity: 0 }} animate={{ y: 42, opacity: 1 }}
                                    > H </motion.text>
                                 )}
                                  {isMiddle && (
                                    <motion.text
                                        x="30" y="0" textAnchor="middle" fontSize="10" fill="#4ade80" // green-400
                                         initial={{ x: 35, opacity: 0 }} animate={{ x: 30, opacity: 1 }}
                                    > M </motion.text>
                                  )}
                            </motion.g>
                        );
                    })}
                 </AnimatePresence>
                 {/* Define arrowhead */}
                 <defs>
                     <marker id="arrowhead-gray" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto" markerUnits="userSpaceOnUse">
                         <polygon points="0 0, 8 3, 0 6" fill="rgb(100 116 139)" /> {/* gray-500 */}
                     </marker>
                 </defs>
            </svg>
            }
        </div>
      );
  }

  return (
    // Dark theme page container
    <div className="min-h-screen w-screen bg-gradient-to-br from-gray-950 to-black p-4 text-gray-300 flex items-center justify-center">
      {/* Dark Card */}
      <Card className="w-full max-w-5xl mx-auto bg-gray-900 border border-gray-700/50 shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="bg-gray-800 border-b border-gray-700/50 text-gray-100 p-4 sm:p-5">
          <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-center">
            {mode === "cycle" ? "Floyd's Cycle Detection (Tortoise & Hare)" : "Find Middle Node (Tortoise & Hare)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-5">
          {/* Mode Selection */}
          <div className="flex justify-center">
            <Select
              value={mode}
              onValueChange={(value: "cycle" | "middle") => {
                  if (!isRunning) setMode(value);
              }}
              disabled={isRunning}
            >
              <SelectTrigger className="w-full sm:w-[250px] bg-gray-800 border-gray-600 text-gray-300 focus:border-teal-500 focus:ring-teal-500 disabled:opacity-70">
                <SelectValue placeholder="Select Algorithm Mode" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-gray-300">
                <SelectItem value="cycle" className="hover:bg-teal-900/50 focus:bg-teal-900/50">Cycle Detection</SelectItem>
                <SelectItem value="middle" className="hover:bg-teal-900/50 focus:bg-teal-900/50">Find Middle Node</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Visualization Area */}
          {renderNodes()}

          {/* Node Manipulation Controls */}
           <div className="flex flex-wrap justify-center gap-2 pt-4 border-t border-gray-700/50">
             <Button onClick={addNode} disabled={isRunning || nodes.length >= 10} className="text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-60">
               <Plus size={14} className="mr-1" /> Add Node
             </Button>
             <Button onClick={removeNode} disabled={isRunning || nodes.length <= 1} className="text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-60">
               <Minus size={14} className="mr-1" /> Remove Node
             </Button>
             {mode === "cycle" && (
               <Button onClick={toggleCycle} disabled={isRunning || nodes.length < 2} className="text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-60">
                 {nodes[nodes.length - 1]?.next !== null ? "Remove Cycle" : "Create Cycle"}
               </Button>
             )}
           </div>

          {/* Simulation Controls */}
          <div className="flex flex-wrap justify-center gap-2 pt-4 border-t border-gray-700/50">
            <Button onClick={runAlgorithm} disabled={isRunning || nodes.length === 0} className="text-sm bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-60">
              <PlayCircle size={16} className="mr-1" /> Start/Restart
            </Button>
            <Button onClick={pauseResume} disabled={!isRunning} className={`text-sm disabled:opacity-60 ${isPaused ? 'bg-blue-600 hover:bg-blue-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white`}>
              {isPaused ? <PlayCircle size={16} className="mr-1" /> : <PauseCircle size={16} className="mr-1" />}
              {isPaused ? "Resume" : "Pause"}
            </Button>
             <Button onClick={handleStepForward} disabled={isRunning && !isPaused} className="text-sm bg-gray-600 hover:bg-gray-500 disabled:opacity-60">
               <ChevronRight size={16} className="mr-1" /> Step Forward
             </Button>
            <Button onClick={resetSimulation} className="text-sm bg-red-600 hover:bg-red-700 text-white disabled:opacity-60">
              <RotateCcw size={16} className="mr-1" /> Reset
            </Button>
           {/* Step Backward might be complex to implement accurately, omitting for now */}
           {/* <Button onClick={stepBackward} disabled={step === 0 || isRunning} className="text-sm bg-gray-600 hover:bg-gray-500 disabled:opacity-60">
               <ChevronLeft size={16} className="mr-1" /> Step Back
             </Button> */}
          </div>

          {/* Speed Control */}
          <div className="pt-4">
            <Label className="block text-sm font-medium text-gray-400 mb-1 text-center">
              Animation Speed: {calculateDelay(speedValue)}ms
            </Label>
            <Slider
              min={MIN_SPEED_MS}
              max={MAX_SPEED_MS}
              step={50}
              value={[speedValue]}
              onValueChange={(value) => setSpeedValue(value[0])}
              className="w-full max-w-xs mx-auto [&>span:first-child]:h-2 [&>span>span]:bg-teal-500 [&>span:first-child]:bg-gray-700"
              disabled={isRunning && !isPaused}
            />
          </div>

          {/* Explanation Panel */}
          <motion.div
            className="mt-4 p-4 bg-gray-800 border border-gray-700/50 rounded-lg min-h-[100px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="font-semibold text-gray-200 mb-1 text-sm">Status & Explanation:</h3>
             <p className="text-xs sm:text-sm text-gray-300 mb-1 font-mono">{currentOperation || " "}</p>
            <p className="text-xs sm:text-sm text-gray-400">{explanation || "Controls are above the visualization."}</p>
             {explanation.includes("Learn more:") && (
               <a
                 href={explanation.split("Learn more: ")[1]}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="text-teal-400 hover:text-teal-300 text-xs sm:text-sm inline-flex items-center mt-2 underline"
               >
                 Learn more on LeetCode <ExternalLink size={14} className="ml-1" />
               </a>
             )}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FloydsAlgorithmVisualizer;