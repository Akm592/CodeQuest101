import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Plus,
  Minus,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
} from "lucide-react";

interface Node {
  value: number;
  next: number | null;
}

const FloydsAlgorithmVisualizer: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [tortoise, setTortoise] = useState<number | null>(null);
  const [hare, setHare] = useState<number | null>(null);
  const [cycleDetected, setCycleDetected] = useState<boolean>(false);
  const [middleNodes, setMiddleNodes] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(500);
  const [mode, setMode] = useState<"cycle" | "middle">("cycle");
  const [step, setStep] = useState<number>(0);
  const [explanation, setExplanation] = useState<string>("");

  // Initialize the linked list
  useEffect(() => {
    resetSimulation();
  }, [mode]);

  const resetSimulation = useCallback(() => {
    let initialNodes: Node[];
    if (mode === "cycle") {
      initialNodes = [
        { value: 0, next: 1 },
        { value: 1, next: 2 },
        { value: 2, next: 3 },
        { value: 3, next: 4 },
        { value: 4, next: 2 }, // Creates a cycle back to node 2
      ];
    } else {
      initialNodes = [
        { value: 0, next: 1 },
        { value: 1, next: 2 },
        { value: 2, next: 3 },
        { value: 3, next: 4 },
        { value: 4, next: null },
      ];
    }
    setNodes(initialNodes);
    setTortoise(0);
    setHare(0);
    setCycleDetected(false);
    setMiddleNodes([]);
    setIsRunning(false);
    setIsPaused(false);
    setStep(0);
    setExplanation("");
  }, [mode]);

  const addNode = useCallback(() => {
    setNodes((prevNodes) => {
      const newNode: Node = { value: prevNodes.length, next: null };
      const updatedNodes = [...prevNodes, newNode];
      if (prevNodes.length > 0) {
        const lastNode = updatedNodes[updatedNodes.length - 2];
        lastNode.next = updatedNodes.length - 1;
      }
      return updatedNodes;
    });
  }, []);

  const removeNode = useCallback(() => {
    setNodes((prevNodes) => {
      if (prevNodes.length <= 1) return prevNodes;
      const updatedNodes = prevNodes.slice(0, -1);
      const lastNode = updatedNodes[updatedNodes.length - 1];
      lastNode.next = null;
      return updatedNodes;
    });
  }, []);

  const toggleCycle = useCallback(() => {
    if (mode !== "cycle") return;
    setNodes((prevNodes) => {
      if (prevNodes.length < 2) return prevNodes;
      const updatedNodes = [...prevNodes];
      const lastNode = updatedNodes[updatedNodes.length - 1];
      if (lastNode.next === null) {
        lastNode.next = 0; // Create cycle to the first node
      } else {
        lastNode.next = null; // Remove cycle
      }
      return updatedNodes;
    });
  }, [mode]);

  const runAlgorithm = useCallback(() => {
    setIsRunning(true);
    setTortoise(0);
    setHare(0);
    setStep(0);
  }, []);

  const pauseResume = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const stepForward = useCallback(() => {
    if (mode === "cycle") {
      setTortoise((prev) =>
        prev !== null && nodes[prev].next !== null ? nodes[prev].next : prev
      );
      setHare((prev) => {
        if (prev !== null && nodes[prev].next !== null) {
          const next = nodes[prev].next;
          return nodes[next].next !== null ? nodes[next].next : next;
        }
        return prev;
      });
    } else {
      setTortoise((prev) =>
        prev !== null && nodes[prev].next !== null ? nodes[prev].next : prev
      );
      setHare((prev) => {
        if (
          prev !== null &&
          nodes[prev].next !== null &&
          nodes[nodes[prev].next].next !== null
        ) {
          return nodes[nodes[prev].next].next;
        }
        return null;
      });
    }
    setStep((prev) => prev + 1);
  }, [mode, nodes]);

  const stepBackward = useCallback(() => {
    if (step > 0) {
      setStep((prev) => prev - 1);
      setTortoise(0);
      setHare(0);
      for (let i = 0; i < step - 1; i++) {
        stepForward();
      }
    }
  }, [step, stepForward]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      const intervalId = setInterval(() => {
        stepForward();
      }, speed);

      return () => clearInterval(intervalId);
    }
  }, [isRunning, isPaused, speed, stepForward]);

  useEffect(() => {
    if (mode === "cycle") {
      if (tortoise === hare && tortoise !== null && hare !== null) {
        setCycleDetected(true);
        setIsRunning(false);
        setExplanation(
          "Cycle detected! The tortoise and hare have met. This algorithm is known as Floyd's Cycle-Finding Algorithm or the \"tortoise and hare\" algorithm. It uses two pointers, one moving twice as fast as the other. If there's a cycle, they will eventually meet. Learn more: " +
            "https://leetcode.com/problems/linked-list-cycle/"
        );
      } else if (hare === null || nodes[hare].next === null) {
        setIsRunning(false);
        setExplanation(
          "No cycle detected. The hare has reached the end of the list. This means the linked list is acyclic. Learn more: " +
            "https://leetcode.com/problems/linked-list-cycle/"
        );
      } else {
        setExplanation(
          `Step ${step}: Tortoise at node ${tortoise}, Hare at node ${hare}. The tortoise moves one step at a time, while the hare moves two steps.`
        );
      }
    } else {
      if (hare === null) {
        const middleIndex = Math.floor((nodes.length - 1) / 2);
        if (nodes.length % 2 === 0) {
          setMiddleNodes([middleIndex, middleIndex + 1]);
          setExplanation(
            `Middle nodes found at positions ${middleIndex} and ${
              middleIndex + 1
            }. For even-length lists, we consider both middle nodes. Learn more: ` +
              "https://leetcode.com/problems/middle-of-the-linked-list/"
          );
        } else {
          setMiddleNodes([middleIndex]);
          setExplanation(
            `Middle node found at position ${middleIndex}. For odd-length lists, there is a single middle node. Learn more: ` +
              "https://leetcode.com/problems/middle-of-the-linked-list/"
          );
        }
        setIsRunning(false);
      } else {
        setExplanation(
          `Step ${step}: Tortoise at node ${tortoise}, Hare at node ${hare}. The tortoise moves one step at a time, while the hare moves two steps.`
        );
      }
    }
  }, [tortoise, hare, mode, nodes, step]);

  const renderNodes = () => {
    return (
      <div className="flex flex-wrap justify-center items-center gap-4 pt-16 ">
        <AnimatePresence>
          {nodes.map((node, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full border-4 flex items-center justify-center text-lg md:text-xl font-bold
                ${
                  index === tortoise
                    ? "border-blue-500 shadow-lg shadow-blue-200"
                    : "border-gray-300"
                }
                ${
                  index === hare
                    ? "border-red-500 shadow-lg shadow-red-200"
                    : ""
                }
                ${
                  middleNodes.includes(index)
                    ? "border-green-500 shadow-lg shadow-green-200"
                    : ""
                }
                ${
                  cycleDetected && (index === tortoise || index === hare)
                    ? "bg-yellow-200"
                    : "bg-white"
                }
              `}
            >
              {node.value}
              {node.next !== null && (
                <motion.svg
                  className="absolute top-1/2 left-1/2 w-full h-full"
                  style={{ overflow: "visible" }}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <motion.path
                    d={`M 0 0 Q ${(nodes[node.next].value - node.value) * 40} ${
                      node.next < index ? -60 : 60
                    } ${(nodes[node.next].value - node.value) * 80} 0`}
                    fill="none"
                    stroke="gray"
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  />
                  <motion.polygon
                    points="-6,0 6,0 0,10"
                    fill="gray"
                    transform={`translate(${
                      (nodes[node.next].value - node.value) * 80
                    }, 0) rotate(${node.next < index ? 90 : -90})`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.25 }}
                  />
                </motion.svg>
              )}
              {index === tortoise && (
                <motion.div
                  className="absolute -bottom-8 text-blue-500 text-sm font-bold"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  Tortoise
                </motion.div>
              )}
              {index === hare && (
                <motion.div
                  className="absolute -top-8 text-red-500 text-sm font-bold"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  Hare
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-screen bg-background">
      <Card className="w-full max-w-7xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl text-center">
            Floyd's Algorithm Visualizer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Select
              value={mode}
              onValueChange={(value: "cycle" | "middle") => setMode(value)}
            >
              <SelectTrigger className="w-full md:w-64 mx-auto">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cycle">Cycle Detection</SelectItem>
                <SelectItem value="middle">Find Middle Node</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg mb-6 h-60 overflow-x-auto">
            {renderNodes()}
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <Button onClick={addNode} className="flex-grow md:flex-grow-0">
              <Plus size={16} className="mr-1" /> Add Node
            </Button>
            <Button onClick={removeNode} className="flex-grow md:flex-grow-0">
              <Minus size={16} className="mr-1" /> Remove Node
            </Button>
            {mode === "cycle" && (
              <Button
                onClick={toggleCycle}
                className="flex-grow md:flex-grow-0"
              >
                Toggle Cycle
              </Button>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <Button
              onClick={runAlgorithm}
              disabled={isRunning}
              className="flex-grow md:flex-grow-0"
            >
              <PlayCircle size={16} className="mr-1" /> Start
            </Button>
            <Button
              onClick={pauseResume}
              disabled={!isRunning}
              className="flex-grow md:flex-grow-0"
            >
              {isPaused ? (
                <PlayCircle size={16} className="mr-1" />
              ) : (
                <PauseCircle size={16} className="mr-1" />
              )}
              {isPaused ? "Resume" : "Pause"}
            </Button>
            <Button
              onClick={resetSimulation}
              className="flex-grow md:flex-grow-0"
            >
              <RotateCcw size={16} className="mr-1" /> Reset
            </Button>
            <Button
              onClick={stepBackward}
              disabled={step === 0}
              className="flex-grow md:flex-grow-0"
            >
              <ChevronLeft size={16} className="mr-1" /> Step Back
            </Button>
            <Button
              onClick={stepForward}
              disabled={isRunning && !isPaused}
              className="flex-grow md:flex-grow-0"
            >
              <ChevronRight size={16} className="mr-1" /> Step Forward
            </Button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Speed: {speed}ms
            </label>
            <Slider
              min={100}
              max={2000}
              step={100}
              value={[speed]}
              onValueChange={(value) => setSpeed(value[0])}
              className="w-full md:w-64 mx-auto"
            />
          </div>

          <motion.div
            className="bg-gray-100 p-4 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="font-bold mb-2 text-lg">Explanation:</h3>
            <p className="mb-2">{explanation}</p>
            {explanation.includes("Learn more:") && (
              <a
                href={explanation.split("Learn more: ")[1]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline flex items-center mt-2"
              >
                Learn more on LeetCode{" "}
                <ExternalLink size={16} className="ml-1" />
              </a>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FloydsAlgorithmVisualizer;
