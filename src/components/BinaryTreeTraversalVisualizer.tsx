import React, { useState, useCallback, useEffect } from "react";
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
  const [svgSize, setSvgSize] = useState({ width: 600, height: 400 });

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

  const traverse = useCallback(
    (
      node: TreeNodeType | null,
      type: TraversalType,
      steps: number[] = []
    ): number[] => {
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
    },
    []
  );

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
            fill={isCurrent ? "#000000" : isVisited ? "#808080" : "#ffffff"}
            stroke="#000000"
            strokeWidth="2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          />
          <text x={x} y={y + 5} textAnchor="middle" fill="#ffffff">
            {node.val}
          </text>
          {node.left && (
            <>
              <line
                x1={x}
                y1={y + 20}
                x2={x - 40 / level}
                y2={y + 60}
                stroke="#000000"
                strokeWidth="2"
              />
              {renderTree({
                node: node.left,
                x: x - 80 / level,
                y: y + 80,
                level: level + 1,
              })}
            </>
          )}
          {node.right && (
            <>
              <line
                x1={x}
                y1={y + 20}
                x2={x + 40 / level}
                y2={y + 60}
                stroke="#000000"
                strokeWidth="2"
              />
              {renderTree({
                node: node.right,
                x: x + 80 / level,
                y: y + 80,
                level: level + 1,
              })}
            </>
          )}
        </g>
      );
    },
    [currentStep, traversalSteps]
  );

  useEffect(() => {
    const handleResize = () => {
      const width = Math.max(300, Math.min(window.innerWidth - 40, 1200));
      const height = Math.max(300, Math.min(window.innerHeight - 300, 800));
      setSvgSize({ width, height });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex flex-col items-center p-4 bg-white min-h-screen">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 text-center">
        Binary Tree Traversal Visualizer
      </h1>
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        <Select
          value={traversalType}
          onValueChange={(value: TraversalType) => setTraversalType(value)}
        >
          <SelectTrigger className="w-[180px] bg-white border-black text-black">
            <SelectValue placeholder="Select a traversal type" />
          </SelectTrigger>
          <SelectContent className="bg-white border-black">
            <SelectItem value="in-order">In-order</SelectItem>
            <SelectItem value="pre-order">Pre-order</SelectItem>
            <SelectItem value="post-order">Post-order</SelectItem>
          </SelectContent>
        </Select>
        <button
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          onClick={startTraversal}
        >
          Start Traversal
        </button>
        <button
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          onClick={nextStep}
        >
          Next Step
        </button>
        <button
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          onClick={resetTraversal}
        >
          Reset
        </button>
      </div>
      <svg
        width={svgSize.width}
        height={svgSize.height}
        className="border border-black"
      >
        {renderTree({ node: root, x: svgSize.width / 2, y: 40, level: 1 })}
      </svg>
      <div className="mt-4 text-center">
        <h2 className="text-lg md:text-xl font-semibold">Traversal Steps:</h2>
        <p className="text-sm md:text-base overflow-x-auto max-w-full">
          {traversalSteps.join(" -> ")}
        </p>
        <p className="text-sm md:text-base">
          Current Step: {currentStep + 1} / {traversalSteps.length}
        </p>
      </div>
    </div>
  );
};

export default BinaryTreeTraversalVisualizer;
