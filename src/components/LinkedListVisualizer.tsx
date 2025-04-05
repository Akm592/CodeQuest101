import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { Plus, Minus, RotateCw, Trash2, Loader2, XCircle } from "lucide-react"; // Added/changed icons

// Define Node structure
interface ListNode {
    id: string; // Unique key for React/animation
    value: number;
}

// Constants for better maintainability
const NODE_RADIUS = 20;
const NODE_DIAMETER = NODE_RADIUS * 2;
const NODE_HORIZONTAL_PADDING = 15;
const NODE_TOTAL_WIDTH = NODE_DIAMETER + NODE_HORIZONTAL_PADDING;
const NODE_SPACING = NODE_TOTAL_WIDTH + 45; // Space between start of nodes
const ARROW_OFFSET = NODE_RADIUS + 4; // Start arrow slightly outside circle
const ARROW_LENGTH = NODE_SPACING - NODE_TOTAL_WIDTH + NODE_HORIZONTAL_PADDING - (ARROW_OFFSET * 2) +10; // Calculated arrow length
const SVG_START_X = 40;
const SVG_START_Y = 60; // Vertical center for nodes
const SVG_HEIGHT = 150; // Increased height for better spacing/circular arrow

const LinkedListVisualizer: React.FC = () => {
  const [listType, setListType] = useState<"singly" | "doubly" | "circular">("singly");
  const [nodes, setNodes] = useState<ListNode[]>([]);
  const [operationStatus, setOperationStatus] = useState<"idle" | "running" | "finished">("idle");
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [operationTarget, setOperationTarget] = useState<number | null>(null); // e.g., index for deletion
  const [inputValue, setInputValue] = useState<string>("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string>("Select list type or modify the list.");
  const [highlightedIndices, setHighlightedIndices] = useState<number[]>([]); // Allow multiple highlights
  const [tempNodes, setTempNodes] = useState<ListNode[] | null>(null); // For staging changes during animation
  const [pointerState, setPointerState] = useState<{ prev: number | null, current: number | null, next: number | null }>({ prev: null, current: null, next: null});

  // Ref to track if an operation is actively being cancelled
  const isCancelling = useRef(false);
  // Ref to store the timeout ID for cancellation
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  // Initialize list or reset on type change
  useEffect(() => {
      isCancelling.current = false; // Reset cancel flag on type change
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current); // Clear any pending timeouts
        animationTimeoutRef.current = null;
      }
      setNodes([
          { id: generateId(), value: 10 },
          { id: generateId(), value: 25 },
          { id: generateId(), value: 5 },
      ]);
      resetOperationState(true); // Full reset including explanation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listType]); // Re-initialize if list type changes

  const resetOperationState = (fullReset = false) => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
      setOperationStatus("idle");
      setCurrentStepIndex(-1);
      setOperationTarget(null);
      setHighlightedIndices([]);
      setPointerState({ prev: null, current: null, next: null });
      setInputError(null);
      setTempNodes(null); // Clear temporary state
      if (fullReset) {
          setExplanation(`Initialized ${listType} linked list.`);
          setInputValue(""); // Clear input on full reset
      } else {
         setExplanation(prev => prev.includes("Cancelled") ? prev : "Operation finished or cancelled.");
      }
      isCancelling.current = false; // Ensure cancel flag is reset
  }

  const sleep = (ms: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (isCancelling.current) {
            // console.log("Sleep cancelled");
            reject(new Error("Operation cancelled"));
            return;
        }
        // console.log("Setting timeout", ms);
        animationTimeoutRef.current = setTimeout(() => {
            // console.log("Timeout resolved", ms);
            animationTimeoutRef.current = null; // Clear ref after timeout completes
            resolve();
        }, ms);
      });
  };

  // Cancel ongoing operation
  const handleCancelOperation = () => {
      if (operationStatus !== 'running') return;
      // console.log("Setting isCancelling to true");
      isCancelling.current = true;
      if (animationTimeoutRef.current) {
          // console.log("Clearing timeout ref", animationTimeoutRef.current);
          clearTimeout(animationTimeoutRef.current);
          animationTimeoutRef.current = null;
      }
      setExplanation("Operation cancelled by user.");
      // Reset state partially, keeping nodes as they were when cancelled
      setOperationStatus("finished"); // Mark as finished to allow reset
      setCurrentStepIndex(-1);
      setOperationTarget(null);
      setHighlightedIndices([]);
      setPointerState({ prev: null, current: null, next: null });
      // Don't reset tempNodes immediately, let the UI catch up if needed
      // setTempNodes(null); // Or maybe reset it? Depends on desired cancel behavior. Resetting is cleaner.
      setTempNodes(null);
  }


  // --- List Operations ---

  const handleAddNode = () => {
      if (operationStatus === 'running') return;
      const value = parseInt(inputValue);
      if (isNaN(value)) {
          setInputError("Please enter a valid number.");
          return;
      }
      setInputError(null);
      const newNode = { id: generateId(), value };
      // Simple add animation: maybe highlight the new node briefly?
      setNodes(prev => [...prev, newNode]);
      setInputValue(""); // Clear input after adding
      setExplanation(`Added node with value ${value}.`);
      // Briefly highlight the added node
      setHighlightedIndices([nodes.length]); // Highlight the index it WILL be at
      setTimeout(() => setHighlightedIndices([]), 700);
      resetOperationState(); // Reset visual state, keep explanation
  }

  const handleRemoveLastNode = async () => {
      if (operationStatus === 'running' || nodes.length === 0) return;
      try {
          isCancelling.current = false;
          setOperationStatus("running");
          const lastIndex = nodes.length - 1;
          const nodeToRemove = nodes[lastIndex];
          setExplanation(`Removing last node (value ${nodeToRemove.value})...`);
          setHighlightedIndices([lastIndex]);

          await sleep(700);
          if (isCancelling.current) throw new Error("Cancelled");

          setNodes(prev => prev.slice(0, -1));
          setExplanation(`Removed last node (value ${nodeToRemove.value}).`);
          setOperationStatus("finished");
          await sleep(500); // Brief pause to see final state
          resetOperationState();

      } catch (error: any) {
        if (error.message === "Operation cancelled") {
          // State already handled by handleCancelOperation
        } else {
          console.error("Error removing last node:", error);
          setExplanation("An error occurred during removal.");
          resetOperationState(true); // Full reset on unexpected error
        }
      }
  }

  const handleDeleteNodeByIndex = async () => {
      if (operationStatus === 'running') return;
      const index = parseInt(inputValue);

      if (isNaN(index) || index < 0 || index >= nodes.length) {
          setInputError(`Invalid index. Must be between 0 and ${nodes.length ? nodes.length - 1 : 0}.`);
          setInputValue(""); // Clear invalid input
          return;
      }
      setInputError(null);

      try {
          isCancelling.current = false;
          setOperationStatus("running");
          setOperationTarget(index);
          const valueToDelete = nodes[index].value; // *** FIX: Capture value BEFORE filtering ***
          setExplanation(`Deleting node at index ${index} (value ${valueToDelete})...`);

          // Highlight node to be deleted
          setHighlightedIndices([index]);
          await sleep(900);
          if (isCancelling.current) throw new Error("Cancelled");


          // Perform deletion
          setNodes(prev => prev.filter((_, i) => i !== index));
          setExplanation(`Node at index ${index} (value ${valueToDelete}) deleted.`);
          setHighlightedIndices([]); // Clear highlight after deletion is committed
          setOperationStatus("finished");
          setInputValue(""); // Clear input on success

          await sleep(600); // Pause to see the result
          resetOperationState();

      } catch (error: any) {
           if (error.message === "Operation cancelled") {
             // Handled by handleCancelOperation
           } else {
              console.error("Error deleting node:", error);
              setExplanation("An error occurred during deletion.");
              resetOperationState(true);
           }
      }
  }

 const handleReverseList = async () => {
    if (operationStatus === 'running' || nodes.length < 2) return;

    try {
        isCancelling.current = false;
        setOperationStatus("running");
        setExplanation("Starting list reversal...");
        setTempNodes([...nodes]); // Store initial state for animation reference if needed
        let currentNodes = [...nodes]; // Work with a copy for simulation

        let prevIdx: number | null = null;
        let currentIdx: number | null = 0;
        let nextIdx: number | null = null;

        const totalSteps = nodes.length + 2; // Approx steps: iterate nodes + initial/final
        let stepCounter = 0;

        // Initial Step
        setCurrentStepIndex(stepCounter++);
        setPointerState({ prev: prevIdx, current: currentIdx, next: nextIdx });
        setHighlightedIndices(currentIdx !== null ? [currentIdx] : []);
        setExplanation("Initialize: prev = null, current = head(0).");
        await sleep(1300);
        if (isCancelling.current) throw new Error("Cancelled");


        while (currentIdx !== null && currentIdx < currentNodes.length) {
            setCurrentStepIndex(stepCounter++);
            nextIdx = (currentIdx + 1 < currentNodes.length) ? currentIdx + 1 : null;

            setPointerState({ prev: prevIdx, current: currentIdx, next: nextIdx });
            setHighlightedIndices([currentIdx, ...(nextIdx !== null ? [nextIdx] : [])]); // Highlight current and next
            setExplanation(`Step ${stepCounter}/${totalSteps}: Store next (${nextIdx !== null ? currentNodes[nextIdx].value : 'null'}). Current: ${currentNodes[currentIdx].value}.`);
            await sleep(1500);
            if (isCancelling.current) throw new Error("Cancelled");


            // Concept: Reverse pointer (visualized by moving prev/current)
             setCurrentStepIndex(stepCounter++);
             setHighlightedIndices([currentIdx, ...(prevIdx !== null ? [prevIdx] : [])]); // Highlight current and prev
             setExplanation(`Step ${stepCounter}/${totalSteps}: Conceptually reverse pointer: ${currentNodes[currentIdx].value}.next now points to ${prevIdx !== null ? currentNodes[prevIdx].value : 'null'}.`);
             // In a real list, we'd do: current.next = prev
             await sleep(1500);
             if (isCancelling.current) throw new Error("Cancelled");


            // Move pointers forward
            prevIdx = currentIdx;
            currentIdx = nextIdx;

            setCurrentStepIndex(stepCounter++);
            setPointerState({ prev: prevIdx, current: currentIdx, next: null }); // Next determined in next loop iteration
            setHighlightedIndices([...(prevIdx !== null ? [prevIdx] : []), ...(currentIdx !== null ? [currentIdx] : [])]);
            setExplanation(`Step ${stepCounter}/${totalSteps}: Move pointers: prev = ${prevIdx !== null ? currentNodes[prevIdx].value : 'null'}, current = ${currentIdx !== null ? currentNodes[currentIdx].value : 'null'}.`);
            await sleep(1300);
            if (isCancelling.current) throw new Error("Cancelled");

        }

        // Final step explanation before actual reversal
        setCurrentStepIndex(stepCounter++);
        setPointerState({ prev: prevIdx, current: currentIdx, next: nextIdx}); // Show final state
        setHighlightedIndices(prevIdx !== null ? [prevIdx] : []) // Highlight the new head
        setExplanation(`Reversal simulation complete. New head is node ${prevIdx !== null ? currentNodes[prevIdx].value : 'null'}. Applying changes...`);
        await sleep(1500);
        if (isCancelling.current) throw new Error("Cancelled");


        // Apply actual reversal
        setNodes(prev => [...prev].reverse());
        setExplanation("List reversed successfully!");
        setOperationStatus("finished");
        await sleep(1000);
        resetOperationState();

    } catch (error: any) {
         if (error.message === "Operation cancelled") {
             // Handled by handleCancelOperation
         } else {
            console.error("Error reversing list:", error);
            setExplanation("An error occurred during reversal.");
            resetOperationState(true);
         }
    }
}


  // --- Rendering Logic ---
  const renderVisualization = useCallback(() => {
    // Use state nodes unless tempNodes is set (e.g., during complex animations if needed)
    const displayNodes = tempNodes ?? nodes;
    const svgWidth = displayNodes.length * NODE_SPACING + SVG_START_X * 2; // Dynamic width

    // Ensure minimum width for better viewing when empty or few nodes
    const minSvgWidth = 400;

    if (displayNodes.length === 0 && operationStatus === 'idle') {
        return (
            <div className="min-h-[150px] border border-dashed border-gray-600 bg-gray-800/30 rounded p-4 overflow-x-auto relative flex items-center justify-center">
                <p className="text-gray-500 text-center">List is empty. Add some nodes!</p>
            </div>
        );
    }

    return (
      <div className="min-h-[150px] border border-gray-700/50 bg-black/20 rounded p-4 overflow-x-auto relative flex items-center">
        {/* Added relative positioning and flex for centering/alignment */}
        <svg width={Math.max(svgWidth, minSvgWidth)} height={SVG_HEIGHT} style={{ overflow: "visible" }}>
          <defs>
            {/* Standard Arrowhead */}
            <marker id="arrowhead-gray" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto" markerUnits="userSpaceOnUse">
              <polygon points="0 0, 7 2.5, 0 5" className="fill-slate-500" />
            </marker>
            {/* Arrowhead for Backward Pointer (Points Left) */}
            <marker id="arrowhead-gray-backward" markerWidth="7" markerHeight="5" refX="0" refY="2.5" orient="auto" markerUnits="userSpaceOnUse">
                <polygon points="7 0, 0 2.5, 7 5" className="fill-slate-500" />
             </marker>
             {/* Arrowhead for Circular Pointer (Points Left - Used for path going right-to-left) */}
             <marker id="arrowhead-circular" markerWidth="7" markerHeight="5" refX="0" refY="2.5" orient="auto" markerUnits="userSpaceOnUse">
                <polygon points="7 0, 0 2.5, 7 5" className="fill-teal-400" />
             </marker>
          </defs>
          <AnimatePresence>
            {displayNodes.map((node, index) => {
              const x = SVG_START_X + index * NODE_SPACING;
              const isHighlighted = highlightedIndices.includes(index);
              const isPrev = index === pointerState.prev;
              const isCurrent = index === pointerState.current;
              // const isNext = index === pointerState.next; // Optional: if needed

              let nodeFill = "fill-gray-800";
              let nodeStroke = "stroke-gray-600";
              let textFill = "fill-gray-200";

              if (isHighlighted) {
                  nodeFill = "fill-blue-900/70"; // General highlight
                  nodeStroke = "stroke-blue-400";
              }
              if(operationTarget === index && operationStatus === 'running') {
                   nodeFill = "fill-red-900/70"; // Deletion highlight
                   nodeStroke = "stroke-red-500";
              }
              if (isPrev) {
                  nodeFill = "fill-purple-900/70"; // Prev pointer highlight
                  nodeStroke = "stroke-purple-400";
              }
              if (isCurrent) {
                  nodeFill = "fill-yellow-900/70"; // Current pointer highlight
                  nodeStroke = "stroke-yellow-400";
              }

              return (
                <motion.g
                  key={node.id} // Use stable ID
                  initial={{ opacity: 0, x: x + 20 }}
                  animate={{ opacity: 1, x: x }}
                  exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  transform={`translate(0, ${SVG_START_Y})`} // Group translation moved here
                >
                    {/* Group for node elements, translated horizontally */}
                    <g transform={`translate(${x}, 0)`}>
                        {/* Node Circle */}
                        <motion.circle
                            cx={0} cy={0} r={NODE_RADIUS}
                            className={`${nodeFill} ${nodeStroke}`}
                            strokeWidth="2"
                        />
                        {/* Node Value */}
                        <text x={0} y={1} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="medium" className={`${textFill} select-none pointer-events-none`}>
                            {node.value}
                        </text>

                        {/* Pointers (prev/current for reversal) - Positioned relative to the node center */}
                         {isPrev && (
                            <text x={0} y={NODE_RADIUS + 14} textAnchor="middle" fontSize="10" className="fill-purple-400 font-semibold">Prev</text>
                         )}
                         {isCurrent && (
                             <text x={0} y={-NODE_RADIUS - 8} textAnchor="middle" fontSize="10" className="fill-yellow-400 font-semibold">Curr</text>
                         )}
                    </g>

                  {/* --- Arrows --- */}
                  {/* Forward Arrow (Singly, Doubly) */}
                  {(listType === 'singly' || listType === 'doubly') && index < displayNodes.length - 1 && (
                    <motion.path
                      d={`M ${x + ARROW_OFFSET} 0 L ${x + ARROW_OFFSET + ARROW_LENGTH} 0`}
                      className="stroke-slate-500" strokeWidth="1.5" fill="none"
                      markerEnd="url(#arrowhead-gray)"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                    />
                  )}
                  {/* Backward Arrow (Doubly) - Increased vertical offset */}
                  {listType === 'doubly' && index > 0 && (
                     <motion.path
                      // From left edge of current node to right edge of previous node
                      d={`M ${x - ARROW_OFFSET} 8 L ${x - ARROW_OFFSET - ARROW_LENGTH} 8`} // y=8 offset
                      className="stroke-slate-500" strokeWidth="1.5" fill="none"
                      markerEnd="url(#arrowhead-gray-backward)" // Points left
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                    />
                  )}
                   {/* Circular Arrow (Last to First) */}
                   {listType === 'circular' && displayNodes.length > 0 && index === displayNodes.length - 1 && (
                       <motion.path
                         // Path curves below: From right of last node to left of first node
                         d={`M ${x + ARROW_OFFSET} ${NODE_RADIUS*0.5}
                             C ${x + ARROW_OFFSET + 30} ${NODE_RADIUS + 40},
                               ${SVG_START_X - ARROW_OFFSET - 30} ${NODE_RADIUS + 40},
                               ${SVG_START_X - ARROW_OFFSET} ${NODE_RADIUS*0.5}`} // Target left edge of first node
                         className="stroke-teal-500" // Use distinct color
                         strokeWidth="1.5" fill="none"
                         markerEnd="url(#arrowhead-circular)" // Points left (correct for this path end)
                         initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: index * 0.1 + 0.4 }}
                        />
                   )}
                </motion.g>
              );
            })}
          </AnimatePresence>
        </svg>
      </div>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, listType, highlightedIndices, pointerState, operationStatus, operationTarget, tempNodes]); // Dependencies for rendering


  const renderExplanationSection = () => {
    const explanations = {
      singly: { title: "Singly Linked List", description: "Each node points only to the next node. Traversal is unidirectional (forward)." },
      doubly: { title: "Doubly Linked List", description: "Each node points to both the next and previous nodes. Allows bidirectional traversal." },
      circular: { title: "Circular Linked List", description: "The last node's next pointer points back to the first node (head), forming a loop." },
    };
     const currentInfo = explanations[listType];

    return (
      <div className="mt-4 space-y-3 border-t border-gray-700/50 pt-4">
         <h3 className="text-lg font-semibold text-gray-200">{currentInfo.title}</h3>
         <p className="text-sm text-gray-400">{currentInfo.description}</p>
          <div className="mt-2 p-3 bg-gray-800 border border-gray-700/50 rounded min-h-[60px]">
             <h4 className="font-semibold text-gray-200 text-sm mb-1 flex items-center">
                <span className={`mr-2 h-2 w-2 rounded-full ${operationStatus === 'running' ? 'bg-yellow-400 animate-pulse' : operationStatus === 'finished' ? 'bg-green-400' : 'bg-gray-500'}`}></span>
                Operation Status:
             </h4>
             <p className="text-xs sm:text-sm text-gray-300 font-mono pl-4">{explanation}</p>
          </div>
      </div>
    );
  };

  return (
    // Container ensuring content is centered on screen
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-950 to-black p-4 sm:p-6 md:p-8 flex items-center justify-center">
      <Card className="w-full max-w-5xl mx-auto bg-gray-900 border border-gray-700/50 shadow-2xl rounded-lg overflow-hidden">
          <CardHeader className="bg-gray-800 border-b border-gray-700/50 text-gray-100 p-4 sm:p-5">
             <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-center tracking-tight">Interactive Linked List Visualizer</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-5">
            {/* Controls Row 1: List Type and Add Node */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
               <Select onValueChange={(value: "singly" | "doubly" | "circular") => setListType(value)} value={listType} disabled={operationStatus === 'running'}>
                 <SelectTrigger className="w-full sm:w-[180px] bg-gray-800 border-gray-600 text-gray-300 focus:border-teal-500 focus:ring-teal-500 disabled:opacity-70">
                   <SelectValue placeholder="Select list type" />
                 </SelectTrigger>
                 <SelectContent className="bg-gray-800 border-gray-700 text-gray-300">
                   <SelectItem value="singly" className="focus:bg-teal-900/50">Singly Linked</SelectItem>
                   <SelectItem value="doubly" className="focus:bg-teal-900/50">Doubly Linked</SelectItem>
                   <SelectItem value="circular" className="focus:bg-teal-900/50">Circular Linked</SelectItem>
                 </SelectContent>
               </Select>

               <div className="flex w-full sm:w-auto gap-2 items-center">
                   <Input
                     type="number"
                     value={inputValue}
                     onChange={(e) => { setInputValue(e.target.value); setInputError(null); }}
                     placeholder="Value / Index"
                     aria-label="Input value or index for operations"
                     className={`h-9 flex-grow sm:w-28 bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500 disabled:opacity-70 ${inputError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                     disabled={operationStatus === 'running'}
                   />
                   <Button onClick={handleAddNode} disabled={operationStatus === 'running' || inputValue === ""} aria-label="Add node with input value" className="h-9 px-3 text-sm bg-teal-700 hover:bg-teal-600 text-white disabled:opacity-60">
                      <Plus size={16} className="mr-1" /> Add
                   </Button>
               </div>
            </div>
             {inputError && <p className="text-xs text-red-400 text-center sm:text-right -mt-2 sm:pr-1">{inputError}</p>}

            {/* Visualization */}
            {renderVisualization()}

             {/* Controls Row 2: Operations */}
            <div className="mt-4 flex flex-wrap justify-center gap-2 border-t border-gray-700/50 pt-4">
               <Button onClick={handleRemoveLastNode} disabled={operationStatus === 'running' || nodes.length === 0} aria-label="Remove last node" className="px-3 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-60">
                 <Minus size={16} className="mr-1" /> Remove Last
               </Button>
               <Button onClick={handleDeleteNodeByIndex} disabled={operationStatus === 'running' || inputValue === "" || nodes.length === 0} aria-label="Delete node at input index" className="px-3 text-sm bg-red-700 hover:bg-red-600 text-white disabled:opacity-60">
                  {operationStatus === 'running' && operationTarget !== null && highlightedIndices.includes(operationTarget) ? <Loader2 size={16} className="mr-1 animate-spin" /> : <Trash2 size={16} className="mr-1" />}
                  Delete at Index
               </Button>
               <Button onClick={handleReverseList} disabled={operationStatus === 'running' || nodes.length < 2} aria-label="Reverse the list" className="px-3 text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">
                  {operationStatus === 'running' && currentStepIndex > -1 ? <Loader2 size={16} className="mr-1 animate-spin" /> : <RotateCw size={16} className="mr-1" />}
                  Reverse List
               </Button>
                {/* Combined Cancel/Reset Button */}
                 <Button
                    onClick={operationStatus === 'running' ? handleCancelOperation : () => resetOperationState(true)}
                    disabled={operationStatus === 'idle'}
                    aria-label={operationStatus === 'running' ? 'Cancel current operation' : 'Reset visualization state'}
                    className={`px-3 text-sm disabled:opacity-60 ${operationStatus === 'running' ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-gray-500 hover:bg-gray-400 text-gray-900'}`}
                 >
                    {operationStatus === 'running' ? <><XCircle size={16} className="mr-1"/> Cancel</> : <><RotateCw size={16} className="mr-1"/> Reset State</>}
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