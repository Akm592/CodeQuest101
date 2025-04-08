import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"; // Adjust path if needed

interface SortingDetailsProps {
  algorithm: string;
}

const SortingDetails: React.FC<SortingDetailsProps> = ({ algorithm }) => {
  // Algorithm details remain the same logic
  const getAlgorithmDetails = () => {
     switch (algorithm) {
      case "bubble":
        return {
          name: "Bubble Sort",
          description:
            "A simple comparison-based algorithm that repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order. The pass through the list is repeated until the list is sorted.",
          timeComplexity: "O(n²) - Worst & Average Case, O(n) - Best Case (already sorted)",
          spaceComplexity: "O(1) - In-place",
        };
      case "quick":
        return {
          name: "Quick Sort",
          description:
            "An efficient, divide-and-conquer algorithm. It works by selecting a 'pivot' element and partitioning the other elements into two sub-arrays, according to whether they are less than or greater than the pivot. The sub-arrays are then sorted recursively.",
          timeComplexity: "O(n log n) - Average & Best Case, O(n²) - Worst Case (rare with good pivot selection)",
          spaceComplexity: "O(log n) - Average (due to recursion stack), O(n) - Worst Case",
        };
      case "selection":
        return {
          name: "Selection Sort",
          description:
            "An in-place comparison sorting algorithm. It divides the input list into two parts: a sorted sublist built from left to right, and a sublist of the remaining unsorted elements. It repeatedly selects the smallest (or largest) element from the unsorted sublist and swaps it with the first unsorted element.",
          timeComplexity: "O(n²) - Worst, Average, and Best Case",
          spaceComplexity: "O(1) - In-place",
        };
      case "merge":
        return {
          name: "Merge Sort",
          description:
            "An efficient, stable, divide-and-conquer algorithm. It divides the unsorted list into n sublists, each containing one element (a list of one element is considered sorted). Then it repeatedly merges sublists to produce new sorted sublists until there is only one sublist remaining.",
          timeComplexity: "O(n log n) - Worst, Average, and Best Case",
          spaceComplexity: "O(n) - Requires additional space for merging",
        };
      default:
        return {
          name: "Algorithm Details",
          description: "Select an algorithm from the dropdown above to see its details.",
          timeComplexity: "N/A",
          spaceComplexity: "N/A",
        };
    }
  };

  const details = getAlgorithmDetails();

  return (
    // Apply dark theme to the details card
    <Card className="mt-6 bg-gray-800 border border-gray-700/50 text-gray-300">
      <CardHeader className="border-b border-gray-700/50 pb-3">
        <CardTitle className="text-lg font-semibold text-gray-100">{details.name}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-2 text-sm">
        <p className="leading-relaxed">
          <strong className="font-medium text-gray-200">Description:</strong> {details.description}
        </p>
        <p>
          <strong className="font-medium text-gray-200">Time Complexity:</strong> <code className="bg-gray-700 px-1.5 py-0.5 rounded text-xs text-teal-300">{details.timeComplexity}</code>
        </p>
        <p>
          <strong className="font-medium text-gray-200">Space Complexity:</strong> <code className="bg-gray-700 px-1.5 py-0.5 rounded text-xs text-teal-300">{details.spaceComplexity}</code>
        </p>
      </CardContent>
    </Card>
  );
};

export default SortingDetails;