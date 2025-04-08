// src/components/Graphs/ExplanationPanel.tsx
import React from "react";
import { AlertCircle, List, CheckCircle, Target, Sigma, BrainCircuit } from "lucide-react";
import { AlgorithmStep, NodeId, PathfindingStepState, TraversalStepState, AlgorithmType } from "./Types";

interface ExplanationPanelProps {
  currentStep: AlgorithmStep | null;
  stepNumber: number; // 0-based index
  totalSteps: number;
}

// --- Helper Functions --- (Can be outside component if pure)

const getPseudoCode = (algorithmType: AlgorithmType): string[] => {
    switch(algorithmType) {
        case 'bfs': return [
            "function BFS(graph, start):",                // 0
            "  queue = new Queue()",                      // 1
            "  visited = new Set()",                      // 2
            "  queue.enqueue(start)",                     // 3
            "  visited.add(start)",                       // 4
            "  while queue is not empty:",                // 5
            "    curr = queue.dequeue()",                 // 6
            "    // Process curr (e.g., visit)",          // 7
            "    for neighbor in graph.neighbors(curr):", // 8
            "      if neighbor not visited:",             // 9
            "        visited.add(neighbor)",              // 10
            "        queue.enqueue(neighbor)",            // 11
            "  // Traversal complete",                     // 12
        ];
        case 'dfs': return [ // Iterative DFS
            "function DFS(graph, start):",                // 0
            "  stack = new Stack()",                      // 1
            "  visited = new Set()",                      // 2
            "  stack.push(start)",                        // 3
            "  while stack is not empty:",                // 4
            "    curr = stack.pop()",                     // 5
            "    if curr not visited:",                   // 6
            "      visited.add(curr)",                    // 7
            "      // Process curr (e.g., visit)",       // 8
            "      // Add neighbors in reverse order for typical exploration", // 9
            "      for neighbor in reversed(graph.neighbors(curr)):", // 10
            "        if neighbor not visited:",           // 11 (Optional check before push)
            "          stack.push(neighbor)",             // 12
            "  // Traversal complete",                     // 13
        ];
        case 'dijkstra': return [
            "function Dijkstra(graph, start, goal):",           // 0
            "  dist = map(node -> infinity)",                   // 1
            "  prev = map(node -> null)",                     // 2
            "  dist[start] = 0",                               // 3
            "  pq = PriorityQueue()",                         // 4 (Conceptually)
            "  pq.add(start, 0)",                             // 5
            "  closedSet = set()",                            // 6
            "  while pq is not empty:",                       // 7
            "    curr = pq.extract_min()",                    // 8
            "    if curr == goal: return reconstruct_path(prev, goal)", // 9
            "    closedSet.add(curr)",                         // 10
            "    for neighbor, weight in graph.neighbors(curr):", // 11
            "      if neighbor not in closedSet:",             // 12
            "        alt_dist = dist[curr] + weight",         // 13
            "        if alt_dist < dist[neighbor]:",          // 14
            "          dist[neighbor] = alt_dist",            // 15
            "          prev[neighbor] = curr",                // 16
            "          pq.update_or_add(neighbor, alt_dist)", // 17
            "  // Goal not reachable",                           // 18
        ];
        case 'astar': return [
            "function A*(graph, start, goal, h):",             // 0
            "  gScore = map(node -> infinity)",                 // 1
            "  fScore = map(node -> infinity)",                 // 2
            "  prev = map(node -> null)",                     // 3
            "  gScore[start] = 0",                             // 4
            "  fScore[start] = h(start)",                      // 5
            "  openSet = PriorityQueue()",                    // 6 (Conceptually)
            "  openSet.add(start, fScore[start])",            // 7
            "  closedSet = set()",                            // 8
            "  while openSet is not empty:",                  // 9
            "    curr = openSet.extract_min()",               // 10 (Node with lowest fScore)
            "    if curr == goal: return reconstruct_path(prev, goal)", // 11
            "    closedSet.add(curr)",                        // 12
            "    for neighbor, weight in graph.neighbors(curr):",// 13
            "      if neighbor in closedSet: continue",       // 14
            "      tentative_gScore = gScore[curr] + weight", // 15
            "      if tentative_gScore < gScore[neighbor]:", // 16 (Found better path)
            "        prev[neighbor] = curr",               // 17
            "        gScore[neighbor] = tentative_gScore", // 18
            "        fScore[neighbor] = tentative_gScore + h(neighbor)", // 19
            "        if neighbor not in openSet:",         // 20
            "          openSet.add(neighbor, fScore[neighbor])",// 21
            "        // else: openSet already has neighbor, priority updated implicitly", // 22
            "  // Goal not reachable",                           // 23
        ];
        default: return ["Algorithm not recognized"];
    }
};

 const getActiveLineIndex = (step: AlgorithmStep | null): number => {
     if (!step) return -1;
     const { algorithm, action } = step;

     // NOTE: This mapping is an approximation and depends heavily on how
     // granular the `action` strings are from the algorithm implementation.
     switch (algorithm) {
         case 'bfs':
             if (action === "INITIAL") return 4; // visited.add(start)
             if (action === "DEQUEUE / VISIT") return 6; // curr = queue.dequeue()
             if (action === "ENQUEUE_NEIGHBORS") return 11; // queue.enqueue(neighbor)
             if (action === "FINISHED") return 12;
             return 5; // Default to while loop
         case 'dfs':
             if (action === "INITIAL") return 3; // stack.push(start)
             if (action === "POP") return 5; // curr = stack.pop()
             if (action === "VISIT") return 7; // visited.add(curr)
             if (action === "PUSH_NEIGHBORS") return 12; // stack.push(neighbor)
             if (action === "ALREADY_VISITED") return 6; // if curr not visited:
             if (action === "FINISHED") return 13;
             return 4; // Default to while loop
          case 'dijkstra':
              if (action === "INITIALIZE") return 3; // dist[start] = 0
              if (action === "EXTRACT_MIN") return 8; // curr = pq.extract_min()
              if (action === "GOAL_FOUND") return 9; // if curr == goal
              if (action === "EXPLORE_NEIGHBORS") return 11; // for neighbor... (could also be 14/15/16/17 depending on granularity)
              // If steps were added per-update:
              // if (action === "UPDATE_DISTANCE") return 15; // dist[neighbor] = alt_dist
              if (action === "NO_PATH") return 18;
              return 7; // Default to while loop
          case 'astar':
               if (action === "INITIALIZE") return 4; // gScore[start] = 0 (or 5)
               if (action === "EXTRACT_MIN") return 10; // curr = openSet.extract_min()
               if (action === "GOAL_FOUND") return 11; // if curr == goal
               if (action === "EXPLORE_NEIGHBORS") return 13; // for neighbor... (or 16/18/19/21)
                // If steps were added per-update:
               // if (action === "UPDATE_G_SCORE") return 18; // gScore[neighbor] = tentative_gScore
               if (action === "NO_PATH") return 23;
               return 9; // Default to while loop
         default: return -1;
     }
 };

 // Helper to format Maps/Sets for display
 const formatMap = (map: Map<NodeId, number | null> | undefined, limit: number, prefix = "", sort: 'key' | 'value' | 'none' = 'key') => {
      if (!map || map.size === 0) return "[ ]";
      let entries = Array.from(map.entries())
            .filter(([, val]) => val !== Infinity && val !== null); // Filter out Infinity/null

      if (sort === 'value') {
           entries = entries.sort(([,a], [,b]) => (a ?? 0) - (b ?? 0)); // Sort by value (numeric)
      } else if (sort === 'key') {
           entries = entries.sort(([keyA], [keyB]) => keyA.localeCompare(keyB)); // Sort by key (string)
      }
      // else 'none'

      const limitedEntries = entries.slice(0, limit);
      let str = limitedEntries.map(([key, val]) => `${key}:${prefix}${typeof val === 'number' ? val.toFixed(1) : val}`).join(', ');
      if (map.size > limit) str += ', ...';
      return `[ ${str} ]`;
  };

   const formatSet = (set: Set<NodeId> | undefined, limit: number) => {
       if (!set || set.size === 0) return "[ ]";
       const entries = Array.from(set).sort().slice(0, limit); // Sort keys alphabetically
       let str = entries.join(', ');
       if (set.size > limit) str += ', ...';
       return `[ ${str} ]`;
   };

