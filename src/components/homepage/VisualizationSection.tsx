import React, { useState } from 'react';
import { Button } from '../ui/button'; // Adjust path
import {
  Code2, GitBranch, Grid, SortDesc, Search, RotateCw, Brain, Database, AlignJustify, ArrowLeft // Changed ArrowRight to ArrowLeft
} from 'lucide-react';

// Data (can be moved to a separate file if large)
const categories = [
  { title: "Algorithms", description: "Explore various algorithmic visualizations", icon: <AlignJustify className="h-10 w-10 text-blue-400" />, key: "algorithms" },
  { title: "Data Structures", description: "Visualize common data structures", icon: <Database className="h-10 w-10 text-teal-400" />, key: "dataStructures" },
  { title: "Machine Learning", description: "Dive into machine learning concepts", icon: <Brain className="h-10 w-10 text-purple-400" />, key: "machineLearning" },
];

const visualizations = {
  algorithms: [
    { title: "Longest Subarray Sum K", description: "Find the longest subarray with sum K", icon: <Code2 className="h-5 w-5 text-blue-400" />, key: "longestSubarray" },
    { title: "Spiral Matrix", description: "Animate spiral traversal of a matrix", icon: <Grid className="h-5 w-5 text-blue-400" />, key: "spiralMatrix" },
    { title: "Rotate Image", description: "Rotate a square matrix in-place", icon: <RotateCw className="h-5 w-5 text-blue-400" />, key: "rotateImage" },
    { title: "Sorting Algorithms", description: "Visualize popular sorting algorithms", icon: <SortDesc className="h-5 w-5 text-blue-400" />, key: "sortingAlgorithms" },
    { title: "Binary Search", description: "Visualize the binary search algorithm", icon: <Search className="h-5 w-5 text-blue-400" />, key: "binarySearch" },
    { title: "Hare-Tortoise", description: "Visualize Hare-Tortoise algorithm", icon: <GitBranch className="h-5 w-5 text-blue-400" />, key: "hareTortoise" },
  ],
  dataStructures: [
    { title: "Binary Tree Traversal", description: "Visualize tree traversal algorithms", icon: <GitBranch className="h-5 w-5 text-teal-400" />, key: "binaryTree" },
    { title: "Linked List", description: "Visualize linked list operations", icon: <GitBranch className="h-5 w-5 text-teal-400" />, key: "linkedList" },
    { title: "Stack and Queue", description: "Visualize stack and queue operations", icon: <GitBranch className="h-5 w-5 text-teal-400" />, key: "stack" },
    { title: "Tree Data Structure", description: "Visualize tree data structure", icon: <GitBranch className="h-5 w-5 text-teal-400" />, key: "tree" },
    { title: "Graph Data Structure", description: "Visualize graph data structure", icon: <GitBranch className="h-5 w-5 text-teal-400" />, key: "graph" },
    { title: "Heap Data Structure", description: "Visualize heap data structure", icon: <GitBranch className="h-5 w-5 text-teal-400" />, key: "heap" },
  ],
  machineLearning: [
    { title: "Neural Network", description: "Visualize Neural Network", icon: <Brain className="h-5 w-5 text-purple-400" />, key: "neuralNetwork" },
  ],
};

interface VisualizationSectionProps {
  onSelectVisualization: (key: string) => void;
}

export const VisualizationSection: React.FC<VisualizationSectionProps> = ({ onSelectVisualization }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const currentVisualizations = selectedCategory ? visualizations[selectedCategory as keyof typeof visualizations] : [];

  return (
    <section className="py-16 sm:py-24 bg-gray-950 text-gray-300">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-100 mb-12 sm:mb-16">
          Visualize Code in Action
        </h2>

        {!selectedCategory ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {categories.map((category) => (
              <div
                key={category.key}
                className="bg-gray-900 rounded-lg shadow-lg hover:shadow-cyan-900/30 ring-1 ring-gray-800 cursor-pointer p-6 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:bg-gray-800/50"
                onClick={() => setSelectedCategory(category.key)}
                role="button"
                tabIndex={0} // Make it focusable
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedCategory(category.key)} // Keyboard accessibility
                aria-label={`Select ${category.title} category`}
              >
                <div className="mb-5 p-4 rounded-full bg-gradient-to-br from-gray-800 to-gray-700 inline-flex items-center justify-center ring-1 ring-gray-600">
                  {category.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-100">
                  {category.title}
                </h3>
                <p className="text-gray-400 text-sm">
                  {category.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <>
            <button
              onClick={() => setSelectedCategory(null)}
              className="mb-8 sm:mb-10 bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-md transition-colors duration-200 inline-flex items-center gap-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-950"
              aria-label="Back to categories"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Categories
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {currentVisualizations.map((viz) => (
                <div
                  key={viz.key}
                  className="bg-gray-900 rounded-lg shadow-lg hover:shadow-blue-900/30 ring-1 ring-gray-800 p-6 flex flex-col justify-between transition-all duration-300 hover:bg-gray-800/50"
                >
                  <div> {/* Content container */}
                    <div className="mb-4 inline-flex p-2 rounded-full bg-gray-800 ring-1 ring-gray-700">
                      {viz.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-100">
                      {viz.title}
                    </h3>
                    <p className="text-gray-400 mb-5 text-sm">
                      {viz.description}
                    </p>
                  </div>
                  <Button
                    onClick={() => onSelectVisualization(viz.key)}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center justify-center gap-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    aria-label={`Explore ${viz.title}`}
                  >
                    Explore <Code2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};