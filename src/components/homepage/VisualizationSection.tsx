import React, { useState } from 'react';
import { Button } from '../ui/button';
import {
  Code2, GitBranch, Grid, SortDesc, Search, RotateCw, Brain, Database, AlignJustify, ArrowLeft, ArrowRight, Layers, Cpu, Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const categories = [
  { title: "Algorithms", description: "Master efficient problem solving", icon: <Cpu className="h-6 w-6 text-cyan-400" />, key: "algorithms", gradient: "from-cyan-500/10 to-blue-500/10" },
  { title: "Data Structures", description: "Build strong foundations", icon: <Database className="h-6 w-6 text-teal-400" />, key: "dataStructures", gradient: "from-teal-500/10 to-green-500/10" },
  { title: "Machine Learning", description: "Explore AI concepts", icon: <Brain className="h-6 w-6 text-purple-400" />, key: "machineLearning", gradient: "from-purple-500/10 to-pink-500/10" },
];

const visualizations = {
  algorithms: [
    { title: "Longest Subarray Sum K", description: "Sliding window technique visualization", icon: <Code2 />, key: "longestSubarray" },
    { title: "Spiral Matrix", description: "2D Array traversal animation", icon: <Grid />, key: "spiralMatrix" },
    { title: "Rotate Image", description: "Matrix manipulation in-place", icon: <RotateCw />, key: "rotateImage" },
    { title: "Sorting Algorithms", description: "Compare efficiency of sorts", icon: <SortDesc />, key: "sortingAlgorithms" },
    { title: "Binary Search", description: "Divide and conquer strategy", icon: <Search />, key: "binarySearch" },
    { title: "Floyd's Algorithm", description: "Cycle detection in linked lists", icon: <GitBranch />, key: "hareTortoise" },
  ],
  dataStructures: [
    { title: "Binary Tree Traversal", description: "DFS & BFS animations", icon: <Network />, key: "binaryTree" },
    { title: "Linked List", description: "Pointer manipulation visualizer", icon: <GitBranch />, key: "linkedList" },
    { title: "Stack and Queue", description: "LIFO & FIFO operations", icon: <Layers />, key: "stack" },
    { title: "Tree Structures", description: "Hierarchical data modeling", icon: <Network />, key: "tree" },
    { title: "Graph Theory", description: "Nodes and edges exploration", icon: <Network />, key: "graph" },
    { title: "Heaps", description: "Priority queue visualization", icon: <Layers />, key: "heap" },
  ],
  machineLearning: [
    { title: "Neural Networks", description: "Backpropagation visualized", icon: <Brain />, key: "neuralNetwork" },
  ],
};

interface VisualizationSectionProps {
  onSelectVisualization: (key: string) => void;
}

export const VisualizationSection: React.FC<VisualizationSectionProps> = ({ onSelectVisualization }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const currentVisualizations = selectedCategory ? visualizations[selectedCategory as keyof typeof visualizations] : [];

  return (
    <section id="visualizations" className="py-24 relative bg-black/40">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Interactive <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">Playground</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Choose a domain to explore our extensive library of interactive visualizations.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!selectedCategory ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {categories.map((category) => (
                <div
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`group relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br ${category.gradient} p-8 cursor-pointer transition-all duration-300 hover:border-white/20 hover:shadow-2xl`}
                >
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-3xl -z-10" />

                  <div className="mb-6 p-4 rounded-2xl bg-white/5 w-fit border border-white/10 group-hover:scale-110 transition-transform duration-300">
                    {category.icon}
                  </div>

                  <h3 className="text-2xl font-bold mb-2 group-hover:text-teal-400 transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-gray-400 group-hover:text-gray-300">
                    {category.description}
                  </p>

                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0">
                    <ArrowRight className="text-white/50" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <button
                onClick={() => setSelectedCategory(null)}
                className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
              >
                <div className="p-2 rounded-full bg-white/5 group-hover:bg-teal-500/20 transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </div>
                <span className="font-medium">Back to Categories</span>
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentVisualizations.map((viz, idx) => (
                  <motion.div
                    key={viz.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => onSelectVisualization(viz.key)}
                    className="group flex flex-col justify-between bg-white/5 border border-white/5 hover:border-teal-500/50 hover:bg-teal-900/10 p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-[0_0_30px_rgba(20,184,166,0.1)]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-black/40 text-teal-400 ring-1 ring-white/10 group-hover:ring-teal-500/50 transition-all">
                          {React.cloneElement(viz.icon as React.ReactElement, { className: 'w-5 h-5' })}
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Code2 className="w-4 h-4 text-teal-400" />
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-gray-100 group-hover:text-teal-300 mb-2">
                        {viz.title}
                      </h3>
                      <p className="text-sm text-gray-500 group-hover:text-gray-400 line-clamp-2">
                        {viz.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};