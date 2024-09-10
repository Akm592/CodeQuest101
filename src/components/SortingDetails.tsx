// SortingDetails.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface SortingDetailsProps {
  algorithm: string;
}

const SortingDetails: React.FC<SortingDetailsProps> = ({ algorithm }) => {
  const getAlgorithmDetails = () => {
    switch (algorithm) {
      case "bubble":
        return {
          name: "Bubble Sort",
          description:
            "A simple sorting algorithm that repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.",
          timeComplexity: "O(n²)",
          spaceComplexity: "O(1)",
        };
      case "quick":
        return {
          name: "Quick Sort",
          description:
            "An efficient, recursive divide-and-conquer algorithm that partitions the array and sorts the partitions independently.",
          timeComplexity: "O(n log n) average, O(n²) worst case",
          spaceComplexity: "O(log n)",
        };
      case "selection":
        return {
          name: "Selection Sort",
          description:
            "A simple sorting algorithm that repeatedly selects the smallest element from the unsorted portion and puts it at the beginning.",
          timeComplexity: "O(n²)",
          spaceComplexity: "O(1)",
        };
      case "merge":
        return {
          name: "Merge Sort",
          description:
            "An efficient, stable divide-and-conquer algorithm that divides the array into smaller subarrays, sorts them, and then merges them.",
          timeComplexity: "O(n log n)",
          spaceComplexity: "O(n)",
        };
      default:
        return {
          name: "Unknown Algorithm",
          description: "No details available for this algorithm.",
          timeComplexity: "Unknown",
          spaceComplexity: "Unknown",
        };
    }
  };

  const details = getAlgorithmDetails();

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{details.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-2">
          <strong>Description:</strong> {details.description}
        </p>
        <p className="mb-2">
          <strong>Time Complexity:</strong> {details.timeComplexity}
        </p>
        <p>
          <strong>Space Complexity:</strong> {details.spaceComplexity}
        </p>
      </CardContent>
    </Card>
  );
};

export default SortingDetails;
