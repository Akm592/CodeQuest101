import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Node {
  id: string;
  x: number;
  y: number;
}

interface Edge {
  source: string;
  target: string;
}

interface Graph {
  nodes: string[];
  edges: [string, string][];
  directed: boolean;
}

interface TraversalStep {
  visited: string[];
  queue?: string[];
  stack?: string[];
  currentNode: string;
}

interface GraphVisualizationProps {
  graph: Graph;
  currentStep: number;
  traversalSteps: TraversalStep[];
  onNodeClick: (nodeId: string) => void;
  startNode: string | null;
}

const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  graph,
  currentStep,
  traversalSteps,
  onNodeClick,
  startNode,
}) => {
  const [visualGraph, setVisualGraph] = useState<{
    nodes: Node[];
    edges: Edge[];
  }>({ nodes: [], edges: [] });

  const nodeRadius = 16;
  const svgWidth = 600;
  const svgHeight = 400;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;
  const radius = Math.min(svgWidth, svgHeight) / 2 - nodeRadius - 20;

  useEffect(() => {
    const nodes: Node[] = graph.nodes.map((id, index) => {
      const angle = (index / graph.nodes.length) * 2 * Math.PI;
      return {
        id,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    const edges: Edge[] = graph.edges.map(([source, target]) => ({
      source,
      target,
    }));

    setVisualGraph({ nodes, edges });
  }, [graph]);

  const currentNode = traversalSteps[currentStep]?.currentNode;

  const getNodeColor = (nodeId: string) => {
    if (nodeId === startNode) {
      return "#4CAF50"; // Green for start node
    }
    if (nodeId === currentNode) {
      return "#F44336"; // Red for current node
    }
    if (traversalSteps[currentStep]?.visited.includes(nodeId)) {
      return "#FFA726"; // Orange for visited nodes
    }
    return "#2196F3"; // Blue for unvisited nodes
  };

  const getEdgeColor = (source: string, target: string) => {
    const isVisited =
      traversalSteps[currentStep]?.visited.includes(source) &&
      traversalSteps[currentStep]?.visited.includes(target);
    return isVisited ? "#FFA726" : "#E0E0E0"; // Orange for visited edges, Light gray for unvisited
  };

  const renderEdge = (edge: Edge) => {
    const sourceNode = visualGraph.nodes.find(
      (node) => node.id === edge.source
    );
    const targetNode = visualGraph.nodes.find(
      (node) => node.id === edge.target
    );
    if (!sourceNode || !targetNode) return null;

    const edgeColor = getEdgeColor(edge.source, edge.target);

    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    const angle = Math.atan2(dy, dx);
    const distance = Math.sqrt(dx * dx + dy * dy);
    const targetX =
      sourceNode.x + (distance - nodeRadius - 2) * Math.cos(angle);
    const targetY =
      sourceNode.y + (distance - nodeRadius - 2) * Math.sin(angle);

    return (
      <g key={`${edge.source}-${edge.target}`}>
        <motion.line
          x1={sourceNode.x}
          y1={sourceNode.y}
          x2={targetX}
          y2={targetY}
          stroke={edgeColor}
          strokeWidth={1.5}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5 }}
        />
        {graph.directed && (
          <motion.path
            d={`M ${targetX} ${targetY} l -8 -4 l 0 8 z`}
            fill={edgeColor}
            transform={`rotate(${
              (angle * 180) / Math.PI + 90
            } ${targetX} ${targetY})`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          />
        )}
      </g>
    );
  };

  return (
    <svg width={svgWidth} height={svgHeight} style={{ background: "#FAFAFA" }}>
      <AnimatePresence>{visualGraph.edges.map(renderEdge)}</AnimatePresence>

      <AnimatePresence>
        {visualGraph.nodes.map((node) => {
          const isCurrentNode = node.id === currentNode;
          const isVisitedNode = traversalSteps[currentStep]?.visited.includes(
            node.id
          );
          const isStartNode = node.id === startNode;

          return (
            <motion.g
              key={node.id}
              onClick={() => onNodeClick(node.id)}
              style={{ cursor: "pointer" }}
            >
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={nodeRadius}
                fill={getNodeColor(node.id)}
                stroke="#FFFFFF"
                strokeWidth={2}
                initial={{ scale: 0 }}
                animate={{
                  scale: isCurrentNode || isStartNode ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  scale: {
                    repeat: isCurrentNode || isStartNode ? Infinity : 0,
                    duration: 0.7,
                  },
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
              />
              {(isVisitedNode || isStartNode) && (
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeRadius}
                  fill="none"
                  stroke={getNodeColor(node.id)}
                  strokeWidth={1}
                  initial={{ scale: 1, opacity: 0.7 }}
                  animate={{ scale: 1.3, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
              <motion.text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dy=".3em"
                fill="#FFFFFF"
                fontSize="12px"
                fontWeight="bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {node.id}
              </motion.text>
            </motion.g>
          );
        })}
      </AnimatePresence>
    </svg>
  );
};

export default GraphVisualization;
