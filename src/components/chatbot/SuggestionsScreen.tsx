import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Info,
  Code,
  BarChart3,
  GitBranch,
  Layers,
  Hash,
  Grid3X3,
  ArrowRight
} from "lucide-react";

interface SuggestionCategory {
  title: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  suggestions: SuggestionItem[];
}

interface SuggestionItem {
  text: string;
  description: string;
  example?: string;
  complexity?: string;
}

const SuggestionsScreen = React.memo(({
  onSuggestionClick,
  isLoading = false
}: {
  onSuggestionClick: (suggestion: string) => void;
  isLoading?: boolean;
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const suggestionCategories: SuggestionCategory[] = [
    {
      title: "Array Algorithms",
      icon: <BarChart3 className="w-6 h-6" />,
      color: "text-blue-400",
      gradient: "from-blue-500/20 to-cyan-500/20",
      suggestions: [
        {
          text: "Two Sum problem with array [2, 7, 11, 15] and target 9",
          description: "Hash map approach with step-by-step complement calculation",
          example: "LeetCode Example 1",
          complexity: "O(n) time, O(n) space"
        },
        {
          text: "Binary search for target 9 in sorted array [-1, 0, 3, 5, 9, 12]",
          description: "Divide and conquer approach with left/right pointers",
          example: "LeetCode #704 Example 1",
          complexity: "O(log n) time, O(1) space"
        },
        {
          text: "Maximum subarray using Kadane's algorithm on [-2, 1, -3, 4, -1, 2, 1, -5, 4]",
          description: "Dynamic programming approach tracking running sum",
          example: "LeetCode #53 Example 1",
          complexity: "O(n) time, O(1) space"
        },
        {
          text: "Sliding window: longest substring without repeating characters in 'abcabcbb'",
          description: "Two-pointer technique with hash set for character tracking",
          example: "LeetCode #3 Example 1",
          complexity: "O(n) time, O(min(m,n)) space"
        }
      ]
    },
    {
      title: "Sorting Algorithms",
      icon: <Layers className="w-6 h-6" />,
      color: "text-purple-400",
      gradient: "from-purple-500/20 to-pink-500/20",
      suggestions: [
        {
          text: "Bubble sort visualization with array [64, 34, 25, 12, 22, 11, 90]",
          description: "Adjacent comparison and swapping with step-by-step bars",
          complexity: "O(n²) time, O(1) space"
        },
        {
          text: "Quick sort with pivot selection on [3, 6, 8, 10, 1, 2, 1]",
          description: "Divide and conquer with partition visualization",
          complexity: "O(n log n) avg, O(n²) worst"
        },
        {
          text: "Merge sort divide and conquer on [38, 27, 43, 3, 9, 82, 10]",
          description: "Recursive splitting and merging with tree visualization",
          complexity: "O(n log n) time, O(n) space"
        }
      ]
    },
    {
      title: "Graph Algorithms",
      icon: <GitBranch className="w-6 h-6" />,
      color: "text-green-400",
      gradient: "from-green-500/20 to-emerald-500/20",
      suggestions: [
        {
          text: "BFS traversal starting from node A in graph with edges [(A,B), (A,C), (B,D), (C,D)]",
          description: "Level-by-level exploration using queue data structure",
          complexity: "O(V + E) time, O(V) space"
        },
        {
          text: "DFS traversal on the same graph starting from node A",
          description: "Depth-first exploration using stack (recursive/iterative)",
          complexity: "O(V + E) time, O(V) space"
        },
        {
          text: "Dijkstra's shortest path from A to D with weighted edges",
          description: "Priority queue based shortest path algorithm",
          complexity: "O((V + E) log V) time"
        }
      ]
    },
    {
      title: "Tree Algorithms",
      icon: <Code className="w-6 h-6" />,
      color: "text-orange-400",
      gradient: "from-orange-500/20 to-red-500/20",
      suggestions: [
        {
          text: "Binary tree inorder traversal on tree [1, null, 2, 3]",
          description: "Left-Root-Right traversal pattern visualization",
          example: "LeetCode #94 Example 1",
          complexity: "O(n) time, O(h) space"
        },
        {
          text: "Binary search tree insertion of values [5, 3, 7, 1, 9]",
          description: "Step-by-step BST construction with comparison logic",
          complexity: "O(log n) avg, O(n) worst per insertion"
        }
      ]
    },
    {
      title: "Data Structures",
      icon: <Hash className="w-6 h-6" />,
      color: "text-teal-400",
      gradient: "from-teal-500/20 to-blue-500/20",
      suggestions: [
        {
          text: "Stack operations: push(10), push(20), push(30), pop(), pop()",
          description: "LIFO operations with visual stack representation",
          complexity: "O(1) per operation"
        },
        {
          text: "Queue operations: enqueue(1), enqueue(2), enqueue(3), dequeue(), dequeue()",
          description: "FIFO operations with front/rear pointer tracking",
          complexity: "O(1) per operation"
        },
        {
          text: "HashMap operations: put('apple', 5), put('banana', 3), get('apple')",
          description: "Key-value pair operations with hash function visualization",
          complexity: "O(1) avg per operation"
        }
      ]
    },
    {
      title: "Matrix Algorithms",
      icon: <Grid3X3 className="w-6 h-6" />,
      color: "text-indigo-400",
      gradient: "from-indigo-500/20 to-purple-500/20",
      suggestions: [
        {
          text: "Search target 8 in sorted matrix [[1,4,7,11],[2,5,8,12],[3,6,9,16]]",
          description: "Start from top-right corner, eliminate row/column each step",
          example: "LeetCode #240 Example",
          complexity: "O(m + n) time, O(1) space"
        },
        {
          text: "Matrix rotation 90 degrees clockwise for 3x3 matrix",
          description: "Layer-by-layer rotation with index transformation",
          complexity: "O(n²) time, O(1) space"
        }
      ]
    }
  ];

  const categories = React.useMemo(() => suggestionCategories, []);
  const activeCategory = React.useMemo(() =>
    categories.find(c => c.title === selectedCategory),
    [selectedCategory, categories]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-6 text-gray-900 dark:text-white overflow-y-auto">
      <AnimatePresence mode="wait">
        {!selectedCategory ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-5xl"
          >
            <div className="text-center mb-10">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="inline-flex items-center justify-center p-3 bg-teal-500/10 rounded-full mb-4 border border-teal-500/20 shadow-[0_0_20px_rgba(20,184,166,0.2)]"
              >
                <Sparkles className="w-8 h-8 text-teal-500 dark:text-teal-400" />
              </motion.div>
              <h2 className="text-4xl font-bold mb-3 tracking-tight text-gray-900 dark:text-white">
                Algorithm <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600 dark:from-teal-400 dark:to-blue-500">Visualizer</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto text-lg">
                Choose a category to explore interactive visualizations and master complex concepts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {categories.map((category, index) => (
                <motion.button
                  key={category.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedCategory(category.title)}
                  className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#0F1117] border border-gray-200 dark:border-white/5 hover:border-teal-500/50 p-6 text-left transition-all duration-300 hover:shadow-[0_0_20px_rgba(20,184,166,0.15)] hover:-translate-y-1"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                  <div className="relative z-10">
                    <div className={`p-3 rounded-xl bg-gray-100 dark:bg-white/5 w-fit mb-4 ${category.color} group-hover:scale-110 transition-transform duration-300`}>
                      {category.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-50 transition-colors">
                      {category.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 mb-4 transition-colors">
                      {category.suggestions.length} Visualizations
                    </p>

                    <div className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-600 group-hover:text-teal-500 dark:group-hover:text-teal-400 uppercase tracking-wider transition-colors">
                      Explore <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-4xl"
          >
            <button
              onClick={() => setSelectedCategory(null)}
              className="mb-8 flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
            >
              <div className="p-1 rounded-full bg-gray-200 dark:bg-white/5 group-hover:bg-gray-300 dark:group-hover:bg-white/10 mr-2 border border-gray-200 dark:border-white/5 group-hover:border-gray-300 dark:group-hover:border-white/20 transition-all">
                <ArrowRight className="w-4 h-4 rotate-180" />
              </div>
              Back to Categories
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${activeCategory?.gradient} border border-gray-200 dark:border-white/10`}>
                {activeCategory?.icon}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{activeCategory?.title}</h2>
                <p className="text-gray-600 dark:text-gray-400">Select a visualization to begin</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCategory?.suggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => !isLoading && onSuggestionClick(suggestion.text)}
                  disabled={isLoading}
                  className="text-left p-5 rounded-xl bg-white dark:bg-[#0F1117]/80 border border-gray-200 dark:border-white/5 hover:border-teal-500/30 hover:bg-gray-50 dark:hover:bg-[#13161f] transition-all group relative overflow-hidden shadow-sm hover:shadow-md"
                >
                  <div className="relative z-10">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 mb-2 transition-colors pr-6">
                      {suggestion.text}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-500 group-hover:text-gray-800 dark:group-hover:text-gray-400 transition-colors mb-3 line-clamp-2">
                      {suggestion.description}
                    </p>

                    {suggestion.complexity && (
                      <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-xs text-gray-500 dark:text-gray-400 group-hover:border-teal-500/20 group-hover:text-teal-600 dark:group-hover:text-teal-500/80 transition-colors">
                        <Info className="w-3 h-3 mr-1.5" />
                        {suggestion.complexity}
                      </div>
                    )}
                  </div>

                  <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                    <ArrowRight className="w-5 h-5 text-teal-500" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default SuggestionsScreen;