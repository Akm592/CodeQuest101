// The single source of truth for what this site actually offers.
//
// The hero used to assert "20+ Algorithms · 15+ Data Structures · 10k+ Active
// Users · 50+ Visualizations" while the grid 800px below it — rendered from
// this same data — listed thirteen. Counting from the catalogue means the two
// can never disagree again, and adding a visualizer updates the hero for free.

import {
  ArrowLeftRight,
  PanelsLeftRight,
  Layers2,
  SearchCode,
  Link2,
  Boxes,
  Brain,
  Code2,
  Cpu,
  Crown,
  Database,
  GitBranch,
  GitFork,
  Hash,
  Grid,
  Layers,
  Layers3,
  LineChart,
  ListTree,
  MailCheck,
  MessageSquareText,
  Network,
  Puzzle,
  RotateCw,
  ScanEye,
  Search,
  SortDesc,
  Table2,
  Trees,
  TrendingDown,
  Workflow,
} from "lucide-react";
import * as React from "react";

export type CategoryKey = "algorithms" | "dataStructures" | "interviewPatterns" | "machineLearning";

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
}

export const categories: Category[] = [
  {
    title: "Algorithms",
    description: "Master efficient problem solving",
    icon: <Cpu className="h-6 w-6 text-primary" />,
    key: "algorithms",
  },
  {
    title: "Data Structures",
    description: "Build strong foundations",
    icon: <Database className="h-6 w-6 text-primary" />,
    key: "dataStructures",
  },
  {
    title: "Interview Patterns",
    description: "The NeetCode 150, pattern by pattern",
    icon: <Puzzle className="h-6 w-6 text-primary" />,
    key: "interviewPatterns",
  },
  {
    title: "Machine Learning & AI",
    description: "From gradient descent to attention",
    icon: <Brain className="h-6 w-6 text-secondary-bright" />,
    key: "machineLearning",
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
  interviewPatterns: [
    { title: "Arrays & Hashing", description: "NeetCode 150: Two Sum, anagrams, top K and more", icon: <Hash />, key: "arraysHashing", level: "Easy" },
    { title: "Two Pointers", description: "NeetCode 150: palindromes, 3Sum, trapping rain water", icon: <ArrowLeftRight />, key: "twoPointers", level: "Medium" },
    { title: "Sliding Window", description: "NeetCode 150: stock profit, substrings, window max", icon: <PanelsLeftRight />, key: "slidingWindow", level: "Medium" },
    { title: "Stack", description: "NeetCode 150: brackets, RPN, monotonic stacks", icon: <Layers2 />, key: "stackPattern", level: "Medium" },
    { title: "Binary Search", description: "NeetCode 150: rotated arrays, Koko, median of two arrays", icon: <SearchCode />, key: "binarySearchPattern", level: "Medium" },
    { title: "Linked List", description: "NeetCode 150: reversing, Floyd's cycle, LRU cache", icon: <Link2 />, key: "linkedListPattern", level: "Medium" },
  ],
  machineLearning: [
    { title: "Gradient Descent", description: "Roll downhill to the lowest error", icon: <TrendingDown />, key: "gradientDescent", level: "Easy" },
    { title: "Linear Regression", description: "Fit a line by shrinking the error", icon: <LineChart />, key: "linearRegression", level: "Easy" },
    { title: "K-Means Clustering", description: "Find groups with no labels", icon: <Boxes />, key: "kMeans", level: "Easy" },
    { title: "Decision Tree", description: "20 questions: Gini, splits and overfitting", icon: <GitFork />, key: "decisionTree", level: "Medium" },
    { title: "Naive Bayes", description: "A spam filter that weighs every word", icon: <MailCheck />, key: "naiveBayes", level: "Easy" },
    { title: "Random Forest", description: "Many trees vote: bootstrap and out-of-bag", icon: <Trees />, key: "randomForest", level: "Medium" },
    { title: "Gradient Boosting", description: "Each new tree fixes what's still wrong", icon: <Layers3 />, key: "gradientBoosting", level: "Medium" },
    { title: "Neural Network", description: "Watch it train: forward, backprop, update", icon: <Brain />, key: "neuralNetwork", level: "Hard" },
    { title: "Self-Attention", description: "How a transformer links “it” to “cat”", icon: <ScanEye />, key: "attention", level: "Medium" },
    { title: "Next-Token Sampling", description: "Temperature, top-k and top-p, explained", icon: <MessageSquareText />, key: "sampling", level: "Medium" },
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
  | "arraysHashing" | "twoPointers" | "slidingWindow" | "stackPattern" | "binarySearchPattern" | "linkedListPattern"
  | "binaryTree" | "linkedList" | "stack" | "tree" | "graph" | "heap" | "trie"
  | "neuralNetwork" | "gradientDescent" | "linearRegression" | "kMeans" | "attention" | "sampling" | "decisionTree" | "naiveBayes" | "randomForest" | "gradientBoosting";

export const allVisualizations: Visualization[] = [
  ...visualizations.algorithms,
  ...visualizations.dataStructures,
  ...visualizations.interviewPatterns,
  ...visualizations.machineLearning,
];

/**
 * Counted, not claimed. Every figure the hero shows comes from here, so the
 * only way to change a number on the landing page is to change the catalogue.
 */
export const catalogStats: { label: string; value: string }[] = [
  { label: "Algorithms", value: String(visualizations.algorithms.length) },
  { label: "Data Structures", value: String(visualizations.dataStructures.length) },
  { label: "Interview Patterns", value: String(visualizations.interviewPatterns.length) },
  { label: "ML & AI", value: String(visualizations.machineLearning.length) },
  { label: "Visualizations", value: String(allVisualizations.length) },
];
