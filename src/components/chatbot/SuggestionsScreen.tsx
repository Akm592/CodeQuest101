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
      color: "text-viz-pointer",
      gradient: "from-secondary/20 to-primary/20",
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
      color: "text-primary",
      gradient: "from-primary/20 to-secondary/20",
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
    <div className="flex h-full w-full flex-col items-center justify-center overflow-y-auto p-3 text-foreground sm:p-6">
      <AnimatePresence mode="wait">
        {!selectedCategory ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-5xl"
          >
            <div className="mb-6 text-center sm:mb-10">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mb-3 inline-flex items-center justify-center rounded-full border border-primary/20 bg-primary/10 p-2.5 shadow-[0_0_20px_hsl(var(--primary)/0.2)] sm:mb-4 sm:p-3"
              >
                <Sparkles className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
              </motion.div>
              <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground sm:mb-3 sm:text-4xl">
                Algorithm <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Visualizer</span>
              </h2>
              <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-lg">
                Choose a category to explore interactive visualizations and master complex concepts.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {categories.map((category, index) => (
                <motion.button
                  key={category.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedCategory(category.title)}
                  className="group relative overflow-hidden rounded-2xl border border-white/5 bg-card p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_0_20px_hsl(var(--primary)/0.15)] sm:p-6"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                  <div className="relative z-10 flex items-center gap-3 sm:block">
                    <div className={`w-fit shrink-0 rounded-xl bg-white/5 p-2.5 transition-transform duration-300 group-hover:scale-110 sm:mb-4 sm:p-3 ${category.color}`}>
                      {category.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-0.5 text-base font-semibold text-foreground transition-colors group-hover:text-primary sm:mb-2 sm:text-xl">
                        {category.title}
                      </h3>
                      <p className="text-xs text-muted-foreground transition-colors sm:mb-4 sm:text-sm">
                        {category.suggestions.length} Visualizations
                      </p>

                      <div className="mt-1 flex items-center text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-primary sm:mt-0">
                        Explore <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </div>
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
              className="mb-8 flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <div className="p-1 rounded-full bg-white/5 group-hover:bg-border group-hover:bg-white/10 mr-2 border border-white/5 group-hover:border-border group-hover:border-white/20 transition-all">
                <ArrowRight className="w-4 h-4 rotate-180" />
              </div>
              Back to Categories
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${activeCategory?.gradient} border border-white/10`}>
                {activeCategory?.icon}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">{activeCategory?.title}</h2>
                <p className="text-muted-foreground">Select a visualization to begin</p>
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
                  className="text-left p-5 rounded-xl bg-background/80 border border-white/5 hover:border-primary/30 hover:bg-white/5 transition-all group relative overflow-hidden shadow-sm hover:shadow-md"
                >
                  <div className="relative z-10">
                    <h4 className="font-semibold text-foreground group-hover:text-primary mb-2 transition-colors pr-6">
                      {suggestion.text}
                    </h4>
                    <p className="text-sm text-muted-foreground group-hover:text-muted-foreground transition-colors mb-3 line-clamp-2">
                      {suggestion.description}
                    </p>

                    {suggestion.complexity && (
                      <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-muted-foreground group-hover:border-primary/20 group-hover:text-primary/80 transition-colors">
                        <Info className="w-3 h-3 mr-1.5" />
                        {suggestion.complexity}
                      </div>
                    )}
                  </div>

                  <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                    <ArrowRight className="w-5 h-5 text-primary" />
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