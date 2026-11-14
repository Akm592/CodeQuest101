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
  TreePine,
  Waypoints,
  Undo2,
  TextSearch,
  ListOrdered,
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
  seoTitle?: string;
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
    { title: "Longest Subarray Sum K", seoTitle: "Longest Subarray Sum K Visualizer", description: "Visualize the longest subarray with sum K using a sliding window. Follow the left and right pointers and see when the window expands or shrinks.", icon: <Code2 />, key: "longestSubarray", level: "Medium" },
    { title: "Spiral Matrix", seoTitle: "Spiral Matrix Traversal Visualizer", description: "Watch spiral matrix traversal step by step. Follow the shrinking boundaries and see how each row and column contributes to the output.", icon: <Grid />, key: "spiralMatrix", level: "Medium" },
    { title: "Rotate Image", seoTitle: "Rotate Matrix 90 Degrees Visualizer", description: "Visualize rotating a matrix 90 degrees in place. Follow the transpose and row reversal steps with an interactive matrix animation.", icon: <RotateCw />, key: "rotateImage", level: "Medium" },
    { title: "Sorting Algorithms", seoTitle: "Sorting Algorithm Visualizer", description: "Visualize bubble sort, selection sort, quicksort and merge sort. Step through comparisons, swaps and array updates to understand each algorithm.", icon: <SortDesc />, key: "sortingAlgorithms", level: "Easy" },
    { title: "Binary Search", seoTitle: "Binary Search Visualizer: Step-by-Step Animation", description: "Explore binary search with an interactive sorted array. Follow low, mid and high pointers, try a target and understand logarithmic search.", icon: <Search />, key: "binarySearch", level: "Easy" },
    { title: "Floyd's Algorithm", seoTitle: "Floyd Cycle Detection Visualizer", description: "Watch Floyd's tortoise and hare algorithm detect a linked list cycle. Step through slow and fast pointers, find the cycle entry or the middle node.", icon: <GitBranch />, key: "hareTortoise", level: "Medium" },
    { title: "Dynamic Programming", seoTitle: "Dynamic Programming Visualizer", description: "Explore dynamic programming with interactive table updates and answer reconstruction. Follow each state transition and see how subproblems build a solution.", icon: <Table2 />, key: "dynamicProgramming", level: "Hard" },
    { title: "Topological Sort", seoTitle: "Topological Sort Visualizer: Kahn's Algorithm", description: "Step through Kahn's topological sort, track in-degrees and detect cycles. Explore union-find with interactive graph examples on CodeQuest101.", icon: <Workflow />, key: "topologicalSort", level: "Hard" },
    { title: "N-Queens", seoTitle: "N-Queens Backtracking Visualizer", description: "Visualize the N-Queens problem with step-by-step backtracking. Watch queen placements, conflicts and undo steps while exploring the search tree.", icon: <Crown />, key: "nQueens", level: "Hard" },
  ],
  dataStructures: [
    { title: "Binary Tree Traversal", seoTitle: "Binary Tree Traversal Visualizer", description: "Explore binary tree traversals with interactive animations. Follow depth-first and breadth-first visits and compare traversal orders.", icon: <Network />, key: "binaryTree", level: "Easy" },
    { title: "Linked List", seoTitle: "Linked List Visualizer", description: "Explore linked list operations with an interactive pointer visualization. See how nodes connect and how links change during each operation.", icon: <GitBranch />, key: "linkedList", level: "Easy" },
    { title: "Stack and Queue", seoTitle: "Stack and Queue Visualizer", description: "Visualize stack and queue operations. Compare LIFO and FIFO behavior, track inserted and removed elements and explore each data structure interactively.", icon: <Layers />, key: "stack", level: "Easy" },
    { title: "Tree Structures", seoTitle: "Binary Search Tree Visualizer", description: "Explore tree insertion, deletion, search and traversal. Watch how binary search tree operations change nodes and follow the explanation for each step.", icon: <Network />, key: "tree", level: "Medium" },
    { title: "Graph Theory", seoTitle: "Graph Algorithm Visualizer: BFS and DFS", description: "Build a graph and explore breadth-first and depth-first traversal. Follow visited nodes and edges to understand how BFS and DFS explore a graph.", icon: <Network />, key: "graph", level: "Hard" },
    { title: "Heaps", seoTitle: "Heap and Priority Queue Visualizer", description: "Explore heap operations with an interactive priority queue visualization. See how parent-child ordering changes during insertion and removal.", icon: <Layers />, key: "heap", level: "Medium" },
    { title: "Trie", seoTitle: "Trie Visualizer: Prefix Tree and Autocomplete", description: "Insert words, search prefixes and explore autocomplete with an interactive trie visualizer. Follow each character through the prefix tree.", icon: <ListTree />, key: "trie", level: "Medium" },
  ],
  interviewPatterns: [
    { title: "Arrays & Hashing", seoTitle: "Arrays and Hashing Interview Pattern Visualizer", description: "Learn arrays and hashing through animated coding interview problems, including Two Sum and anagrams. Compare approaches and explore Python solutions.", icon: <Hash />, key: "arraysHashing", level: "Easy" },
    { title: "Two Pointers", seoTitle: "Two Pointers Visualizer: Step-by-Step Examples", description: "Learn the two pointers technique with interactive palindrome, 3Sum and trapping rain water examples. Follow pointer decisions and compare with brute force.", icon: <ArrowLeftRight />, key: "twoPointers", level: "Medium" },
    { title: "Sliding Window", seoTitle: "Sliding Window Visualizer: Step-by-Step Examples", description: "Explore fixed and variable sliding windows with interactive substring and subarray examples. Follow pointer moves, compare brute force and study Python solutions.", icon: <PanelsLeftRight />, key: "slidingWindow", level: "Medium" },
    { title: "Stack", seoTitle: "Stack Interview Pattern Visualizer", description: "Learn stack interview patterns with animated bracket matching, reverse Polish notation and monotonic stack examples. Explore explanations and Python solutions.", icon: <Layers2 />, key: "stackPattern", level: "Medium" },
    { title: "Binary Search", seoTitle: "Binary Search Interview Pattern Visualizer", description: "Explore binary search interview problems with animated rotated arrays, Koko eating bananas and median examples. Follow the search boundaries step by step.", icon: <SearchCode />, key: "binarySearchPattern", level: "Medium" },
    { title: "Linked List", seoTitle: "Linked List Interview Pattern Visualizer", description: "Learn linked list interview patterns with pointer animations for reversal, cycle detection and LRU cache problems. Explore explanations and Python solutions.", icon: <Link2 />, key: "linkedListPattern", level: "Medium" },
    { title: "Trees", seoTitle: "Tree Interview Pattern Visualizer", description: "Explore tree interview patterns with interactive DFS, BFS, binary search tree and path sum problems. Follow each step and study Python solutions.", icon: <TreePine />, key: "treesPattern", level: "Medium" },
    { title: "Tries", seoTitle: "Trie Interview Pattern Visualizer", description: "Explore trie interview patterns with interactive prefix trees, wildcard search and Word Search II. Follow each letter and study Python solutions.", icon: <TextSearch />, key: "triesPattern", level: "Medium" },
    { title: "Heap / Priority Queue", seoTitle: "Heap and Priority Queue Interview Pattern Visualizer", description: "Explore heap interview patterns with animated top-k, task scheduling and running median problems. Watch values swap up and down and study Python solutions.", icon: <ListOrdered />, key: "heapPattern", level: "Medium" },
    { title: "Backtracking", seoTitle: "Backtracking Interview Pattern Visualizer", description: "Explore backtracking interview patterns with growing recursion trees for subsets, combinations, permutations and N-Queens. Watch choices get made, undone and pruned.", icon: <Undo2 />, key: "backtrackingPattern", level: "Medium" },
    { title: "Graphs", seoTitle: "Graph Interview Pattern Visualizer", description: "Explore graph interview patterns with animated BFS, DFS, union-find and topological sort on grids, courses and word ladders. Study each step and Python solutions.", icon: <Waypoints />, key: "graphsPattern", level: "Medium" },
  ],
  machineLearning: [
    { title: "Gradient Descent", seoTitle: "Gradient Descent Visualizer: Learning Rate and Optimizers", description: "Explore gradient descent with interactive learning rates, loss contours and optimizer comparisons. See how SGD, momentum and Adam move toward a minimum.", icon: <TrendingDown />, key: "gradientDescent", level: "Easy" },
    { title: "Linear Regression", seoTitle: "Linear Regression Visualizer", description: "Fit a line interactively and explore linear regression. See how predictions, residuals and loss change as the model learns from data.", icon: <LineChart />, key: "linearRegression", level: "Easy" },
    { title: "K-Means Clustering", seoTitle: "K-Means Clustering Visualizer", description: "Explore K-means clustering with interactive points and centroids. Follow cluster assignments and centroid updates to see how unlabeled data forms groups.", icon: <Boxes />, key: "kMeans", level: "Easy" },
    { title: "Decision Tree", seoTitle: "Decision Tree Visualizer", description: "Explore decision tree splits, Gini impurity and overfitting interactively. See how feature thresholds divide data and build a classifier.", icon: <GitFork />, key: "decisionTree", level: "Medium" },
    { title: "Naive Bayes", seoTitle: "Naive Bayes Visualizer", description: "Explore a Naive Bayes spam classifier interactively. See how word likelihoods and prior probabilities combine to classify a message.", icon: <MailCheck />, key: "naiveBayes", level: "Easy" },
    { title: "Random Forest", seoTitle: "Random Forest Visualizer", description: "Explore random forests through interactive decision trees, bootstrap samples and out-of-bag evaluation. See how individual trees vote on a prediction.", icon: <Trees />, key: "randomForest", level: "Medium" },
    { title: "Gradient Boosting", seoTitle: "Gradient Boosting Visualizer", description: "Visualize gradient boosting step by step. See how each new decision tree fits residual errors and improves the combined prediction.", icon: <Layers3 />, key: "gradientBoosting", level: "Medium" },
    { title: "Neural Network", seoTitle: "Neural Network Training Visualizer", description: "Train a neural network interactively. Explore forward propagation, backpropagation and weight updates to see how a model learns from data.", icon: <Brain />, key: "neuralNetwork", level: "Hard" },
    { title: "Self-Attention", seoTitle: "Self-Attention Visualizer: Query, Key and Value", description: "Explore transformer self-attention with interactive query, key and value matrices. Follow attention scores and see how tokens combine information.", icon: <ScanEye />, key: "attention", level: "Medium" },
    { title: "Next-Token Sampling", seoTitle: "LLM Sampling Visualizer: Temperature, Top-K and Top-P", description: "Explore LLM token sampling with interactive temperature, top-k and top-p controls. Follow logits, softmax probabilities, filtering and the final token draw.", icon: <MessageSquareText />, key: "sampling", level: "Medium" },
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
  | "arraysHashing" | "twoPointers" | "slidingWindow" | "stackPattern" | "binarySearchPattern" | "linkedListPattern" | "treesPattern" | "triesPattern" | "heapPattern" | "backtrackingPattern" | "graphsPattern"
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
