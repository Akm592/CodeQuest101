// The single source of truth for what this site actually offers.
//
// The hero used to assert "20+ Algorithms · 15+ Data Structures · 10k+ Active
// Users · 50+ Visualizations" while the grid 800px below it — rendered from
// this same data — listed thirteen. Counting from the catalogue means the two
// can never disagree again, and adding a visualizer updates the hero for free.

import {
  Brain,
  Code2,
  Cpu,
  Crown,
  Database,
  GitBranch,
  Grid,
  Layers,
  ListTree,
  Network,
  RotateCw,
  Search,
  SortDesc,
  Table2,
  Workflow,
} from "lucide-react";
import * as React from "react";

export type CategoryKey = "algorithms" | "dataStructures" | "machineLearning";

export interface Visualization {
  title: string;
  description: string;
  icon: React.ReactElement;
  key: string;
  level: "Easy" | "Medium" | "Hard";
}

export interface Category {
  title: string;
  description: string;
  icon: React.ReactElement;
  key: CategoryKey;
  /** Tints of the one brand ramp, so the three cards read as a set. */
  gradient: string;
}

export const categories: Category[] = [
  {
    title: "Algorithms",
    description: "Master efficient problem solving",
    icon: <Cpu className="h-6 w-6 text-primary" />,
    key: "algorithms",
    gradient: "from-primary/15 to-primary/5",
  },
  {
    title: "Data Structures",
    description: "Build strong foundations",
    icon: <Database className="h-6 w-6 text-primary" />,
    key: "dataStructures",
    gradient: "from-primary/10 to-secondary/10",
  },
  {
    title: "Machine Learning",
    description: "Explore AI concepts",
    icon: <Brain className="h-6 w-6 text-secondary-bright" />,
    key: "machineLearning",
    gradient: "from-secondary/10 to-primary/5",
  },
];

export const visualizations: Record<CategoryKey, Visualization[]> = {
  algorithms: [
    { title: "Longest Subarray Sum K", description: "Sliding window technique visualization", icon: <Code2 />, key: "longestSubarray", level: "Medium" },
    { title: "Spiral Matrix", description: "2D Array traversal animation", icon: <Grid />, key: "spiralMatrix", level: "Medium" },
    { title: "Rotate Image", description: "Matrix manipulation in-place", icon: <RotateCw />, key: "rotateImage", level: "Medium" },
    { title: "Sorting Algorithms", description: "Compare efficiency of sorts", icon: <SortDesc />, key: "sortingAlgorithms", level: "Easy" },
    { title: "Binary Search", description: "Divide and conquer strategy", icon: <Search />, key: "binarySearch", level: "Easy" },
    { title: "Floyd's Algorithm", description: "Cycle detection in linked lists", icon: <GitBranch />, key: "hareTortoise", level: "Medium" },
    { title: "Dynamic Programming", description: "Fill the table, then trace the answer back", icon: <Table2 />, key: "dynamicProgramming", level: "Hard" },
    { title: "Topological Sort", description: "Kahn's ordering and union-find", icon: <Workflow />, key: "topologicalSort", level: "Hard" },
    { title: "N-Queens", description: "Backtracking: place, conflict, undo", icon: <Crown />, key: "nQueens", level: "Hard" },
  ],
  dataStructures: [
    { title: "Binary Tree Traversal", description: "DFS & BFS animations", icon: <Network />, key: "binaryTree", level: "Easy" },
    { title: "Linked List", description: "Pointer manipulation visualizer", icon: <GitBranch />, key: "linkedList", level: "Easy" },
    { title: "Stack and Queue", description: "LIFO & FIFO operations", icon: <Layers />, key: "stack", level: "Easy" },
    { title: "Tree Structures", description: "Hierarchical data modeling", icon: <Network />, key: "tree", level: "Medium" },
    { title: "Graph Theory", description: "Nodes and edges exploration", icon: <Network />, key: "graph", level: "Hard" },
    { title: "Heaps", description: "Priority queue visualization", icon: <Layers />, key: "heap", level: "Medium" },
    { title: "Trie", description: "Prefix tree: insert, search, autocomplete", icon: <ListTree />, key: "trie", level: "Medium" },
  ],
  machineLearning: [
    { title: "Neural Networks", description: "Backpropagation visualized", icon: <Brain />, key: "neuralNetwork", level: "Hard" },
  ],
};

/**
 * Every route key the catalogue offers.
 *
 * `App.tsx` builds its route table as a Record over this, so a catalogue entry
 * with no route — or a route whose path is misspelled — is a compile error
 * rather than a blank page.
 */
export type VisualizationKey =
  | "longestSubarray" | "spiralMatrix" | "rotateImage" | "sortingAlgorithms"
  | "binarySearch" | "hareTortoise" | "dynamicProgramming" | "topologicalSort"
  | "nQueens"
  | "binaryTree" | "linkedList" | "stack" | "tree" | "graph" | "heap" | "trie"
  | "neuralNetwork";

export const allVisualizations: Visualization[] = [
  ...visualizations.algorithms,
  ...visualizations.dataStructures,
  ...visualizations.machineLearning,
];

/**
 * Counted, not claimed. Every figure the hero shows comes from here, so the
 * only way to change a number on the landing page is to change the catalogue.
 */
export const catalogStats: { label: string; value: string }[] = [
  { label: "Algorithms", value: String(visualizations.algorithms.length) },
  { label: "Data Structures", value: String(visualizations.dataStructures.length) },
  { label: "ML Models", value: String(visualizations.machineLearning.length) },
  { label: "Visualizations", value: String(allVisualizations.length) },
];
