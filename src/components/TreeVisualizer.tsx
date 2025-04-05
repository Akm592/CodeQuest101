// TreeVisualizer.tsx
// **MODIFIED**: Adjusted colors for dark theme
import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TreeNode from "./trees/TreeNode";
import TreeControls from "./trees/TreeControls";
import TreeExplanation from "./trees/TreesExplanation";
import { insertNode, deleteNode, searchNode } from "./trees/treeOperations";
import { TreeNodeType, TreeType } from "./trees/treeTypes";
import { nodeVariants, linkVariants } from "./trees/treeAnimations";
import { Button } from "./ui/button"; // Assuming path is correct
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"; // Assuming path is correct

type TraversalType = "in-order" | "pre-order" | "post-order";

const TreeVisualizer: React.FC = () => {
  const [treeType, setTreeType] = useState<TreeType>("binary");
  const [root, setRoot] = useState<TreeNodeType | null>(null);
  const [highlightedNode, setHighlightedNode] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [traversalType, setTraversalType] = useState<TraversalType>("in-order");
  const [traversalSteps, setTraversalSteps] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [isTraversing, setIsTraversing] = useState<boolean>(false);

  const resetTree = useCallback(() => {
    // Keep initial tree simple or use specific logic per tree type if needed
    const initialTree: TreeNodeType = {
      value: 50, // Using a different root for potentially better initial AVL balance
      left: { value: 30, left: { value: 20, left: null, right: null }, right: { value: 40, left: null, right: null } },
      right: { value: 70, left: { value: 60, left: null, right: null }, right: { value: 80, left: null, right: null } },
    };
    // A very simple initial tree for binary/bst:
    // const initialTree: TreeNodeType = {
    //   value: 5,
    //   left: { value: 3, left: null, right: null },
    //   right: { value: 7, left: null, right: null },
    // };
    setRoot(initialTree); // Or apply balancing if starting AVL
    setHighlightedNode(null);
    setExplanation(`Initialized ${treeType} tree.`);
    setTraversalSteps([]);
    setCurrentStep(-1);
    setIsTraversing(false);
  }, [treeType]); // Include treeType dependency

  useEffect(() => {
    resetTree();
  }, [resetTree]); // resetTree already depends on treeType

  const handleOperation = useCallback(
    (op: "insert" | "delete" | "search", val: number) => {
      let result: {
        newRoot?: TreeNodeType | null;
        steps: string[];
        found?: boolean;
      };
      let explanationText = "";

      try {
          switch (op) {
            case "insert":
              result = insertNode(root, val, treeType);
              // Ensure result.newRoot is not undefined before setting state
              if (result.newRoot !== undefined) {
                 setRoot(result.newRoot); // newRoot can be null if tree was empty
              }
              explanationText = `Operation: Insert ${val}. Steps: ${result.steps.join(" -> ")}`;
              setHighlightedNode(val); // Highlight the inserted node
              break;
            case "delete":
              result = deleteNode(root, val, treeType);
               // newRoot can be null after deletion
               setRoot(result.newRoot !== undefined ? result.newRoot : null);
              explanationText = `Operation: Delete ${val}. Steps: ${result.steps.join(" -> ")}`;
              setHighlightedNode(null); // Clear highlight after delete
              break;
            case "search":
              result = searchNode(root, val);
              setHighlightedNode(result.found ? val : null);
              explanationText = `Operation: Search ${val}. ${result.found ? "Found." : "Not found."} Steps: ${result.steps.join(" -> ")}`;
              break;
          }
           setExplanation(explanationText);
      } catch (error) {
          console.error("Operation failed:", error);
          setExplanation(`Error performing ${op} ${val}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setHighlightedNode(null); // Clear highlight on error
      }


      // Clear highlight after a delay for insert/search
      if (op === "insert" || op === "search") {
        setTimeout(() => setHighlightedNode(null), 2000);
      }
    },
    [root, treeType] // Removed setExplanation from deps as it causes re-renders, handle it directly
  );

  // ... (traverse, startTraversal, stepForward, pauseTraversal, resetTraversal remain the same) ...
  const traverse = useCallback(
    (
      node: TreeNodeType | null,
      type: TraversalType,
      steps: number[] = []
    ): number[] => {
      if (!node) return steps;
      if (type === "pre-order") {
        steps.push(node.value);
        traverse(node.left, type, steps);
        traverse(node.right, type, steps);
      } else if (type === "in-order") {
        traverse(node.left, type, steps);
        steps.push(node.value);
        traverse(node.right, type, steps);
      } else if (type === "post-order") {
        traverse(node.left, type, steps);
        traverse(node.right, type, steps);
        steps.push(node.value);
      }
      return steps;
    },
    []
  );

  const startTraversal = useCallback(() => {
    const steps = traverse(root, traversalType);
    setTraversalSteps(steps);
    setCurrentStep(0);
    setIsTraversing(true);
    setHighlightedNode(steps[0]); // Highlight the first node
    setExplanation(`Starting ${traversalType} traversal. Step 1: Visit ${steps[0]}`);
  }, [root, traversalType, traverse]);

  const stepForward = useCallback(() => {
     const nextStep = currentStep + 1;
    if (nextStep < traversalSteps.length) {
      setCurrentStep(nextStep);
      setHighlightedNode(traversalSteps[nextStep]);
      setExplanation(`${traversalType} traversal. Step ${nextStep + 1}: Visit ${traversalSteps[nextStep]}`);
    } else {
      setIsTraversing(false);
      setHighlightedNode(null); // Clear highlight at the end
      setExplanation(`${traversalType} traversal complete. Sequence: ${traversalSteps.join(', ')}`);
    }
  }, [currentStep, traversalSteps, traversalType]);

  const pauseTraversal = useCallback(() => {
    setIsTraversing(false);
    setExplanation(`Traversal paused at node ${traversalSteps[currentStep]}.`);
  }, [currentStep, traversalSteps]);

  const resetTraversal = useCallback(() => {
    setCurrentStep(-1);
    setIsTraversing(false);
    setHighlightedNode(null);
    setTraversalSteps([]);
     setExplanation("Traversal reset.");
  }, []);

  useEffect(() => {
    let intervalId: number | undefined;
    if (isTraversing && currentStep < traversalSteps.length) {
      intervalId = window.setInterval(stepForward, 1000); // Use window.setInterval for browser env
    }
    return () => clearInterval(intervalId);
  }, [isTraversing, stepForward, currentStep, traversalSteps.length]); // Add dependencies


  const renderTree = useCallback(
    (
      node: TreeNodeType | null,
      x: number,
      y: number,
      level: number,
      width: number // Pass width for dynamic spacing
    ): JSX.Element | null => {
      if (!node) return null;

      // Adjust spacing based on level and container width
      const horizontalSpacing = width / Math.pow(2, level + 1); // More dynamic horizontal space
      const verticalSpacing = 80; // Fixed vertical space


      const leftChildX = x - horizontalSpacing;
      const rightChildX = x + horizontalSpacing;
      const childY = y + verticalSpacing;


      const leftChild = renderTree(node.left, leftChildX, childY, level + 1, width);
      const rightChild = renderTree(node.right, rightChildX, childY, level + 1, width);

      return (
        <g key={`${node.value}-${x}-${y}`}> {/* Use more unique key */}
          <AnimatePresence>
            {node.left && (
              <motion.line
                x1={x}
                y1={y + 20} // Start line from bottom of circle
                x2={leftChildX}
                y2={childY - 20} // End line at top of child circle
                stroke="#9CA3AF" // Lighter stroke for dark theme (Tailwind gray-400)
                strokeWidth={1.5}
                variants={linkVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              />
            )}
            {node.right && (
              <motion.line
                x1={x}
                y1={y + 20} // Start line from bottom of circle
                x2={rightChildX}
                y2={childY - 20} // End line at top of child circle
                stroke="#9CA3AF" // Lighter stroke for dark theme (Tailwind gray-400)
                strokeWidth={1.5}
                variants={linkVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              />
            )}
          </AnimatePresence>
          {/* Node rendering */}
           <TreeNode
            node={node}
            x={x}
            y={y}
            variants={nodeVariants}
            isHighlighted={
              node.value === highlightedNode || // Highlight from operations
              (isTraversing && traversalSteps[currentStep] === node.value) // Highlight during traversal
            }
          />
           {/* Recursive calls last to draw children on top */}
           {leftChild}
           {rightChild}
        </g>
      );
    },
    [highlightedNode, traversalSteps, currentStep, isTraversing] // Add isTraversing
  );

  const svgWidth = 800; // Base width for viewBox calculation
  const svgHeight = 600; // Base height

  return (
    // Main Container: Dark background, light text
    <div className="flex flex-col items-center p-4 sm:p-8 bg-gray-900 text-gray-100 min-h-screen w-screen">
      {/* Heading: Light text */}
      <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-white">
        Tree Visualizer
      </h1>
      {/* Controls & Visualization Container: Darker background, lighter border */}
      <div className="w-full max-w-6xl bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700 items-center">
        {/* TreeControls already adapted */}
        <TreeControls
          treeType={treeType}
          setTreeType={(type) => {
            setTreeType(type);
            // resetTree is called by useEffect hook
          }}
          handleOperation={handleOperation}
        />
        {/* Traversal Controls */}
        <div className="mt-6 flex flex-wrap gap-4 justify-center items-center border-t border-gray-700 pt-6">
           {/* Traversal Select: Dark theme styles */}
          <Select
            value={traversalType}
            onValueChange={(value: TraversalType) => {
              setTraversalType(value);
              resetTraversal(); // Reset if type changes mid-traversal
            }}
          >
             <SelectTrigger className="w-full sm:w-[180px] border-gray-600 text-white bg-gray-700 hover:bg-gray-600 focus:ring-blue-500 focus:border-blue-500">
               <SelectValue placeholder="Select traversal" />
             </SelectTrigger>
             <SelectContent className="bg-gray-700 text-white border border-gray-600">
              <SelectItem value="in-order">In-order</SelectItem>
              <SelectItem value="pre-order">Pre-order</SelectItem>
              <SelectItem value="post-order">Post-order</SelectItem>
            </SelectContent>
          </Select>
          {/* Traversal Buttons: Use action color */}
          <Button
            onClick={startTraversal}
            disabled={isTraversing || !root} // Disable if no root
            className="w-full sm:w-auto bg-green-600 text-white hover:bg-green-500 disabled:opacity-50"
          >
            Start
          </Button>
          <Button
            onClick={isTraversing ? pauseTraversal : startTraversal} // Toggle play/pause
            disabled={!root || (currentStep === -1 && !isTraversing)} // Disable if no root or not started
            className="w-full sm:w-auto bg-yellow-600 text-white hover:bg-yellow-500 disabled:opacity-50"
          >
            {isTraversing ? 'Pause' : 'Resume'}
          </Button>
          <Button
            onClick={resetTraversal}
            className="w-full sm:w-auto bg-red-600 text-white hover:bg-red-500"
          >
            Reset
          </Button>
        </div>

        {/* SVG Visualization Area */}
         <div className="mt-8 w-full h-[400px] sm:h-[500px] border border-gray-700 rounded-lg shadow-inner bg-gray-900 overflow-hidden"> {/* Fixed height, dark bg */}
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`} // Maintain viewBox
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Center the root node based on viewBox */}
            <g transform={`translate(${svgWidth / 2}, 50)`}>
              {renderTree(root, 0, 0, 0, svgWidth)} {/* Pass width */}
            </g>
          </svg>
        </div>
         {/* Explanation Area */}
         <div className="mt-6 p-4 bg-gray-700 rounded min-h-[60px] text-sm text-gray-200 border border-gray-600">
            <p className="font-mono">{explanation || "Perform an operation or start traversal."}</p>
         </div>
      </div>
      {/* Tree Explanation Component Area */}
      <div className="mt-8 w-full max-w-6xl">
         {/* TreeExplanation already adapted */}
        <TreeExplanation treeType={treeType} />
      </div>
    </div>
  );
};

export default TreeVisualizer;