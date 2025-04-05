// src/components/Graphs/Types.ts

// Basic Types
export type NodeId = string;
// Edge now includes weight
export type WeightedEdge = [string, string, number]; // [sourceId, targetId, weight]

// Graph Structure
export interface Graph {
  nodes: NodeId[];
  edges: WeightedEdge[];
  directed: boolean;
}

// Algorithm Types
export type AlgorithmType = 'bfs' | 'dfs' | 'dijkstra' | 'astar';

// --- States for Different Algorithms ---

// State for BFS/DFS
export interface TraversalStepState {
  visited: Set<NodeId>;
  queue?: NodeId[]; // For BFS
  stack?: NodeId[]; // For DFS
}

// State for Dijkstra/A*
export interface PathfindingStepState {
  distances: Map<NodeId, number>; // g-score for A*
  predecessors: Map<NodeId, NodeId | null>;
  openSet: Set<NodeId>;    // Nodes currently considered (priority queue conceptually)
  closedSet: Set<NodeId>;  // Nodes already finalized/visited
  hCosts?: Map<NodeId, number>; // Heuristic costs (for A*)
  fCosts?: Map<NodeId, number>; // f-scores (g+h) (for A*)
}

// Algorithm Step Definition (Unified)
export interface AlgorithmStep {
  algorithm: AlgorithmType;
  currentNode: NodeId | null; // The node primarily involved in this step
  action: string; // Describes the operation (e.g., "INITIALIZE", "VISIT", "EXTRACT_MIN", "UPDATE_DISTANCE", "GOAL_FOUND", "FINISHED", "ERROR")
  state: TraversalStepState | PathfindingStepState; // Snapshot of the algorithm's state *after* the action
  path?: NodeId[]; // Stores the final path when found (for pathfinding)
  goalNode?: NodeId | null; // Target node for pathfinding algorithms
  // Optional: Add specific details for explanation if needed
  // e.g., updatedNeighbor?: NodeId; newDistance?: number;
}

// --- Sample Graphs (Weighted) ---

export const directedWeightedGraph: Graph = {
  nodes: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], // Added G
  edges: [
    ['A', 'B', 4], ['A', 'C', 2],
    ['B', 'E', 3],
    ['C', 'D', 2], ['C', 'F', 4],
    ['D', 'F', 1], ['D', 'G', 5], // Added edge
    ['E', 'F', 2],
    ['F', 'G', 3], // Added edge
  ],
  directed: true
};

export const nonDirectedWeightedGraph: Graph = {
    nodes: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], // Added G
    edges: [ // Same edges, but interpretation changes due to directed=false
      ['A', 'B', 4], ['A', 'C', 2],
      ['B', 'E', 3],
      ['C', 'D', 2], ['C', 'F', 4],
      ['D', 'F', 1], ['D', 'G', 5], // Added edge
      ['E', 'F', 2],
      ['F', 'G', 3], // Added edge
    ],
  directed: false
};

// Initial/Default Graph
export const initialGraph: Graph = nonDirectedWeightedGraph; // Start with non-directed weighted