import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

// Tree node structure
class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;

  constructor(val: number) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

const BinaryTreeTraversalVisualizer = () => {
  const [traversalType, setTraversalType] = useState<TraversalType>("in-order");
  const [traversalSteps, setTraversalSteps] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  // Sample binary tree
  const root = React.useMemo(() => {
    const rootNode = new TreeNode(1);
    rootNode.left = new TreeNode(2);
    rootNode.right = new TreeNode(3);
    rootNode.left.left = new TreeNode(4);
    rootNode.left.right = new TreeNode(5);
    rootNode.right.left = new TreeNode(6);
    rootNode.right.right = new TreeNode(7);
    return rootNode;
  }, []);

  interface TreeNodeType {
    val: number;
    left: TreeNodeType | null;
    right: TreeNodeType | null;
  }

  type TraversalType = "in-order" | "pre-order" | "post-order";

  const traverse = useCallback((node: TreeNodeType | null, type: TraversalType, steps: number[] = []): number[] => {
    if (!node) return steps;

    if (type === "pre-order") {
      steps.push(node.val);
      traverse(node.left, type, steps);
      traverse(node.right, type, steps);
    } else if (type === "in-order") {
      traverse(node.left, type, steps);
      steps.push(node.val);
      traverse(node.right, type, steps);
    } else if (type === "post-order") {
      traverse(node.left, type, steps);
      traverse(node.right, type, steps);
      steps.push(node.val);
    }

    return steps;
  }, []);

  const startTraversal = useCallback(() => {
    const steps = traverse(root, traversalType);
    setTraversalSteps(steps);
    setCurrentStep(0);
  }, [root, traversalType, traverse]);

  const nextStep = useCallback(() => {
    if (currentStep < traversalSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, traversalSteps]);

  const resetTraversal = useCallback(() => {
    setCurrentStep(0);
  }, []);

  interface RenderTreeProps {
    node: TreeNodeType | null;
    x: number;
    y: number;
    level: number;
  }

  const renderTree = useCallback(
    ({ node, x, y, level }: RenderTreeProps): JSX.Element | null => {
      if (!node) return null;

      const isVisited = traversalSteps
        .slice(0, currentStep + 1)
        .includes(node.val);
      const isCurrent = traversalSteps[currentStep] === node.val;

      return (
        <g key={`${node.val}-${x}-${y}`}>
          <motion.circle
            cx={x}
            cy={y}
            r={20}
            fill={isCurrent ? "#ff6b6b" : isVisited ? "#4ecdc4" : "#f7fff7"}
            stroke="#2f2d2e"
            strokeWidth="2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          />
          <text x={x} y={y + 5} textAnchor="middle" fill="#2f2d2e">
            {node.val}
          </text>
          {node.left && (
            <>
              <line
                x1={x}
                y1={y + 20}
                x2={x - 40 / level}
                y2={y + 60}
                stroke="#2f2d2e"
                strokeWidth="2"
              />
              {renderTree({ node: node.left, x: x - 80 / level, y: y + 80, level: level + 1 })}
            </>
          )}
          {node.right && (
            <>
              <line
                x1={x}
                y1={y + 20}
                x2={x + 40 / level}
                y2={y + 60}
                stroke="#2f2d2e"
                strokeWidth="2"
              />
              {renderTree({ node: node.right, x: x + 80 / level, y: y + 80, level: level + 1 })}
            </>
          )}
        </g>
      );
    },
    [currentStep, traversalSteps]
  );

  return (
    <div className="flex flex-col items-center p-4 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">
        Binary Tree Traversal Visualizer
      </h1>
      <div className="mb-4">
        <Select
          value={traversalType}
          onValueChange={(value: TraversalType) => setTraversalType(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a traversal type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="in-order">In-order</SelectItem>
            <SelectItem value="pre-order">Pre-order</SelectItem>
            <SelectItem value="post-order">Post-order</SelectItem>
          </SelectContent>
        </Select>
        <button
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={startTraversal}
        >
          Start Traversal
        </button>
        <button
          className="ml-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={nextStep}
        >
          Next Step
        </button>
        <button
          className="ml-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={resetTraversal}
        >
          Reset
        </button>
      </div>
      <svg width="600" height="400">
        {renderTree({ node: root, x: 300, y: 40, level: 1 })}
      </svg>
      <div className="mt-4">
        <h2 className="text-xl font-semibold">Traversal Steps:</h2>
        <p>{traversalSteps.join(" -> ")}</p>
        <p>
          Current Step: {currentStep + 1} / {traversalSteps.length}
        </p>
      </div>
    </div>
  );
};

export default BinaryTreeTraversalVisualizer;
