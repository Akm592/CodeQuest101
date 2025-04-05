import { useState, useCallback, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"; // Adjust path
import { Button } from "./ui/button"; // Adjust path
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"; // Adjust path
import { Play, StepForward, RotateCcw } from "lucide-react"; // Icons

// Tree node structure (keep as is)
class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  id: string; // Add unique ID for framer-motion key

  constructor(val: number) {
    this.val = val;
    this.left = null;
    this.right = null;
    this.id = `${val}-${Math.random().toString(36).substring(7)}`; // Simple unique ID
  }
}

// Define position type
interface NodePosition {
  x: number;
  y: number;
  id: string; // Match TreeNode ID
  val: number; // Include value for easy access
}

// Define line type
interface LinePosition {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    key: string;
}

type TraversalType = "in-order" | "pre-order" | "post-order";

const NODE_RADIUS = 18;
const VERTICAL_GAP = 75;
const HORIZONTAL_FACTOR = 1.8; // Controls horizontal spread

const BinaryTreeTraversalVisualizer = () => {
  const [traversalType, setTraversalType] = useState<TraversalType>("in-order");
  const [traversalSteps, setTraversalSteps] = useState<number[]>([]); // Stores node values in order
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [visitedNodeIds, setVisitedNodeIds] = useState<Set<string>>(new Set());
  const [currentStepIndex, setCurrentStepIndex] = useState(-1); // Index in traversalSteps, -1 means not started
  const [isAnimating, setIsAnimating] = useState(false); // For controlling button states during animation
  const [svgSize, setSvgSize] = useState({ width: 600, height: 400 });
  const [nodePositions, setNodePositions] = useState<Map<string, NodePosition>>(new Map());
  const [linePositions, setLinePositions] = useState<LinePosition[]>([]);

  // Sample binary tree (useMemo ensures it's created only once)
  const root = useMemo(() => {
    const rootNode = new TreeNode(10);
    rootNode.left = new TreeNode(5);
    rootNode.right = new TreeNode(15);
    rootNode.left.left = new TreeNode(3);
    rootNode.left.right = new TreeNode(7);
    rootNode.right.left = new TreeNode(12);
    rootNode.right.right = new TreeNode(18);
    return rootNode;
  }, []);

  // Function to calculate node positions and lines
  const calculateLayout = useCallback((node: TreeNode | null, x: number, y: number, level: number, positions: Map<string, NodePosition>, lines: LinePosition[], widthPerNode: number) => {
    if (!node) return;

    positions.set(node.id, { x, y, id: node.id, val: node.val });

    const childY = y + VERTICAL_GAP;
    // Adjust horizontal gap based on level to prevent overlap
    const horizontalGap = Math.max(widthPerNode / Math.pow(HORIZONTAL_FACTOR, level), NODE_RADIUS * 2.5);

    if (node.left) {
        const childX = x - horizontalGap;
        lines.push({ x1: x, y1: y + NODE_RADIUS, x2: childX, y2: childY - NODE_RADIUS, key: `${node.id}-L` });
        calculateLayout(node.left, childX, childY, level + 1, positions, lines, widthPerNode);
    }
    if (node.right) {
        const childX = x + horizontalGap;
        lines.push({ x1: x, y1: y + NODE_RADIUS, x2: childX, y2: childY - NODE_RADIUS, key: `${node.id}-R` });
        calculateLayout(node.right, childX, childY, level + 1, positions, lines, widthPerNode);
    }
  }, []);

   // Update layout when root or svgSize changes
   useEffect(() => {
     const positions = new Map<string, NodePosition>();
     const lines: LinePosition[] = [];
     const initialX = svgSize.width / 2;
     const initialY = NODE_RADIUS + 20; // Start below top edge
     // Estimate width needed per node at the widest level (usually base)
     // This is a heuristic, might need adjustment for very unbalanced trees
     const treeDepth = getTreeDepth(root);
     const maxNodesAtDepth = Math.pow(2, treeDepth - 1);
     const widthPerNode = svgSize.width / (maxNodesAtDepth + 1);

     calculateLayout(root, initialX, initialY, 1, positions, lines, widthPerNode);
     setNodePositions(positions);
     setLinePositions(lines);
   }, [root, svgSize, calculateLayout]);

   const getTreeDepth = (node: TreeNode | null): number => {
      if (!node) return 0;
      return 1 + Math.max(getTreeDepth(node.left), getTreeDepth(node.right));
   };

  // Core traversal logic (collects node objects/IDs, not just values)
  const traverse = useCallback((node: TreeNode | null, type: TraversalType, steps: TreeNode[] = []): TreeNode[] => {
    if (!node) return steps;

    if (type === "pre-order") {
      steps.push(node);
      traverse(node.left, type, steps);
      traverse(node.right, type, steps);
    } else if (type === "in-order") {
      traverse(node.left, type, steps);
      steps.push(node);
      traverse(node.right, type, steps);
    } else if (type === "post-order") {
      traverse(node.left, type, steps);
      traverse(node.right, type, steps);
      steps.push(node);
    }
    return steps;
  }, []);

  // Prepare steps when traversal type changes
  useEffect(() => {
      const nodesInOrder = traverse(root, traversalType);
      setTraversalSteps(nodesInOrder.map(node => node.val)); // Keep values for display
      // Reset visualization state
      setCurrentStepIndex(-1);
      setHighlightedNodeId(null);
      setVisitedNodeIds(new Set());
      setIsAnimating(false);
  }, [traversalType, root, traverse]);


  // Animate the traversal step-by-step
  const animateTraversal = useCallback(async () => {
      setIsAnimating(true);
      const nodesInOrder = traverse(root, traversalType);
      const visited = new Set<string>();
      setVisitedNodeIds(visited); // Start with empty visited set
      setHighlightedNodeId(null);
      setCurrentStepIndex(-1);

      for (let i = 0; i < nodesInOrder.length; i++) {
          const currentNode = nodesInOrder[i];
          setHighlightedNodeId(currentNode.id);
          setCurrentStepIndex(i);

          await new Promise(resolve => setTimeout(resolve, 600)); // Animation delay

          visited.add(currentNode.id);
          setVisitedNodeIds(new Set(visited)); // Update visited set
          setHighlightedNodeId(null); // Briefly remove highlight before next step (optional)

          if (i < nodesInOrder.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 100)); // Short pause between steps
          }
      }
      // Finished
      setCurrentStepIndex(nodesInOrder.length - 1); // Ensure final step is marked
      setIsAnimating(false);
  }, [root, traversalType, traverse]);

   // Step forward manually
   const stepForward = useCallback(() => {
       if (isAnimating) return;
       const nodesInOrder = traverse(root, traversalType);
       if (currentStepIndex < nodesInOrder.length - 1) {
           const nextIndex = currentStepIndex + 1;
           const nextNode = nodesInOrder[nextIndex];

           // Update visited up to the *next* node
           const updatedVisited = new Set(visitedNodeIds);
           updatedVisited.add(nextNode.id);
           setVisitedNodeIds(updatedVisited);

           // Highlight the next node
           setHighlightedNodeId(nextNode.id);
           setCurrentStepIndex(nextIndex);
       } else if (currentStepIndex === nodesInOrder.length - 1) {
            // If at the end, clear highlight but keep visited state
            setHighlightedNodeId(null);
       }
   }, [currentStepIndex, visitedNodeIds, isAnimating, root, traversalType, traverse]);


  const resetTraversal = useCallback(() => {
    setCurrentStepIndex(-1);
    setHighlightedNodeId(null);
    setVisitedNodeIds(new Set());
    setIsAnimating(false);
    // Recalculate steps just in case, though should be same if type didn't change
    const nodesInOrder = traverse(root, traversalType);
    setTraversalSteps(nodesInOrder.map(node => node.val));
  }, [root, traversalType, traverse]);


  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      // Adjust SVG size based on container, with min/max limits
       const container = document.getElementById("tree-visualizer-container");
       const width = container ? Math.max(300, Math.min(container.offsetWidth - 30, 1200)) : 600;
       const height = Math.max(300, Math.min(window.innerHeight * 0.5, 600)); // Use percentage of viewport height
       setSvgSize({ width, height });
    };

    handleResize(); // Initial call
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getNodeColor = (nodeId: string): string => {
      if (nodeId === highlightedNodeId) return "fill-teal-500"; // Current step highlight
      if (visitedNodeIds.has(nodeId)) return "fill-gray-600"; // Visited node
      return "fill-gray-800"; // Default node
  }

  return (
    // Dark background for the page
    <div id="tree-visualizer-container" className="min-h-screen w-screen flex flex-col items-center bg-gradient-to-br from-gray-950 to-black p-4 text-gray-300">
      {/* Dark Card */}
      <Card className="w-full max-w-4xl mx-auto bg-gray-900 border border-gray-700/50 shadow-xl rounded-lg overflow-hidden">
         {/* Dark Header */}
        <CardHeader className="bg-gray-800 border-b border-gray-700/50 text-gray-100 p-4 sm:p-5">
          <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-center">
            Binary Tree Traversal
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-5">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-center items-center flex-wrap gap-3">
            <Select
              value={traversalType}
              onValueChange={(value: TraversalType) => setTraversalType(value)}
              disabled={isAnimating}
            >
              <SelectTrigger className="w-full sm:w-[180px] bg-gray-800 border-gray-600 text-gray-300 focus:border-teal-500 focus:ring-teal-500 disabled:opacity-70">
                <SelectValue placeholder="Traversal Type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-gray-300">
                <SelectItem value="in-order" className="hover:bg-teal-900/50 focus:bg-teal-900/50">In-order</SelectItem>
                <SelectItem value="pre-order" className="hover:bg-teal-900/50 focus:bg-teal-900/50">Pre-order</SelectItem>
                <SelectItem value="post-order" className="hover:bg-teal-900/50 focus:bg-teal-900/50">Post-order</SelectItem>
              </SelectContent>
            </Select>
             <Button
                onClick={animateTraversal}
                disabled={isAnimating || currentStepIndex >= traversalSteps.length -1} // Disable if finished
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 disabled:opacity-60"
            >
                <Play size={18} />
                <span>Animate All</span>
            </Button>
            <Button
              onClick={stepForward}
              disabled={isAnimating || currentStepIndex >= traversalSteps.length - 1}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 disabled:opacity-60"
            >
              <StepForward size={18} />
              <span>Next Step</span>
            </Button>
            <Button
              onClick={resetTraversal}
              disabled={isAnimating && currentStepIndex === -1} // Disable only if animating or already reset
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 disabled:opacity-60"
            >
              <RotateCcw size={18} />
              <span>Reset</span>
            </Button>
          </div>

          {/* SVG Visualization Area */}
          <div className="flex justify-center items-center bg-black/20 rounded border border-gray-700/50 overflow-hidden" style={{ height: `${svgSize.height}px` }}>
             <svg width={svgSize.width} height={svgSize.height} >
                <g>
                    {/* Render Lines */}
                     {linePositions.map(line => (
                        <motion.line
                            key={line.key}
                            x1={line.x1}
                            y1={line.y1}
                            x2={line.x2}
                            y2={line.y2}
                            stroke="rgb(75 85 99)" // gray-600
                            strokeWidth="1.5"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.5 }}
                        />
                    ))}
                    {/* Render Nodes */}
                    {Array.from(nodePositions.values()).map(pos => (
                        <g key={pos.id}>
                             <motion.circle
                                cx={pos.x}
                                cy={pos.y}
                                r={NODE_RADIUS}
                                fill="currentColor" // Use Tailwind class via currentColor trick
                                className={getNodeColor(pos.id)}
                                stroke="rgb(100 116 139)" // gray-500
                                strokeWidth="1.5"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                            />
                            <motion.text
                                x={pos.x}
                                y={pos.y + (NODE_RADIUS / 3)} // Adjust baseline
                                textAnchor="middle"
                                fill={highlightedNodeId === pos.id || visitedNodeIds.has(pos.id) ? "white" : "rgb(203 213 225)"} // Use lighter text for active/visited
                                fontSize="11px"
                                fontWeight="medium"
                                 initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                                style={{pointerEvents: "none"}} // Prevent text from blocking circle events if any
                            >
                                {pos.val}
                            </motion.text>
                        </g>
                    ))}
                </g>
             </svg>
          </div>

          {/* Traversal Steps Display */}
          <div className="mt-4 text-center space-y-1 border-t border-gray-700/50 pt-4">
            <h3 className="text-md font-semibold text-gray-200">Traversal Order ({traversalType}):</h3>
             <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 min-h-[24px]">
                 {traversalSteps.map((val, index) => (
                    <span
                        key={index}
                        className={`font-mono px-2 py-0.5 rounded text-xs transition-colors duration-300 ${
                            index <= currentStepIndex
                                ? "bg-teal-600 text-white"
                                : "bg-gray-700 text-gray-400"
                        }`}
                    >
                        {val}
                    </span>
                 ))}
                 {traversalSteps.length === 0 && <span className="text-gray-500 text-sm">Click 'Start Traversal'</span>}
            </div>
            <p className="text-sm text-gray-500 pt-1">
                Step: {currentStepIndex + 1} / {traversalSteps.length}
             </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BinaryTreeTraversalVisualizer;