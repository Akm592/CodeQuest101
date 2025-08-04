import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Lightbulb, 
  ChevronDown, 
  ChevronUp, 
  Info,
  Code,
  BarChart3,
  GitBranch,
  Layers,
  Hash,
  Grid3X3
} from "lucide-react";

interface SuggestionCategory {
  title: string;
  icon: React.ReactNode;
  color: string;
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
  const [expandedCategory, setExpandedCategory] = useState<string | null>("Array Algorithms");
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const suggestionCategories: SuggestionCategory[] = [
    {
      title: "Array Algorithms",
      icon: <BarChart3 className="w-5 h-5" />,
      color: "from-blue-500 to-cyan-500",
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
      icon: <Layers className="w-5 h-5" />,
      color: "from-purple-500 to-pink-500",
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
      icon: <GitBranch className="w-5 h-5" />,
      color: "from-green-500 to-emerald-500",
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
      icon: <Code className="w-5 h-5" />,
      color: "from-orange-500 to-red-500",
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
      icon: <Hash className="w-5 h-5" />,
      color: "from-teal-500 to-blue-500",
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
      icon: <Grid3X3 className="w-5 h-5" />,
      color: "from-indigo-500 to-purple-500",
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

  const handleSuggestionClick = (suggestion: SuggestionItem) => {
    if (!isLoading) {
      onSuggestionClick(suggestion.text);
    }
  };

  const toggleCategory = (categoryTitle: string) => {
    setExpandedCategory(expandedCategory === categoryTitle ? null : categoryTitle);
  };

  return (
    <div className="flex flex-col items-center justify-start h-full text-gray-800 dark:text-gray-100 p-4 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="text-center mb-6 sm:mb-8"
      >
        <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-blue-500 dark:text-blue-400 mb-4" />
        <h2 className="text-3xl sm:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400">
          Algorithm Visualizer
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
          Select an algorithm to see step-by-step visualization
        </p>
      </motion.div>

      <div className="w-full max-w-4xl">
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">💡 Tips for best results:</p>
              <ul className="space-y-1 text-xs">
                <li>• Click any suggestion to see step-by-step algorithm execution</li>
                <li>• Examples use real LeetCode problem data for educational value</li>
                <li>• Hover over suggestions to see complexity analysis</li>
                <li>• Each visualization shows decision-making process at every step</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {suggestionCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
              className="bg-white/50 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleCategory(category.title)}
                className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-white/20 dark:hover:bg-black/20 transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${category.color} text-white`}>
                    {category.icon}
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300">
                      {category.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {category.suggestions.length} algorithm{category.suggestions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {expandedCategory === category.title ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              <AnimatePresence>
                {expandedCategory === category.title && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 sm:p-5 pt-0 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                      {category.suggestions.map((suggestion, index) => (
                        <motion.div
                          key={index}
                          className="relative"
                          onMouseEnter={() => setShowTooltip(`${category.title}-${index}`)}
                          onMouseLeave={() => setShowTooltip(null)}
                        >
                          <motion.button
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            className={`w-full bg-white/60 dark:bg-black/40 backdrop-blur-md border border-white/30 dark:border-white/20
                                     text-gray-800 dark:text-gray-200 rounded-lg p-4 text-left shadow-md hover:shadow-lg
                                     hover:bg-white/70 dark:hover:bg-black/50 transition-all duration-200 
                                     focus:outline-none focus:ring-2 focus:ring-blue-400/50 relative
                                     ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            onClick={() => handleSuggestionClick(suggestion)}
                            disabled={isLoading}
                          >
                            <div className="space-y-2">
                              <p className="font-medium text-sm sm:text-base leading-snug">
                                {suggestion.text}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {suggestion.description}
                              </p>
                              {suggestion.example && (
                                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                  📝 {suggestion.example}
                                </div>
                              )}
                            </div>
                            
                            {isLoading && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-lg">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                              </div>
                            )}
                          </motion.button>

                          {/* Tooltip */}
                          <AnimatePresence>
                            {showTooltip === `${category.title}-${index}` && suggestion.complexity && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg shadow-lg whitespace-nowrap"
                              >
                                <div className="font-medium">⚡ Complexity</div>
                                <div>{suggestion.complexity}</div>
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          <p>💡 Each suggestion uses real example data for authentic algorithm visualization</p>
        </motion.div>
      </div>
    </div>
  );
});

export default SuggestionsScreen;
