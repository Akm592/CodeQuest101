import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"; // Adjust path
import { Button } from "./ui/button"; // Adjust path
import { Input } from "./ui/input"; // Adjust path
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"; // Adjust path
import { Plus, Minus, RotateCw, Trash2, Loader2, Check, X } from "lucide-react"; // Added icons

// Define Node structure for internal state if needed for complex ops, otherwise keep simple array
interface ListNode {
    id: string; // For animation key
    value: number;
}

const LinkedListVisualizer: React.FC = () => {
  const [listType, setListType] = useState<"singly" | "doubly" | "circular">("singly");
  const [nodes, setNodes] = useState<ListNode[]>([]);
  const [operationStatus, setOperationStatus] = useState<"idle" | "running" | "finished">("idle"); // reversal, deletion etc.
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1); // For multi-step operations like reverse
  const [operationTarget, setOperationTarget] = useState<number | null>(null); // e.g., index for deletion
  const [inputValue, setInputValue] = useState<string>(""); // For add/delete input
  const [inputError, setInputError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string>("Select an operation or modify the list.");
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null); // Highlight during ops
  const [prevPointerIndex, setPrevPointerIndex] = useState<number | null>(null); // For reversal visualization
  const [currentPointerIndex, setCurrentPointerIndex] = useState<number | null>(null); // For reversal visualization

  const generateId = () => Math.random().toString(36).substring(7);

  // Initialize list
  useEffect(() => {
      setNodes([
          { id: generateId(), value: 10 },
          { id: generateId(), value: 25 },
          { id: generateId(), value: 5 },
          { id: generateId(), value: 40 },
      ]);
      resetOperationState();
  }, [listType]); // Re-initialize if list type changes

  const resetOperationState = () => {
      setOperationStatus("idle");
      setCurrentStepIndex(-1);
      setOperationTarget(null);
      setHighlightedIndex(null);
      setPrevPointerIndex(null);
      setCurrentPointerIndex(null);
      setExplanation("Select an operation or modify the list.");
      setInputError(null);
      // setInputValue(""); // Keep input value? Maybe clear depending on UX preference.
  }

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // --- List Operations ---

  const handleAddNode = () => {
      if (operationStatus === 'running') return;
      const value = parseInt(inputValue);
      if (isNaN(value)) {
          setInputError("Please enter a valid number.");
          return;
      }
      setInputError(null);
      setNodes(prev => [...prev, { id: generateId(), value }]);
      setInputValue(""); // Clear input after adding
      setExplanation(`Added node with value ${value}.`);
      resetOperationState(); // Reset any ongoing operation state
  }

  const handleRemoveLastNode = () => {
      if (operationStatus === 'running' || nodes.length === 0) return;
      setNodes(prev => prev.slice(0, -1));
      setExplanation("Removed last node.");
      resetOperationState();
  }

  const handleDeleteNodeByIndex = async () => {
      if (operationStatus === 'running') return;
      const index = parseInt(inputValue);
      if (isNaN(index) || index < 0 || index >= nodes.length) {
          setInputError(`Invalid index. Must be between 0 and ${nodes.length - 1}.`);
          return;
      }
      setInputError(null);
      setOperationStatus("running");
      setOperationTarget(index);
      setExplanation(`Deleting node at index ${index}...`);

      // Highlight node to be deleted
      setHighlightedIndex(index);
      await sleep(700);

      setNodes(prev => prev.filter((_, i) => i !== index));
      setExplanation(`Node at index ${index} (value ${nodes[index]?.value}) deleted.`);

      await sleep(500);
      resetOperationState();
      setInputValue(""); // Clear input
  }

  const handleReverseList = async () => {
       if (operationStatus === 'running' || nodes.length < 2) return;
       setOperationStatus("running");
       setCurrentStepIndex(0);
       setExplanation("Starting list reversal...");

       let prev: number | null = null;
       let current: number | null = 0; // Start at head index
       let next: number | null = null;
       const steps: { p: number|null, c: number|null, n: number|null, exp: string }[] = [];

       // Simulate pointer movements (conceptual for visualization)
       steps.push({ p: prev, c: current, n: next, exp: "Initialize pointers: prev = null, current = head(0)." });

       while (current !== null && current < nodes.length) { // Check bounds
            next = (current + 1 < nodes.length) ? current + 1 : null; // Simplified next index for visualization
            steps.push({ p: prev, c: current, n: next, exp: `Store next (${nodes[next]?.value ?? 'null'}). Current node: ${nodes[current].value}.` });

            // Visualize reversing the pointer (conceptual - actual reversal happens at the end)
            steps.push({ p: prev, c: current, n: next, exp: `Reverse pointer: ${nodes[current].value}.next points to ${nodes[prev as number]?.value ?? 'null'}.` });

            prev = current;
            current = next;
            steps.push({ p: prev, c: current, n: next, exp: `Move pointers: prev = ${nodes[prev]?.value ?? 'null'}, current = ${nodes[current]?.value ?? 'null'}.` });
       }
       steps.push({ p: prev, c: current, n: next, exp: `Reversal complete. New head is ${nodes[prev as number]?.value ?? 'null'}.` });

       // Animate steps
       for(let i = 0; i < steps.length; i++) {
           setPrevPointerIndex(steps[i].p);
           setCurrentPointerIndex(steps[i].c);
           // Highlight the node 'current' is pointing to during the step
           setHighlightedIndex(steps[i].c);
           setExplanation(steps[i].exp);
           setCurrentStepIndex(i);
           await sleep(1200); // Adjust speed as needed
       }

       // Apply actual reversal
       setNodes(prev => [...prev].reverse());
       setExplanation("List reversed successfully!");
       await sleep(1000);
       resetOperationState();
  }


  // --- Rendering Logic ---
  const renderVisualization = () => {
    const nodeRadius = 18;
    const nodeWidth = nodeRadius * 2 + 10; // Diameter + padding
    const nodeSpacing = 70; // Space between start of nodes
    const arrowOffset = nodeRadius + 3;
    const arrowLength = nodeSpacing - nodeWidth + 10;
    const startX = 30;
    const startY = 50; // Vertical center for nodes
    const svgHeight = 120; // Fixed height
    const svgWidth = nodes.length * nodeSpacing + startX * 2;

    return (
      <div className="min-h-[150px] border border-gray-700/50 bg-black/20 rounded p-4 overflow-x-auto relative flex items-center">
        <svg width={Math.max(svgWidth, 300)} height={svgHeight} style={{ overflow: "visible" }}>
          <AnimatePresence>
            {nodes.map((node, index) => {
              const x = startX + index * nodeSpacing;
              const isHighlighted = index === highlightedIndex;
              const isPrev = index === prevPointerIndex;
              const isCurrent = index === currentPointerIndex;

              let nodeFill = "fill-gray-800";
              if (isHighlighted) nodeFill = "fill-red-800/50"; // Deletion highlight
              if (isPrev) nodeFill = "fill-blue-800/50"; // Reversal pointers
              if (isCurrent) nodeFill = "fill-yellow-800/50";

              let nodeStroke = "stroke-gray-600";
              if(isPrev || isCurrent) nodeStroke = "stroke-teal-400";


              return (
                <motion.g
                  key={node.id}
                  initial={{ opacity: 0, x: x + 20 }}
                  animate={{ opacity: 1, x: x }}
                  exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  transform={`translate(${x}, ${startY})`}
                >
                  {/* Node Circle */}
                  <motion.circle
                    cx={0} cy={0} r={nodeRadius}
                    className={`${nodeFill} ${nodeStroke}`}
                    strokeWidth="1.5"
                  />
                  {/* Node Value */}
                  <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="medium" className="fill-gray-200 select-none">
                    {node.value}
                  </text>

                  {/* Pointers (prev/current for reversal) */}
                   {isPrev && (
                      <text x={0} y={nodeRadius + 14} textAnchor="middle" fontSize="10" className="fill-blue-400">P</text>
                   )}
                   {isCurrent && (
                       <text x={0} y={-nodeRadius - 8} textAnchor="middle" fontSize="10" className="fill-yellow-400">C</text>
                   )}

                  {/* Forward Arrow */}
                  {(listType === 'singly' || listType === 'doubly') && index < nodes.length - 1 && (
                    <motion.path
                      d={`M ${arrowOffset} 0 L ${arrowOffset + arrowLength} 0`}
                      stroke="rgb(100 116 139)" strokeWidth="1.5" fill="none"
                      markerEnd="url(#arrowhead-gray)"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                    />
                  )}
                  {/* Doubly Backward Arrow */}
                  {listType === 'doubly' && index > 0 && (
                     <motion.path
                      d={`M ${-arrowOffset} 5 L ${-arrowOffset - arrowLength} 5`} // Slightly offset vertically
                      stroke="rgb(100 116 139)" strokeWidth="1.5" fill="none"
                      markerEnd="url(#arrowhead-gray-backward)" // Needs a reversed marker
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                    />
                  )}
                   {/* Circular Arrow */}
                   {listType === 'circular' && nodes.length > 0 && index === nodes.length - 1 && (
                       <motion.path
                         // Arc path from last node back to first node
                         d={`M ${arrowOffset} 0 C ${arrowOffset + 40} ${-nodeSpacing/2}, ${-arrowOffset - arrowLength - 40} ${-nodeSpacing/2}, ${-arrowOffset - arrowLength} 0`}
                         stroke="rgb(100 116 139)" strokeWidth="1.5" fill="none"
                         markerEnd="url(#arrowhead-gray-backward)"
                         initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                        />
                   )}
                </motion.g>
              );
            })}
          </AnimatePresence>
          {/* Arrowhead definitions */}
          <defs>
            <marker id="arrowhead-gray" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto" markerUnits="userSpaceOnUse">
              <polygon points="0 0, 7 2.5, 0 5" fill="rgb(100 116 139)" />
            </marker>
             <marker id="arrowhead-gray-backward" markerWidth="7" markerHeight="5" refX="0" refY="2.5" orient="auto" markerUnits="userSpaceOnUse">
                 <polygon points="7 0, 0 2.5, 7 5" fill="rgb(100 116 139)" /> {/* Reversed points */}
             </marker>
          </defs>
        </svg>
      </div>
    );
  };

  const renderExplanationSection = () => {
    const explanations = {
      singly: { title: "Singly Linked List", description: "Nodes point only to the next node. Traversal is unidirectional." },
      doubly: { title: "Doubly Linked List", description: "Nodes point to both the next and previous nodes. Allows bidirectional traversal." },
      circular: { title: "Circular Linked List", description: "The last node points back to the first node, forming a loop. Can be singly or doubly linked." },
    };
     const currentInfo = explanations[listType];

    return (
      <div className="mt-4 space-y-2 border-t border-gray-700/50 pt-4">
         <h3 className="text-lg font-semibold text-gray-200">{currentInfo.title}</h3>
         <p className="text-sm text-gray-400">{currentInfo.description}</p>
          <div className="mt-3 p-3 bg-gray-800 border border-gray-700/50 rounded min-h-[60px]">
             <h4 className="font-semibold text-gray-200 text-sm mb-1">Operation Status:</h4>
             <p className="text-xs sm:text-sm text-gray-300 font-mono">{explanation}</p>
          </div>
      </div>
    );
  };

  return (
    // Dark theme page container
    <div className="min-h-screen w-screen bg-gradient-to-br from-gray-950 to-black p-4 text-gray-300 flex items-center justify-center">
       {/* Dark Card */}
      <Card className="w-full max-w-4xl mx-auto bg-gray-900 border border-gray-700/50 shadow-xl rounded-lg overflow-hidden">
          <CardHeader className="bg-gray-800 border-b border-gray-700/50 text-gray-100 p-4 sm:p-5">
             <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-center">Linked List Visualizer</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-5">
            {/* Controls Row 1: List Type and Add Node */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
               <Select onValueChange={(value: "singly" | "doubly" | "circular") => setListType(value)} value={listType} disabled={operationStatus === 'running'}>
                 <SelectTrigger className="w-full sm:w-[200px] bg-gray-800 border-gray-600 text-gray-300 focus:border-teal-500 focus:ring-teal-500 disabled:opacity-70">
                   <SelectValue placeholder="Select list type" />
                 </SelectTrigger>
                 <SelectContent className="bg-gray-800 border-gray-700 text-gray-300">
                   <SelectItem value="singly" className="hover:bg-teal-900/50 focus:bg-teal-900/50">Singly Linked</SelectItem>
                   <SelectItem value="doubly" className="hover:bg-teal-900/50 focus:bg-teal-900/50">Doubly Linked</SelectItem>
                   <SelectItem value="circular" className="hover:bg-teal-900/50 focus:bg-teal-900/50">Circular Linked</SelectItem>
                 </SelectContent>
               </Select>

               <div className="flex w-full sm:w-auto gap-2">
                   <Input
                     type="number"
                     value={inputValue}
                     onChange={(e) => { setInputValue(e.target.value); setInputError(null); }}
                     placeholder="Value"
                     className="h-9 flex-grow sm:w-24 bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500 disabled:opacity-70"
                     disabled={operationStatus === 'running'}
                   />
                   <Button onClick={handleAddNode} disabled={operationStatus === 'running' || inputValue === ""} className="h-9 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-60">
                      <Plus size={16} className="mr-1" /> Add
                   </Button>
               </div>
            </div>
             {inputError && <p className="text-xs text-red-400 text-center sm:text-left sm:pl-2">{inputError}</p>}

            {/* Visualization */}
            {renderVisualization()}

             {/* Controls Row 2: Operations */}
            <div className="mt-4 flex flex-wrap justify-center gap-2 border-t border-gray-700/50 pt-4">
               <Button onClick={handleRemoveLastNode} disabled={operationStatus === 'running' || nodes.length === 0} className="text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-60">
                 <Minus size={16} className="mr-1" /> Remove Last
               </Button>
               <Button onClick={handleDeleteNodeByIndex} disabled={operationStatus === 'running' || inputValue === "" || nodes.length === 0} className="text-sm bg-red-700 hover:bg-red-600 text-white disabled:opacity-60">
                  {operationStatus === 'running' && operationTarget !== null ? <Loader2 size={16} className="mr-1 animate-spin" /> : <Trash2 size={16} className="mr-1" />}
                  Delete at Index
               </Button>
               <Button onClick={handleReverseList} disabled={operationStatus === 'running' || nodes.length < 2} className="text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">
                  {operationStatus === 'running' && currentStepIndex > -1 ? <Loader2 size={16} className="mr-1 animate-spin" /> : <RotateCw size={16} className="mr-1" />}
                  Reverse List
               </Button>
                 <Button onClick={resetOperationState} disabled={operationStatus === 'idle'} className="text-sm bg-gray-500 hover:bg-gray-400 text-gray-900 disabled:opacity-60">
                    Reset Op State
                 </Button>
            </div>

            {/* Explanation Section */}
            {renderExplanationSection()}

          </CardContent>
      </Card>
    </div>
  );
};

export default LinkedListVisualizer;