// src/components/GraphTraversalVisualizer.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";

// Import Components (adjust paths if needed)
import GraphVisualization from "./Graphs/GraphVisualization";
import AlgorithmControls from "./Graphs/AlgorithmControls"; // Renamed Control component
import ExplanationPanel from "./Graphs/ExplanationPanel";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"; // Assuming shadcn/ui

// Import Types and Sample Graph Data
import {
    NodeId, Graph, AlgorithmType, AlgorithmStep,
    PathfindingStepState,
    directedWeightedGraph, nonDirectedWeightedGraph, initialGraph
} from "./Graphs/Types";


// --- Constants ---
const DEFAULT_SPEED_MS = 800; // Slightly slower default
const SVG_WIDTH = 600; // Reference width for position calculation
const SVG_HEIGHT = 450; // Reference height for position calculation
const NODE_RADIUS = 18; // Consistent radius

// --- Helper: Calculate Node Positions --- (Can be moved to a utils file)
const calculateNodePositions = (nodes: NodeId[], svgWidth: number, svgHeight: number): Map<NodeId, { x: number, y: number }> => {
    const positions = new Map<NodeId, { x: number, y: number }>();
    const nodeCount = nodes.length;
    if (nodeCount === 0) return positions;

    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;
    const radius = Math.min(svgWidth, svgHeight) / 2.3 - NODE_RADIUS; // Adjusted radius slightly

    // Handle single node case
    if (nodeCount === 1) {
        positions.set(nodes[0], { x: centerX, y: centerY });
        return positions;
    }

    // Position nodes in a circle
    nodes.forEach((id, index) => {
        const angle = (index / nodeCount) * 2 * Math.PI - Math.PI / 2; // Start from top
        positions.set(id, {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
        });
    });
    return positions;
};


