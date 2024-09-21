// TreeVisualizer.tsx
import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TreeNode from "./trees/TreeNode";
import TreeControls from "./trees/TreeControls";
import TreeExplanation from "./trees/TreesExplanation";
import { insertNode, deleteNode, searchNode } from "./trees/treeOperations";
import { TreeNodeType, TreeType } from "./trees/treeTypes";
import { nodeVariants, linkVariants } from "./trees/treeAnimations";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

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
    const initialTree: TreeNodeType = {
      value: 5,
      left: { value: 3, left: null, right: null },
      right: { value: 7, left: null, right: null },
    };
    setRoot(initialTree);
    setHighlightedNode(null);
    setExplanation("");
    setTraversalSteps([]);
    setCurrentStep(-1);
    setIsTraversing(false);
  }, []);

  useEffect(() => {
    resetTree();
  }, [resetTree, treeType]);

  const handleOperation = useCallback(
    (op: "insert" | "delete" | "search", val: number) => {
      let result: {
        newRoot?: TreeNodeType | null;
        steps: string[];
        found?: boolean;
      };

      switch (op) {
        case "insert":
          result = insertNode(root, val, treeType);
          setRoot(result.newRoot!);
          setExplanation(`Inserted ${val} into the ${treeType} tree.`);
          break;
        case "delete":
          result = deleteNode(root, val, treeType);
          if (result.newRoot !== undefined) {
            setRoot(result.newRoot);
          }
          setExplanation(`Deleted ${val} from the ${treeType} tree.`);
          break;
        case "search":
          result = searchNode(root, val);
          setHighlightedNode(result.found ? val : null);
          setExplanation(
            `${
              result.found ? "Found" : "Couldn't find"
            } ${val} in the ${treeType} tree.`
          );
          break;
      }

      if (op !== "search") {
        setTimeout(() => setHighlightedNode(null), 2000);
      }
    },
    [root, treeType]
  );

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
  }, [root, traversalType, traverse]);

  const stepForward = useCallback(() => {
    if (currentStep < traversalSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsTraversing(false);
    }
  }, [currentStep, traversalSteps]);

  const pauseTraversal = useCallback(() => {
    setIsTraversing(false);
  }, []);

  const resetTraversal = useCallback(() => {
    setCurrentStep(-1);
    setIsTraversing(false);
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isTraversing) {
      intervalId = setInterval(stepForward, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isTraversing, stepForward]);

  const renderTree = useCallback(
    (
      node: TreeNodeType | null,
      x: number,
      y: number,
      level: number
    ): JSX.Element | null => {
      if (!node) return null;

      const spacing = 800 / Math.pow(2, level);
      const leftChild = renderTree(
        node.left,
        x - spacing / 2,
        y + 100,
        level + 1
      );
      const rightChild = renderTree(
        node.right,
        x + spacing / 2,
        y + 100,
        level + 1
      );

      return (
        <g key={`${node.value}-${x}-${y}`}>
          <AnimatePresence>
            {leftChild && (
              <motion.line
                x1={x}
                y1={y}
                x2={x - spacing / 2}
                y2={y + 100}
                stroke="#000"
                strokeWidth={2}
                variants={linkVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              />
            )}
            {rightChild && (
              <motion.line
                x1={x}
                y1={y}
                x2={x + spacing / 2}
                y2={y + 100}
                stroke="#000"
                strokeWidth={2}
                variants={linkVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              />
            )}
        </AnimatePresence>
          <TreeNode
            node={node}
            x={x}
            y={y}
            variants={nodeVariants}
            isHighlighted={
              node.value === highlightedNode ||
              traversalSteps[currentStep] === node.value
            }
          />
          {leftChild}
          {rightChild}
        </g>
      );
    },
    [highlightedNode, traversalSteps, currentStep]
  );

  return (
    <div className="flex flex-col items-center p-4 sm:p-8 bg-white min-h-screen w-screen">
      <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-black">
        Tree Visualizer
      </h1>
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-6 border border-black items-center">
        <TreeControls
          treeType={treeType}
          setTreeType={(type) => {
            setTreeType(type);
            resetTree();
          }}
          handleOperation={handleOperation}
        />
        <div className="mt-4 flex flex-wrap gap-4 justify-center">
          <Select
            value={traversalType}
            onValueChange={(value: TraversalType) => setTraversalType(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px] border-black text-black">
              <SelectValue placeholder="Select traversal type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in-order">In-order</SelectItem>
              <SelectItem value="pre-order">Pre-order</SelectItem>
              <SelectItem value="post-order">Post-order</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={startTraversal}
            disabled={isTraversing}
            className="w-full sm:w-auto bg-black text-white hover:bg-gray-800"
          >
            Start Traversal
          </Button>
          <Button
            onClick={pauseTraversal}
            disabled={!isTraversing}
            className="w-full sm:w-auto bg-black text-white hover:bg-gray-800"
          >
            Pause Traversal
          </Button>
          <Button
            onClick={resetTraversal}
            className="w-full sm:w-auto bg-black text-white hover:bg-gray-800"
          >
            Reset Traversal
          </Button>
        </div>
        <div className="mt-8 w-full aspect-w-4 aspect-h-3 border-2 border-black rounded-lg shadow-lg overflow-hidden">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 800 600"
            preserveAspectRatio="xMidYMid meet"
          >
            <g transform="translate(400, 50)">{renderTree(root, 0, 0, 1)}</g>
          </svg>
        </div>
        <p className="mt-6 text-lg font-semibold text-black">{explanation}</p>
      </div>
      <div className="mt-8 w-full max-w-4xl">
        <TreeExplanation treeType={treeType} />
      </div>
    </div>
  );
};

export default TreeVisualizer;
