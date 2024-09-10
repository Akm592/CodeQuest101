import { useState } from "react";
import HomePage from "./components/HomePage";
import LongestSubarraySumKVisualizer from "./components/LongestSubarraySumKVisualizer";
import SpiralMatrixAnimation from "./components/SpiralAnimation";
import RotateImageVisualizer from "./components/RotateImageVisualizer";
import BinaryTreeTraversalVisualizer from "./components/BinaryTreeTraversalVisualizer";
import SortingAlgorithmVisualizer from "./components/SortingAlgorithmVisualizer";
import BinarySearchVisualizer from "./components/BinarySearchVisualizer";

function App() {
  const [currentView, setCurrentView] = useState("home");

  const renderView = () => {
    switch (currentView) {
      case "longestSubarray":
        return <LongestSubarraySumKVisualizer />;
      case "spiralMatrix":
        return <SpiralMatrixAnimation />;
      case "rotateImage":
        return <RotateImageVisualizer />;
      case "binaryTree":
        return <BinaryTreeTraversalVisualizer />;
      case "sortingAlgorithms":
        return <SortingAlgorithmVisualizer />;
      case "binarySearch":
        return <BinarySearchVisualizer />;
      default:
        return <HomePage onSelectVisualization={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderView()}
      {currentView !== "home" && (
        <button
          className="absolute top-4 left-4 bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
          onClick={() => setCurrentView("home")}
        >
          Back to Home
        </button>
      )}
    </div>
  );
}

export default App;