// --- Main Component ---
const GraphTraversalVisualizer: React.FC = () => {
    const [isClient, setIsClient] = useState(false);
    const [graph, setGraph] = useState<Graph>(initialGraph);
    const [algorithmType, setAlgorithmType] = useState<AlgorithmType>("bfs");
    const [currentStepIndex, setCurrentStepIndex] = useState(-1); // Start at -1 (no step)
    const [steps, setSteps] = useState<AlgorithmStep[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [speed, setSpeed] = useState(DEFAULT_SPEED_MS);
    const [startNode, setStartNode] = useState<NodeId | null>(null);
    const [endNode, setEndNode] = useState<NodeId | null>(null);

    // --- Memoized Calculations ---

    // Adjacency List (Weighted)
    const adj = useMemo(() => {
        const map = new Map<NodeId, { neighbor: NodeId; weight: number }[]>();
        graph.nodes.forEach(node => map.set(node, []));
        graph.edges.forEach(([u, v, weight]) => {
            // Ensure nodes exist before adding edges
            if (map.has(u) && map.has(v)) {
                map.get(u)?.push({ neighbor: v, weight });
                if (!graph.directed && u !== v) { // Add reverse edge for undirected, avoid self-loops
                    map.get(v)?.push({ neighbor: u, weight });
                }
            } else {
                console.warn(`Edge [${u}, ${v}] refers to non-existent node(s). Skipping.`);
            }
        });
        // Sort neighbors alphabetically by ID for consistent traversal order (optional but good practice)
        map.forEach((neighbors) => neighbors.sort((a, b) => a.neighbor.localeCompare(b.neighbor)));
        return map;
    }, [graph]);

    // Node Positions
    const nodePositions = useMemo(() =>
        calculateNodePositions(graph.nodes, SVG_WIDTH, SVG_HEIGHT),
        [graph.nodes] // Recalculate only when nodes change
    );

    // --- Effects ---

    // Set initial state on client mount
    useEffect(() => {
        setIsClient(true);
        // Set default start/end nodes based on the initial graph
        if (initialGraph.nodes.length > 0) {
            const defaultStart = initialGraph.nodes[0];
            setStartNode(defaultStart);
            if (initialGraph.nodes.length > 1) {
                // Try to find a different node for the end
                const defaultEnd = initialGraph.nodes.find(n => n !== defaultStart) ?? initialGraph.nodes[1];
                setEndNode(defaultEnd);
            }
        }
    }, []);

    // Timer for automatic stepping
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        const canStepForward = currentStepIndex < steps.length - 1;

        if (isRunning && !isPaused && canStepForward) {
            timer = setTimeout(() => {
                setCurrentStepIndex((prev) => prev + 1);
            }, speed);
        } else if (isRunning && !isPaused && !canStepForward && steps.length > 0) {
            // Auto-stop when finished
            setIsRunning(false);
            setIsPaused(false);
        }

        return () => clearTimeout(timer);
    }, [isRunning, isPaused, currentStepIndex, steps, speed]);


    // --- Callbacks ---

    // Reset Algorithm State
    const resetAlgorithm = useCallback(() => {
        setCurrentStepIndex(-1); // Reset to before the first step
        setSteps([]);
        setIsRunning(false);
        setIsPaused(false);
        // Keep graph, nodes, start/end, algo type, speed selected
    }, []);

    // Toggle Graph Directionality
    const toggleDirected = useCallback(() => {
        if (isRunning && !isPaused) return; // Prevent change during active run
        setGraph((prevGraph) => {
            const newGraphData = prevGraph.directed ? nonDirectedWeightedGraph : directedWeightedGraph;
            const newGraph = { ...newGraphData }; // Create new object instance
            // Re-validate start/end nodes
            const currentStart = startNode;
            const currentEnd = endNode;
            let newStart = newGraph.nodes.includes(currentStart ?? "") ? currentStart : (newGraph.nodes[0] ?? null);
            let newEnd = newGraph.nodes.includes(currentEnd ?? "") ? currentEnd : null;

            // Ensure start/end are valid and different if possible
            if (!newStart && newGraph.nodes.length > 0) newStart = newGraph.nodes[0];
            if (newStart && (!newEnd || newEnd === newStart)) {
                newEnd = newGraph.nodes.find(n => n !== newStart) ?? null;
            }
            setStartNode(newStart);
            setEndNode(newEnd);
            resetAlgorithm(); // Reset steps
            return newGraph;
        });
    }, [isRunning, isPaused, startNode, endNode, resetAlgorithm]);

    // Set Start Node
    const handleSetStartNode = useCallback((nodeId: NodeId | null) => {
        if (isRunning && !isPaused) return;
        if (nodeId === endNode && nodeId !== null) {
            setEndNode(null); // Clear end node if it becomes same as start
        }
        setStartNode(nodeId);
        resetAlgorithm();
    }, [isRunning, isPaused, endNode, resetAlgorithm]);

    // Set End Node
    const handleSetEndNode = useCallback((nodeId: NodeId | null) => {
        if (isRunning && !isPaused) return;
        if (nodeId === startNode && nodeId !== null) return; // Prevent selecting same as start
        setEndNode(nodeId);
        resetAlgorithm(); // Reset if goal changes
    }, [isRunning, isPaused, startNode, resetAlgorithm]);

    // Pause / Resume
    const pauseResume = useCallback(() => {
        if (!isRunning) return; // Cannot pause/resume if not running
        setIsPaused(prev => !prev);
    }, [isRunning]);

    // Step Forward
    const handleStepForward = useCallback(() => {
        if (!isRunning) return; // Can only step if running (even if paused)
        if (currentStepIndex < steps.length - 1) {
            setIsPaused(true); // Ensure paused if stepping manually
            setCurrentStepIndex(prev => prev + 1);
        }
    }, [isRunning, currentStepIndex, steps.length]);

    // Step Backward
    const handleStepBackward = useCallback(() => {
        if (!isRunning) return;
        if (currentStepIndex > 0) {
            setIsPaused(true); // Ensure paused if stepping manually
            setCurrentStepIndex(prev => prev - 1);
        } else if (currentStepIndex === 0) {
            // Optional: Go back to "before start" state
            // setCurrentStepIndex(-1);
            // Or just stay at step 0
        }
    }, [isRunning, currentStepIndex]);

    // Change Speed
    const handleSetSpeed = useCallback((newSpeedMs: number) => {
        setSpeed(Math.max(50, newSpeedMs)); // Set a minimum speed
    }, []);

    // --- Heuristic Function (Euclidean Distance for A*) ---
    const heuristic = useCallback((nodeAId: NodeId, nodeBId: NodeId): number => {
        const posA = nodePositions.get(nodeAId);
        const posB = nodePositions.get(nodeBId);
        if (!posA || !posB) return Infinity; // Should not happen with valid nodes
        const dx = posA.x - posB.x;
        const dy = posA.y - posB.y;
        // Simple Euclidean distance. Scaling might be needed depending on edge weights.
        // Divide by a factor to make heuristic admissible if weights are small integers?
        // Let's keep it simple for now.
        return Math.sqrt(dx * dx + dy * dy);
        // return Math.sqrt(dx * dx + dy * dy) / 10; // Example scaling
    }, [nodePositions]); // Depends on node positions

    // --- Path Reconstruction Helper ---
    const reconstructPath = (predecessors: Map<NodeId, NodeId | null>, current: NodeId): NodeId[] => {
        const path = [current];
        let node: NodeId | null = current;
        const visited = new Set([current]); // Prevent infinite loops in case of cycle in predecessors (shouldn't happen in correct Dijkstra/A*)
        while (predecessors.has(node) && predecessors.get(node) !== null) {
            node = predecessors.get(node)!;
            if (visited.has(node)) {
                console.error("Cycle detected during path reconstruction!");
                return path; // Return partial path
            }
            path.unshift(node); // Add to the beginning
            visited.add(node);
        }
        return path;
    };

    // --- Algorithm Implementations (Return AlgorithmStep[]) ---

    // BFS Implementation
    const bfs = useCallback((start: NodeId): AlgorithmStep[] => {
        const generatedSteps: AlgorithmStep[] = [];
        const visited: Set<NodeId> = new Set();
        const queue: NodeId[] = [];

        queue.push(start);
        visited.add(start);

        generatedSteps.push({ algorithm: 'bfs', currentNode: start, action: "INITIAL", state: { visited: new Set(visited), queue: [...queue] } });

        let head = 0;
        while (head < queue.length) {
            const currentNode = queue[head++];
            generatedSteps.push({ algorithm: 'bfs', currentNode: currentNode, action: "DEQUEUE / VISIT", state: { visited: new Set(visited), queue: queue.slice(head) } });

            const neighbors = adj.get(currentNode) ?? [];
            let neighborsAdded = false;
            for (const { neighbor } of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                    neighborsAdded = true;
                }
            }
            if (neighborsAdded) {
                generatedSteps.push({ algorithm: 'bfs', currentNode: currentNode, action: "ENQUEUE_NEIGHBORS", state: { visited: new Set(visited), queue: [...queue.slice(head)] } });
            }
        }
        generatedSteps.push({ algorithm: 'bfs', currentNode: null, action: "FINISHED", state: { visited: new Set(visited), queue: [] } });
        return generatedSteps;
    }, [adj]);

    // DFS Implementation (Iterative)
    const dfs = useCallback((start: NodeId): AlgorithmStep[] => {
        const generatedSteps: AlgorithmStep[] = [];
        const visited: Set<NodeId> = new Set();
        const stack: NodeId[] = [];

        stack.push(start);
        generatedSteps.push({ algorithm: 'dfs', currentNode: start, action: "INITIAL", state: { visited: new Set(visited), stack: [...stack] } });

        while (stack.length > 0) {
            const currentNode = stack.pop()!;
            generatedSteps.push({ algorithm: 'dfs', currentNode: currentNode, action: "POP", state: { visited: new Set(visited), stack: [...stack] } });

            if (!visited.has(currentNode)) {
                visited.add(currentNode);
                generatedSteps.push({ algorithm: 'dfs', currentNode: currentNode, action: "VISIT", state: { visited: new Set(visited), stack: [...stack] } });

                const neighbors = (adj.get(currentNode) ?? []).slice().reverse(); // Push neighbors in reverse for typical exploration order
                let neighborsPushed = false;
                for (const { neighbor } of neighbors) {
                    // We push even if visited, check happens on pop (common iterative DFS)
                    // To match pseudo-code more closely (check before push), add: if (!visited.has(neighbor))
                    stack.push(neighbor);
                    neighborsPushed = true;
                }
                if (neighborsPushed) {
                    generatedSteps.push({ algorithm: 'dfs', currentNode: currentNode, action: "PUSH_NEIGHBORS", state: { visited: new Set(visited), stack: [...stack] } });
                }
            } else {
                generatedSteps.push({ algorithm: 'dfs', currentNode: currentNode, action: "ALREADY_VISITED", state: { visited: new Set(visited), stack: [...stack] } });
            }
        }
        generatedSteps.push({ algorithm: 'dfs', currentNode: null, action: "FINISHED", state: { visited: new Set(visited), stack: [] } });
        return generatedSteps;
    }, [adj]);

    // Dijkstra Implementation
    const dijkstra = useCallback((start: NodeId, goal: NodeId | null): AlgorithmStep[] => {
        const generatedSteps: AlgorithmStep[] = [];
        const distances = new Map<NodeId, number>();
        const predecessors = new Map<NodeId, NodeId | null>();
        const openSetMap = new Map<NodeId, number>(); // Node -> Distance (acts as PQ)
        const closedSet = new Set<NodeId>();

        graph.nodes.forEach(node => { distances.set(node, Infinity); predecessors.set(node, null); });
        distances.set(start, 0);
        openSetMap.set(start, 0);

        generatedSteps.push({ algorithm: 'dijkstra', currentNode: start, action: "INITIALIZE", goalNode: goal, state: { distances: new Map(distances), predecessors: new Map(predecessors), openSet: new Set(openSetMap.keys()), closedSet: new Set(closedSet) } });

        while (openSetMap.size > 0) {
            // Simple PQ: Find node with min distance in openSetMap
            let u: NodeId | null = null;
            let minDistance = Infinity;
            openSetMap.forEach((dist, node) => {
                if (dist < minDistance) { minDistance = dist; u = node; }
            });
            if (u === null) break; // Should not happen

            openSetMap.delete(u);
            closedSet.add(u);

            generatedSteps.push({ algorithm: 'dijkstra', currentNode: u, action: "EXTRACT_MIN", goalNode: goal, state: { distances: new Map(distances), predecessors: new Map(predecessors), openSet: new Set(openSetMap.keys()), closedSet: new Set(closedSet) } });

            if (u === goal) {
                const path = reconstructPath(predecessors, u);
                generatedSteps.push({ algorithm: 'dijkstra', currentNode: u, action: "GOAL_FOUND", goalNode: goal, path: path, state: { distances: new Map(distances), predecessors: new Map(predecessors), openSet: new Set(openSetMap.keys()), closedSet: new Set(closedSet) } });
                return generatedSteps;
            }

            const neighbors = adj.get(u) ?? [];
            let neighborUpdated = false;
            for (const { neighbor: v, weight } of neighbors) {
                if (!closedSet.has(v)) {
                    const altDistance = distances.get(u)! + weight;
                    if (altDistance < (distances.get(v) ?? Infinity)) {
                        distances.set(v, altDistance);
                        predecessors.set(v, u);
                        openSetMap.set(v, altDistance); // Add or update in PQ Map
                        neighborUpdated = true;
                        // Optional granular step:
                        // generatedSteps.push({ algorithm: 'dijkstra', currentNode: u, action: "UPDATE_DISTANCE", goalNode: goal, state: { /* snapshot */ } });
                    }
                }
            }
            // Add a single step summarizing neighbor exploration *if* updates happened
            if (neighborUpdated) {
                generatedSteps.push({ algorithm: 'dijkstra', currentNode: u, action: "EXPLORE_NEIGHBORS", goalNode: goal, state: { distances: new Map(distances), predecessors: new Map(predecessors), openSet: new Set(openSetMap.keys()), closedSet: new Set(closedSet) } });
            }
        }

        generatedSteps.push({ algorithm: 'dijkstra', currentNode: null, action: "NO_PATH", goalNode: goal, state: { distances: new Map(distances), predecessors: new Map(predecessors), openSet: new Set(openSetMap.keys()), closedSet: new Set(closedSet) } });
        return generatedSteps;

    }, [graph.nodes, adj, reconstructPath]);

    // A* Implementation
    const aStar = useCallback((start: NodeId, goal: NodeId): AlgorithmStep[] => {
        const generatedSteps: AlgorithmStep[] = [];
        const gScores = new Map<NodeId, number>();
        const fScores = new Map<NodeId, number>();
        const predecessors = new Map<NodeId, NodeId | null>();
        const openSetMap = new Map<NodeId, number>(); // Node -> fScore (acts as PQ)
        const closedSet = new Set<NodeId>();
        const hCosts = new Map<NodeId, number>(); // Store calculated heuristics

        graph.nodes.forEach(node => {
            gScores.set(node, Infinity); fScores.set(node, Infinity); predecessors.set(node, null);
            hCosts.set(node, heuristic(node, goal)); // Precompute heuristics
        });

        gScores.set(start, 0);
        fScores.set(start, hCosts.get(start)!);
        openSetMap.set(start, fScores.get(start)!);

        generatedSteps.push({ algorithm: 'astar', currentNode: start, action: "INITIALIZE", goalNode: goal, state: { distances: new Map(gScores), predecessors: new Map(predecessors), openSet: new Set(openSetMap.keys()), closedSet: new Set(closedSet), hCosts: new Map(hCosts), fCosts: new Map(fScores) } });

        while (openSetMap.size > 0) {
            // Simple PQ: Find node with min fScore in openSetMap
            let u: NodeId | null = null;
            let minFScore = Infinity;
            openSetMap.forEach((score, node) => {
                if (score < minFScore) { minFScore = score; u = node; }
            });
            if (u === null) break;

            openSetMap.delete(u);
            closedSet.add(u);

            generatedSteps.push({ algorithm: 'astar', currentNode: u, action: "EXTRACT_MIN", goalNode: goal, state: { distances: new Map(gScores), predecessors: new Map(predecessors), openSet: new Set(openSetMap.keys()), closedSet: new Set(closedSet), hCosts: new Map(hCosts), fCosts: new Map(fScores) } });

            if (u === goal) {
                const path = reconstructPath(predecessors, u);
                generatedSteps.push({ algorithm: 'astar', currentNode: u, action: "GOAL_FOUND", goalNode: goal, path: path, state: { distances: new Map(gScores), predecessors: new Map(predecessors), openSet: new Set(openSetMap.keys()), closedSet: new Set(closedSet), hCosts: new Map(hCosts), fCosts: new Map(fScores) } });
                return generatedSteps;
            }

            const neighbors = adj.get(u) ?? [];
            let neighborUpdated = false;
            for (const { neighbor: v, weight } of neighbors) {
                if (closedSet.has(v)) continue; // Skip already processed neighbors

                const tentativeGScore = gScores.get(u)! + weight;
                if (tentativeGScore < (gScores.get(v) ?? Infinity)) {
                    predecessors.set(v, u);
                    gScores.set(v, tentativeGScore);
                    fScores.set(v, tentativeGScore + hCosts.get(v)!);
                    openSetMap.set(v, fScores.get(v)!); // Add or update priority
                    neighborUpdated = true;
                    // Optional granular step:
                    // generatedSteps.push({ algorithm: 'astar', currentNode: u, action: "UPDATE_G_SCORE", goalNode: goal, state: { /* snapshot */ } });
                }
            }
            // Add a single step summarizing neighbor exploration *if* updates happened
            if (neighborUpdated) {
                generatedSteps.push({ algorithm: 'astar', currentNode: u, action: "EXPLORE_NEIGHBORS", goalNode: goal, state: { distances: new Map(gScores), predecessors: new Map(predecessors), openSet: new Set(openSetMap.keys()), closedSet: new Set(closedSet), hCosts: new Map(hCosts), fCosts: new Map(fScores) } });
            }
        }

        generatedSteps.push({ algorithm: 'astar', currentNode: null, action: "NO_PATH", goalNode: goal, state: { distances: new Map(gScores), predecessors: new Map(predecessors), openSet: new Set(openSetMap.keys()), closedSet: new Set(closedSet), hCosts: new Map(hCosts), fCosts: new Map(fScores) } });
        return generatedSteps;

    }, [graph.nodes, adj, heuristic, reconstructPath]);

    // --- Start Algorithm ---
    const startAlgorithm = useCallback(() => {
        let generatedSteps: AlgorithmStep[] = [];
        const isPathfinding = algorithmType === 'dijkstra' || algorithmType === 'astar';
        let errorStep: AlgorithmStep | null = null;

        // Input Validation
        if (!startNode || !adj.has(startNode)) {
            errorStep = {
                algorithm: algorithmType,
                currentNode: null,
                action: "ERROR: Invalid or missing Start Node",
                state: algorithmType === 'bfs' ? { visited: new Set(), queue: [] } :
                    algorithmType === 'dfs' ? { visited: new Set(), stack: [] } :
                        algorithmType === 'dijkstra' ? { distances: new Map(), predecessors: new Map(), openSet: new Set(), closedSet: new Set() } :
                            algorithmType === 'astar' ? { distances: new Map(), predecessors: new Map(), openSet: new Set(), closedSet: new Set(), hCosts: new Map(), fCosts: new Map() } :
                                { visited: new Set(), queue: [] },
                goalNode: endNode
            };
        } else if (isPathfinding && (!endNode || !adj.has(endNode))) {
            if (algorithmType === 'dijkstra') {
                errorStep = {
                    algorithm: algorithmType,
                    currentNode: startNode,
                    action: "ERROR: Invalid or missing End Node",
                    state: { distances: new Map(), predecessors: new Map(), openSet: new Set(), closedSet: new Set() },
                    goalNode: endNode
                };
            } else if (algorithmType === 'astar') {
                errorStep = {
                    algorithm: algorithmType,
                    currentNode: startNode,
                    action: "ERROR: Invalid or missing End Node",
                    state: { distances: new Map(), predecessors: new Map(), openSet: new Set(), closedSet: new Set(), hCosts: new Map(), fCosts: new Map() },
                    goalNode: endNode
                };
            } else if (algorithmType === 'dijkstra') {
                errorStep = {
                    algorithm: algorithmType,
                    currentNode: startNode,
                    action: "ERROR: Invalid or missing End Node",
                    state: { distances: new Map(), predecessors: new Map(), openSet: new Set(), closedSet: new Set() },
                    goalNode: endNode
                };
            } else if (algorithmType === 'astar') {
                errorStep = {
                    algorithm: algorithmType,
                    currentNode: startNode,
                    action: "ERROR: Invalid or missing End Node",
                    state: { distances: new Map(), predecessors: new Map(), openSet: new Set(), closedSet: new Set(), hCosts: new Map(), fCosts: new Map() },
                    goalNode: endNode
                };
            }
        } else if (isPathfinding && startNode === endNode) {
            // Handle start === end case specifically
            const hCost = algorithmType === 'astar' ? heuristic(startNode, endNode) : 0;
            const state: PathfindingStepState = { distances: new Map([[startNode, 0]]), predecessors: new Map([[startNode, null]]), openSet: new Set(), closedSet: new Set([startNode]) };
            if (algorithmType === 'astar') {
                state.hCosts = new Map([[startNode, hCost]]);
                state.fCosts = new Map([[startNode, 0 + hCost]]);
            }
            generatedSteps = [{ algorithm: algorithmType, currentNode: startNode, action: "GOAL_FOUND", state: state, path: [startNode], goalNode: endNode }];
        }

        if (errorStep) {
            setSteps([errorStep!]);
            setCurrentStepIndex(0);
            setIsRunning(false);
            setIsPaused(false);
            return;
        }
        if (generatedSteps.length > 0) { // Handle start === end case without running full algo
            resetAlgorithm();
            setSteps(generatedSteps);
            setCurrentStepIndex(0);
            setIsRunning(true); // Mark as "running" but it will immediately finish
            setIsPaused(true); // Start paused on the final step
            return;
        }


        // Execute correct algorithm
        try {
            switch (algorithmType) {
                case 'bfs': generatedSteps = bfs(startNode!); break;
                case 'dfs': generatedSteps = dfs(startNode!); break;
                case 'dijkstra': generatedSteps = dijkstra(startNode!, endNode); break; // Pass endNode (can be null)
                case 'astar': generatedSteps = aStar(startNode!, endNode!); break; // endNode is guaranteed non-null here by validation
                default: throw new Error(`Unknown algorithm type: ${algorithmType}`);
            }
        } catch (error) {
            console.error("Error during algorithm execution:", error);
            errorStep = { algorithm: algorithmType, currentNode: null, action: `ERROR: ${error instanceof Error ? error.message : 'Unknown execution error'}`, state: algorithmType === 'bfs' ? { visited: new Set(), queue: [] } : algorithmType === 'dfs' ? { visited: new Set(), stack: [] } : (algorithmType === 'dijkstra' || algorithmType === 'astar') ? { distances: new Map(), predecessors: new Map(), openSet: new Set(), closedSet: new Set(), ...(algorithmType === 'astar' ? { hCosts: new Map(), fCosts: new Map() } : {}) } : { visited: new Set(), queue: [] }, goalNode: endNode };
            setSteps([errorStep!]);
            setCurrentStepIndex(0);
            setIsRunning(false);
            setIsPaused(false);
            return;
        }


        resetAlgorithm(); // Clear previous state before setting new steps
        if (generatedSteps.length > 0) {
            setSteps(generatedSteps);
            setIsRunning(true);
            setIsPaused(false);
            setCurrentStepIndex(0); // Start from the first step
        } else {
            console.error("Algorithm generated no steps.");
            errorStep = {
                algorithm: algorithmType,
                currentNode: startNode,
                action: "ERROR: Algorithm failed to generate steps",
                state: algorithmType === 'bfs'
                    ? { visited: new Set(), queue: [] }
                    : algorithmType === 'dfs'
                        ? { visited: new Set(), stack: [] }
                        : algorithmType === 'dijkstra'
                            ? { distances: new Map(), predecessors: new Map(), openSet: new Set(), closedSet: new Set() }
                            : algorithmType === 'astar'
                                ? { distances: new Map(), predecessors: new Map(), openSet: new Set(), closedSet: new Set(), hCosts: new Map(), fCosts: new Map() }
                                : { visited: new Set(), queue: [] },
                goalNode: endNode
            };
            setSteps([errorStep!]);
            setCurrentStepIndex(0);
        }

    }, [algorithmType, startNode, endNode, bfs, dfs, dijkstra, aStar, adj, resetAlgorithm, heuristic]);


    // --- Derived State ---
    const isFinished = useMemo(() =>
        currentStepIndex >= steps.length - 1 && steps.length > 0,
        [currentStepIndex, steps.length]
    );
    const currentStepData = useMemo(() => steps[currentStepIndex] ?? null, [steps, currentStepIndex]);


    // --- Render ---
    if (!isClient) {
        // Render placeholder or null during server-side rendering/hydration mismatch prevention
        return <div className="w-screen min-h-screen bg-black flex items-center justify-center text-gray-500">Loading Visualizer...</div>;
    }

    return (
        <div className="flex flex-col items-center p-2 w-screen sm:p-4 bg-gradient-to-br from-gray-950 via-black to-gray-950 min-h-screen text-gray-300">
            <Card className="w-full max-w-7xl bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 shadow-xl rounded-lg overflow-hidden my-4">
                <CardHeader className="bg-gray-800/70 border-b border-gray-700/50 p-4 sm:p-5">
                    <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-gray-100 tracking-tight">
                        Graph Algorithm Visualizer
                    </CardTitle>
                    {/* Optional: Add subtitle or description here */}
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6">
                    {/* Controls */}
                    <div className="mb-4 sm:mb-6">
                        <AlgorithmControls
                            algorithmType={algorithmType}
                            setAlgorithmType={(type) => {
                                if (!isRunning || isPaused) { setAlgorithmType(type); resetAlgorithm(); }
                            }}
                            startAlgorithm={startAlgorithm}
                            resetAlgorithm={resetAlgorithm}
                            pauseResume={pauseResume}
                            stepForward={handleStepForward}
                            stepBackward={handleStepBackward}
                            isRunning={isRunning}
                            isPaused={isPaused}
                            isFinished={isFinished}
                            speed={speed}
                            setSpeed={handleSetSpeed}
                            isDirected={graph.directed}
                            toggleDirected={toggleDirected}
                            startNode={startNode}
                            setStartNode={handleSetStartNode}
                            endNode={endNode}
                            setEndNode={handleSetEndNode}
                            nodes={graph.nodes ?? []}
                            currentStep={currentStepIndex}
                            totalSteps={steps.length}
                        />
                    </div>

                    {/* Main Layout: Visualization and Explanation */}
                    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                        {/* Visualization Area */}
                        <div className="w-full lg:w-[60%] xl:w-[65%] aspect-[4/3] lg:aspect-auto lg:min-h-[500px] border border-gray-700/50 rounded-lg bg-gray-950/50 p-1 overflow-hidden shadow-inner">
                            {adj.size > 0 ? ( // Check if adj list is populated (graph loaded)
                                <GraphVisualization
                                    graph={graph}
                                    currentStep={currentStepData}
                                    startNode={startNode}
                                    endNode={endNode}
                                    nodePositions={nodePositions} // Pass calculated positions
                                    onNodeClick={(nodeId) => {
                                        // Allow selecting start/end by clicking nodes if idle/paused
                                        if (!isRunning || isPaused) {
                                            // Simple logic: First click sets start, second click (if pathfinding) sets end?
                                            // Or use Shift+Click for end? Let's stick to controls for clarity for now.
                                            console.log("Node clicked:", nodeId);
                                            // Example: handleSetStartNode(nodeId);
                                        }
                                    }}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500 animate-pulse">
                                    Loading Graph...
                                </div>
                            )}
                        </div>

                        {/* Explanation Panel Area */}
                        <div className="w-full lg:w-[40%] xl:w-[35%] lg:min-h-[500px]">
                            <ExplanationPanel
                                currentStep={currentStepData}
                                stepNumber={currentStepIndex} // Pass 0-based index
                                totalSteps={steps.length}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
            {/* Optional: Add a footer or links here */}
        </div>
    );
};

export default GraphTraversalVisualizer;