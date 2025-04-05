// src/components/Graphs/GraphVisualization.tsx
import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlgorithmStep, Graph, NodeId, PathfindingStepState, TraversalStepState, WeightedEdge } from "./Types";

// Define Node positions (could be calculated dynamically or fixed)
interface VisualNode {
    id: NodeId;
    x: number;
    y: number;
}

interface GraphVisualizationProps {
  graph: Graph;
  currentStep: AlgorithmStep | null;
  startNode: NodeId | null;
  endNode: NodeId | null; // Goal node for pathfinding
  onNodeClick: (nodeId: NodeId) => void;
  nodePositions: Map<NodeId, { x: number; y: number }>; // Receive pre-calculated positions
}

const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  graph,
  currentStep,
  startNode,
  endNode,
  onNodeClick,
  nodePositions, // Use received positions
}) => {
  const nodeRadius = 18;
  const svgWidth = 600; // Reference width for positioning
  const svgHeight = 450; // Reference height for positioning

  // Use pre-calculated positions
  const visualNodes: VisualNode[] = useMemo(() =>
     graph.nodes.map(id => ({ id, ...(nodePositions.get(id) || { x: 0, y: 0 }) })),
     [graph.nodes, nodePositions]
  );

  // --- Node Coloring Logic ---
  const getNodeColor = (nodeId: NodeId): string => {
    const isPathfinding = currentStep?.algorithm === 'dijkstra' || currentStep?.algorithm === 'astar';

    // Priority: Start/End nodes
    if (nodeId === startNode) return "#22c55e"; // Green-500 (Start)
    if (nodeId === endNode) return "#a855f7"; // Purple-500 (End)

    if (!currentStep) return "#6b7280"; // Gray-500 (Default/Idle)

    const { state, currentNode, path } = currentStep;

    // Highlight final path nodes (excluding start/end which have own colors)
    if (path && path.includes(nodeId) && nodeId !== startNode && nodeId !== endNode) {
        return "#facc15"; // Yellow-400 (Path)
    }

    // Highlight the current node being processed (if not start/end)
    if (nodeId === currentNode && nodeId !== startNode && nodeId !== endNode) return "#ef4444"; // Red-500 (Current)

    // Algorithm-specific states
    if (isPathfinding) {
      const pfState = state as PathfindingStepState;
      if (pfState.closedSet?.has(nodeId)) return "#f97316"; // Orange-500 (Closed Set)
      if (pfState.openSet?.has(nodeId)) return "#60a5fa"; // Blue-400 (Open Set)
    } else { // BFS/DFS
      const traversalState = state as TraversalStepState;
      if (traversalState.visited?.has(nodeId)) return "#f97316"; // Orange-500 (Visited)
    }

    return "#6b7280"; // Gray-500 (Default / Not yet discovered / Idle)
  };


  // --- Edge Coloring/Highlighting ---
   const getEdgeStyle = (sourceId: NodeId, targetId: NodeId): { stroke: string; strokeWidth: number; } => {
       let stroke = "#4b5563"; // Gray-600 (Default edge color)
       let strokeWidth = 1.5;
       const isPathfinding = currentStep?.algorithm === 'dijkstra' || currentStep?.algorithm === 'astar';

       // Highlight final path edges
       if (currentStep?.path) {
           const path = currentStep.path;
           const edgeIndex = path.findIndex((node, i) =>
               i < path.length - 1 &&
               ((node === sourceId && path[i+1] === targetId) || // Check forward direction
               (!graph.directed && node === targetId && path[i+1] === sourceId)) // Check reverse for undirected
           );
           if (edgeIndex !== -1) {
               stroke = "#facc15"; // Yellow-400 (Final Path Edge)
               strokeWidth = 3; // Make path edges thicker
           }
       }
       // Highlight edge being traversed or considered (from predecessor)
       else if (currentStep && isPathfinding) {
            const { state, currentNode } = currentStep;
            // Highlight edge leading *to* the current node from its predecessor
            if (currentNode === targetId) {
                const pfState = state as PathfindingStepState;
                const predecessor = pfState.predecessors?.get(currentNode);
                if (predecessor === sourceId) {
                     stroke = "#f87171"; // Red-400 (Edge leading to current processing node)
                     strokeWidth = 2.5;
                }
            }
            // Optional: Highlight edges originating *from* the current node during neighbor exploration
            // if (currentNode === sourceId && currentStep.action === "EXPLORE_NEIGHBORS") {
            //      stroke = "#fbbf24"; // Amber-400
            //      strokeWidth = 2.0;
            // }
       } else if (currentStep && !isPathfinding) {
           // Optional: Highlight edge for BFS/DFS neighbor exploration
           const { currentNode, action } = currentStep;
           if(currentNode === sourceId && (action === "ENQUEUE_NEIGHBORS" || action === "PUSH_NEIGHBORS")) {
               // Could highlight all outgoing, or just the one being added if step is more granular
               // stroke = "#fbbf24"; // Amber-400
               // strokeWidth = 2.0;
           }
       }


       return { stroke, strokeWidth };
   };

  // --- Render Edge ---
  const renderEdge = (edge: WeightedEdge) => {
    const [sourceId, targetId, weight] = edge;
    const sourceNode = visualNodes.find((n) => n.id === sourceId);
    const targetNode = visualNodes.find((n) => n.id === targetId);
    if (!sourceNode || !targetNode) return null;

    const { stroke, strokeWidth } = getEdgeStyle(sourceId, targetId);

    // Calculations for positioning (arrowhead, padding etc.)
     const dx = targetNode.x - sourceNode.x;
     const dy = targetNode.y - sourceNode.y;
     const angle = Math.atan2(dy, dx);
     const distance = Math.sqrt(dx * dx + dy * dy);

     // Adjust padding based on whether it's directed for arrowhead space
     const endPadding = nodeRadius + (graph.directed ? 7 : 3); // More padding for arrowhead
     const targetX = targetNode.x - endPadding * Math.cos(angle);
     const targetY = targetNode.y - endPadding * Math.sin(angle);

      const startPadding = nodeRadius + 3;
      const sourceX = sourceNode.x + startPadding * Math.cos(angle);
      const sourceY = sourceNode.y + startPadding * Math.sin(angle);

     // Avoid drawing if nodes overlap too much after padding
     if (distance <= startPadding + endPadding) return null;

     // Calculate midpoint for weight label
     const midX = sourceX + (targetX - sourceX) / 2;
     const midY = sourceY + (targetY - sourceY) / 2;
     // Small offset perpendicular to the edge for the label
     const offsetX = 10 * Math.sin(angle); // Increased offset
     const offsetY = -10 * Math.cos(angle); // Increased offset


    return (
      <g key={`${sourceId}-${targetId}-${weight}-${graph.directed}`}> {/* Key includes directionality */}
        {/* Edge Line */}
        <motion.line
          x1={sourceX}
          y1={sourceY}
          x2={targetX}
          y2={targetY}
          stroke={stroke}
          strokeWidth={strokeWidth}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4 }}
          markerEnd={graph.directed ? `url(#arrowhead-${stroke.replace('#', '')})` : undefined} // Dynamic arrowhead marker
        />

        {/* Arrowhead Definition (if directed) - Defined once in SVG defs */}
        {/* Actual arrowhead is applied via markerEnd */}

        {/* Edge Weight Label */}
         <text
            x={midX + offsetX}
            y={midY + offsetY}
            textAnchor="middle"
            dy=".3em"
            fontSize="10px"
            fill="#a1a1aa" // gray-400
            className="pointer-events-none" // Prevent blocking clicks
         >
             {weight}
         </text>
      </g>
    );
  };

    // --- Render Node ---
    const renderNode = (node: VisualNode) => {
        const { id, x, y } = node;
        const nodeColor = getNodeColor(id);
        const isCurrent = id === currentStep?.currentNode;
        const isStartOrEnd = id === startNode || id === endNode;
        const isPathfinding = currentStep?.algorithm === 'dijkstra' || currentStep?.algorithm === 'astar';

        // Get distance/cost to display (if pathfinding)
        let costText: string | null = null;
        if (currentStep && isPathfinding) {
             const pfState = currentStep.state as PathfindingStepState;
             const dist = pfState.distances?.get(id); // g-score

             if (dist !== undefined && dist !== Infinity) {
                 // For A*, show f = g + h (or just f) if available
                 if (currentStep.algorithm === 'astar' && pfState.fCosts) {
                    const fCost = pfState.fCosts.get(id);
                    const hCost = pfState.hCosts?.get(id); // Get h for display
                    if (fCost !== undefined && fCost !== Infinity) {
                         // Show f, g, h
                         costText = `f:${fCost.toFixed(1)}`;
                         // Optionally add g and h below or next to it
                         costText += ` (g:${dist.toFixed(1)}, h:${hCost?.toFixed(1) ?? '?'})`;
                    } else {
                        costText = `g:${dist.toFixed(1)}`; // Fallback if fCost invalid
                    }
                 } else { // Dijkstra just shows distance
                     costText = `d:${dist.toFixed(1)}`;
                 }
             } else if (dist === Infinity) {
                  costText = "∞"; // Show infinity symbol
             }
             // Only show cost if node is in open/closed set or is start/end? (optional refinement)
             // if (!pfState.openSet.has(id) && !pfState.closedSet.has(id) && id !== startNode) {
             //    costText = null;
             // }
        }

        return (
             <motion.g
              key={id}
              onClick={(e) => { e.stopPropagation(); onNodeClick(id); }}
              style={{ cursor: "pointer" }}
              className="transition-transform duration-150 ease-in-out hover:scale-110"
              initial={{ opacity: 0 }} // Fade in group
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Pulse animation for current node or start/end when idle */}
               {(isCurrent || (isStartOrEnd && !currentStep?.currentNode && !currentStep?.path)) && ( // Pulse start/end before run, or current during run
                <motion.circle cx={x} cy={y} r={nodeRadius + 2} fill="none" stroke={nodeColor} strokeWidth={1.5}
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                />
              )}

              {/* Main node circle */}
              <motion.circle cx={x} cy={y} r={nodeRadius} fill={nodeColor} stroke="#1f2937" strokeWidth={1.5}
                // Animate scale on creation?
                // initial={{ scale: 0 }}
                // animate={{ scale: 1 }}
                // transition={{ type: "spring", stiffness: 260, damping: 20 }}
              />

              {/* Node ID Label */}
              <text x={x} y={y} textAnchor="middle" dy=".35em" fill="#f3f4f6" fontSize="12px" fontWeight="bold" className="pointer-events-none select-none">
                {id}
              </text>

              {/* Cost Label (below node) */}
              {costText && (
                   <motion.text x={x} y={y + nodeRadius + 10} textAnchor="middle" fill="#cbd5e1" // slate-300
                    fontSize="9px" className="pointer-events-none select-none font-mono"
                    initial={{ opacity: 0, y: y + nodeRadius + 5 }} // Animate from slightly higher
                    animate={{ opacity: 1, y: y + nodeRadius + 10 }}
                    transition={{ delay: 0.1, duration: 0.3 }}>
                      {costText}
                   </motion.text>
              )}
            </motion.g>
        );
    };


  return (
    <svg
       width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`}
       preserveAspectRatio="xMidYMid meet" style={{ background: "#111827", borderRadius: '0.5rem' }}
       className="overflow-hidden"
    >
      {/* Define arrowhead marker */}
      <defs>
         {/* Generate markers for different potential stroke colors used */}
         {["4b5563", "facc15", "f87171"].map(colorHex => (
            <marker
                key={colorHex}
                id={`arrowhead-${colorHex}`}
                viewBox="0 0 10 10"
                refX="8" // Position arrowhead slightly before the end point
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={`#${colorHex}`} />
            </marker>
         ))}
      </defs>
      {/* Render Edges First */}
      <g>
        <AnimatePresence>{graph.edges.map(renderEdge)}</AnimatePresence>
      </g>
      {/* Render Nodes Second (on top) */}
      <g>
        <AnimatePresence>{visualNodes.map(renderNode)}</AnimatePresence>
      </g>
    </svg>
  );
};

export default GraphVisualization;