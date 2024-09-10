

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Code2, GitBranch, Grid , SortDesc } from "lucide-react";

const visualizations = [
  {
    title: "Longest Subarray Sum K",
    description:
      "Visualize the algorithm for finding the longest subarray with sum K",
    icon: <Code2 className="h-8 w-8 text-primary" />,
    key: "longestSubarray",
  },
  {
    title: "Spiral Matrix",
    description: "Animate the spiral traversal of a matrix",
    icon: <Grid className="h-8 w-8 text-primary" />,
    key: "spiralMatrix",
  },
  {
    title: "Binary Tree Traversal",
    description: "Visualize different tree traversal algorithms",
    icon: <GitBranch className="h-8 w-8 text-primary" />,
    key: "binaryTree",
  },
  {
    title: "Rotate Image",
    description: "Rotate a square matrix in-place",
    icon: <Code2 className="h-8 w-8 text-primary" />,
    key: "rotateImage",
  },

  {
    title: "Sorting Algorithms",
    description: "Visualize popular sorting algorithms in action",
    icon: <SortDesc className="h-8 w-8 text-primary" />,
    key: "sortingAlgorithms",
  },
{
  title: "Binary Search",
  description: "Visualize the binary search algorithm",
  icon: <Code2 className="h-8 w-8 text-primary" />,
  key: "binarySearch",

}
  // Add more visualizations here
];

interface HomePageProps {
  onSelectVisualization: (key: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onSelectVisualization }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        Welcome to CodeQuest
      </h1>
      <p className="text-xl text-center mb-12">
        Explore popular coding questions through interactive visualizations
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visualizations.map((viz) => (
          <Card
            key={viz.key}
            className="hover:shadow-lg transition-shadow duration-300"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {viz.icon}
                <span>{viz.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{viz.description}</CardDescription>
              <button
                onClick={() => onSelectVisualization(viz.key)}
                className="mt-4 inline-block bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded"
              >
                Explore
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