// --- Component ---
const ExplanationPanel: React.FC<ExplanationPanelProps> = ({
  currentStep,
  stepNumber, // 0-based index
  totalSteps,
}) => {

  // --- Error / Initial State ---
  if (!currentStep || totalSteps === 0 || currentStep.action?.includes("ERROR")) {
    const message = currentStep?.action?.includes("ERROR")
      ? currentStep.action
      : "Select algorithm, start/end nodes (if applicable), and run.";
     return (
       <div className="h-full mt-4 lg:mt-0 p-4 bg-gray-800 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center text-center text-gray-400">
         <AlertCircle className="mb-3 h-8 w-8 text-yellow-500" />
         <p>{message}</p>
       </div>
     );
  }

  // --- Current Step Data ---
  const { algorithm, currentNode, action, state, path, goalNode } = currentStep;
  const isFinished = action === "FINISHED" || action === "GOAL_FOUND" || action === "NO_PATH";
  const isPathfinding = algorithm === 'dijkstra' || algorithm === 'astar';
  const displayStepNumber = stepNumber + 1; // User-facing step number (1-based)

  // --- Explanation Text Logic ---
  const getExplanation = (): string => {
    // Generic Finish States
    if (action === "GOAL_FOUND") return `Goal node ${goalNode} reached! Path found.`;
    if (action === "FINISHED") return `${algorithm.toUpperCase()} traversal complete. All reachable nodes visited.`;
    if (action === "NO_PATH") return `Goal node ${goalNode} is not reachable from the start node.`;

    // Algorithm Specific Explanations
    switch (algorithm) {
        case 'bfs': {
            const { queue = [] } = state as TraversalStepState;
            const qStr = `[${queue.join(', ')}]`;
            if (action === "INITIAL") return `Start BFS at ${currentNode}. Add to queue. Queue: ${qStr}`;
            if (action === "DEQUEUE / VISIT") return `Dequeue ${currentNode}. Process neighbors. Queue: ${qStr}`;
            if (action === "ENQUEUE_NEIGHBORS") return `Enqueue unvisited neighbors of ${currentNode}. Queue: ${qStr}`;
            break;
        }
        case 'dfs': {
            const { stack = [] } = state as TraversalStepState;
            const sStr = `[${stack.join(', ')}]`;
            if (action === "INITIAL") return `Start DFS at ${currentNode}. Push onto stack. Stack: ${sStr}`;
            if (action === "POP") return `Pop ${currentNode} from stack. Stack: ${sStr}`;
            if (action === "VISIT") return `Visit ${currentNode}. Add neighbors to stack. Stack: ${sStr}`;
            if (action === "PUSH_NEIGHBORS") return `Push unvisited neighbors of ${currentNode} onto stack. Stack: ${sStr}`;
            if (action === "ALREADY_VISITED") return `${currentNode} already visited. Skip. Stack: ${sStr}`;
            break;
        }
        case 'dijkstra':
        case 'astar': {
             const pfState = state as PathfindingStepState;
             const dist = currentNode ? (pfState.distances.get(currentNode) ?? Infinity) : Infinity;
             const gScore = dist; // gScore is distance for A*
             const hScore = (algorithm === 'astar' && currentNode && pfState.hCosts) ? (pfState.hCosts.get(currentNode) ?? Infinity) : null;
             const fScore = (algorithm === 'astar' && currentNode && pfState.fCosts) ? (pfState.fCosts.get(currentNode) ?? Infinity) : null;

             if (action === "INITIALIZE") return `Initialize. Start node ${currentNode} distance = 0. Add to Open Set.`;
             if (action === "EXTRACT_MIN") {
                 let text = `Select node ${currentNode} with lowest cost from Open Set. `;
                 if(algorithm === 'dijkstra') text += `d[${currentNode}]=${dist.toFixed(1)}. Move to Closed Set.`;
                 if(algorithm === 'astar' && fScore !== null && gScore !== null && hScore !== null) text += `f[${currentNode}]=${fScore.toFixed(1)} (g=${gScore.toFixed(1)}, h=${hScore.toFixed(1)}). Move to Closed Set.`;
                 return text;
             }
             if (action === "EXPLORE_NEIGHBORS") {
                 // This action implies distances *might* have been updated.
                 return `Explore neighbors of ${currentNode}. Update distances/scores if shorter path found.`;
                 // Ideally, the action would be more specific like "UPDATE_DISTANCE" or "UPDATE_G_SCORE"
                 // and potentially include which neighbor was updated.
             }
             // Example if more granular actions were added:
             // if (action === "UPDATE_DISTANCE") return `Update distance for neighbor X via ${currentNode}. New d[X]=Y.`;
             // if (action === "UPDATE_G_SCORE") return `Update scores for neighbor X via ${currentNode}. New g[X]=Y, f[X]=Z.`;
            break;
        }
    }
     // Default fallback if no specific explanation matches
     return `Action: ${action}${currentNode ? `, Node: ${currentNode}` : ''}`;
  };


  // --- Data Display (Distances, Sets) ---
  const renderAlgorithmData = () => {
      const dataLimit = 7; // Max items to show per list

      if (algorithm === 'bfs' || algorithm === 'dfs') {
          const { visited, queue, stack } = state as TraversalStepState;
          const structure = algorithm === 'bfs' ? queue : stack;
          const structureName = algorithm === 'bfs' ? 'Queue' : 'Stack';
          const structureContent = structure ? formatSet(new Set(structure), dataLimit) : '[ ]'; // Use formatSet for consistency
          return (
              <div className="text-xs mt-3 space-y-1 text-gray-400 font-mono">
                   <p><span className="font-semibold text-gray-300">Visited:</span> {formatSet(visited, dataLimit)}</p>
                   <p><span className="font-semibold text-gray-300">{structureName}:</span> {structureContent}</p>
              </div>
          );
      } else if (isPathfinding) {
          const { distances, openSet, closedSet, fCosts, hCosts } = state as PathfindingStepState;
          return (
            <div className="text-xs mt-3 space-y-1 text-gray-400 font-mono">
                 <p><span className="font-semibold text-blue-300">Open Set:</span> {formatSet(openSet, dataLimit)}</p>
                 <p><span className="font-semibold text-orange-300">Closed Set:</span> {formatSet(closedSet, dataLimit)}</p>
                 <p><span className="font-semibold text-green-300">Dist (g):</span> {formatMap(distances, dataLimit, "d=", 'value')}</p>
                 {algorithm === 'astar' && fCosts && <p><span className="font-semibold text-purple-300">fCosts (g+h):</span> {formatMap(fCosts, dataLimit, "f=", 'value')}</p>}
                 {/* Optionally show hCosts - uncomment if needed */}
                 {algorithm === 'astar' && hCosts && <p><span className="font-semibold text-gray-300">hCosts:</span> {formatMap(hCosts, dataLimit, "h=")}</p>}
                 {/* Optionally show Predecessors */}
                 {/* <p><span className="font-semibold text-gray-300">Prev:</span> {formatMap(predecessors, dataLimit)}</p> */}
            </div>
          );
      }
      return null;
  };

  return (
    <div className="h-full p-4 bg-gray-800 rounded-lg border border-gray-700/50 text-gray-300 flex flex-col">
      {/* Header */}
      <h3 className="text-base sm:text-lg font-semibold mb-2 border-b border-gray-700 pb-2 flex items-center justify-between">
        <div className="flex items-center">
            {/* Icon based on algorithm */}
            {(algorithm === 'bfs' || algorithm === 'dfs') && <BrainCircuit className="mr-2 h-5 w-5 text-blue-400 flex-shrink-0"/>}
            {algorithm === 'dijkstra' && <Sigma className="mr-2 h-5 w-5 text-green-400 flex-shrink-0"/>}
            {algorithm === 'astar' && <Target className="mr-2 h-5 w-5 text-purple-400 flex-shrink-0"/>}
            Explanation
        </div>
         {totalSteps > 0 && <span className="text-xs font-normal text-gray-400">{`Step ${displayStepNumber} / ${totalSteps}`}</span>}
      </h3>

      {/* Status Message / Explanation */}
      <div className="mb-2 text-sm min-h-[40px] flex items-start">
        {isFinished ? (
           <CheckCircle className="mr-2 h-5 w-5 text-green-400 flex-shrink-0 mt-0.5"/>
        ) : (
           <div className="w-5 h-5 mr-2 flex-shrink-0"></div> // Placeholder for alignment
        )}
        <span className={isFinished ? 'text-green-300' : 'text-gray-200'}>{getExplanation()}</span>
      </div>


       {/* Final Path Display */}
       {path && path.length > 0 && (
           <div className="mb-3 text-sm">
               <span className="font-medium text-yellow-300">Path Found: </span>
               <span className="font-mono text-yellow-400">{path.join(' → ')}</span>
               {/* Show total cost for pathfinding */}
               {isPathfinding && goalNode && (state as PathfindingStepState).distances?.get(goalNode) !== undefined && (state as PathfindingStepState).distances.get(goalNode) !== Infinity &&
                   <span className="ml-2 text-gray-400">(Cost: {(state as PathfindingStepState).distances.get(goalNode)?.toFixed(1)})</span>
               }
           </div>
       )}

      {/* Display current algorithm state data */}
      {renderAlgorithmData()}


      {/* Pseudo-code Section */}
      <div className="flex-grow mt-4 pt-3 border-t border-gray-700/50 flex flex-col min-h-[150px]">
          <h4 className="font-semibold mb-2 text-gray-400 flex items-center text-sm">
              <List className="mr-2 h-4 w-4"/> Pseudo-code ({algorithm.toUpperCase()})
          </h4>
          <div className="flex-grow bg-gray-900 p-3 rounded border border-gray-700/80 overflow-auto relative">
              <pre className="text-xs sm:text-sm leading-relaxed font-mono whitespace-pre-wrap">
                {getPseudoCode(algorithm).map((line, index) => (
                  <div
                    key={index}
                    className={`px-2 py-0.5 rounded transition-colors duration-200 ${
                      index === getActiveLineIndex(currentStep)
                        ? "bg-blue-900/70 text-blue-100 font-medium" // Brighter highlight
                        : "text-gray-400 hover:bg-gray-700/30" // Subtle hover
                    }`}
                  >
                    {/* Preserve indentation using non-breaking spaces */}
                    {line.replace(/^(\s+)/, (match) => '\u00A0'.repeat(match.length))}
                  </div>
                ))}
              </pre>
          </div>
      </div>
    </div>
  );
};

export default ExplanationPanel;