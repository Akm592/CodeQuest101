import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import HomePage from "./components/HomePage";
import ChatInterface from "./components/chatbot/chatBot";
import { LoginPage } from "./components/Auth/Login";
import { AuthCallback } from "./components/Auth/AuthCallback";

import { SignUpPage } from "./components/Auth/SignUpPage";
import { ForgotPassword } from "./components/Auth/ForgotPassword";
import NotFoundPage from "./components/404";
import About from "./components/About";
import LoadingScreen from "./components/LoadingScreen";

// Visualizers
import BinarySearchVisualizer from "./components/BinarySearchVisualizer";
import SortingAlgorithmVisualizer from "./components/SortingAlgorithmVisualizer";
import LongestSubarraySumKVisualizer from "./components/LongestSubarraySumKVisualizer";
import SpiralMatrixAnimation from "./components/SpiralAnimation";
import RotateImageVisualizer from "./components/RotateImageVisualizer";
import BinaryTreeTraversalVisualizer from "./components/BinaryTreeTraversalVisualizer";
import LinkedListVisualizer from "./components/LinkedListVisualizer";
import StackAndQueueVisualizer from "./components/StackVisualizater";
import FloydsAlgorithmVisualizer from "./components/FloydsAlgorithmVisualizer";
import TreeVisualizer from "./components/TreeVisualizer";
import NeuralNetworkVisualizer from "./components/NeuralNetworkVisualizer";
import GraphTraversalVisualizer from "./components/GraphTraversalVisualizer";
import HeapDataStructure from "./components/Datastructures/Heaps/heapDataStructure";
import VisualizerPage from "./components/Visualizer/VisualizerPage";

const VisualizeWrapper = () => {
  const navigate = useNavigate();
  // Return to the visualization grid the user launched from, rather than the
  // top of the home page.
  const handleBack = () => navigate("/#visualizations");

  // Three visualizers own their full-screen chrome via VisualizerLayout. The
  // rest are wrapped in VisualizerPage, which supplies the same header and —
  // the point of this — a working way back. Every one of these routes used to
  // be a dead end: ten components accepted `onBack` and discarded it.
  const wrapped = (title: string, element: React.ReactNode) => (
    <VisualizerPage title={title} onBack={handleBack}>
      {element}
    </VisualizerPage>
  );

  return (
    <Routes>
      <Route path="binarySearch" element={<BinarySearchVisualizer onBack={handleBack} />} />
      <Route path="sortingAlgorithms" element={<SortingAlgorithmVisualizer onBack={handleBack} />} />
      <Route path="linkedList" element={<LinkedListVisualizer onBack={handleBack} />} />

      <Route path="longestSubarray" element={wrapped("Longest Subarray with Sum K", <LongestSubarraySumKVisualizer />)} />
      <Route path="spiralMatrix" element={wrapped("Spiral Matrix Traversal", <SpiralMatrixAnimation />)} />
      <Route path="rotateImage" element={wrapped("Rotate Image", <RotateImageVisualizer />)} />
      <Route path="binaryTree" element={wrapped("Binary Tree Traversal", <BinaryTreeTraversalVisualizer />)} />
      <Route path="stack" element={wrapped("Stacks & Queues", <StackAndQueueVisualizer />)} />
      <Route path="hareTortoise" element={wrapped("Floyd's Cycle Detection", <FloydsAlgorithmVisualizer />)} />
      <Route path="tree" element={wrapped("Binary Search Tree", <TreeVisualizer />)} />
      <Route path="neuralNetwork" element={wrapped("Neural Network", <NeuralNetworkVisualizer />)} />
      <Route path="graph" element={wrapped("Graph Algorithms", <GraphTraversalVisualizer />)} />
      <Route path="heap" element={wrapped("Heap Data Structure", <HeapDataStructure />)} />

      <Route index element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate a loading process
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1800); // Drastically reduced for better UX
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {loading && <LoadingScreen onFinished={() => setLoading(false)} />}
      <div style={{ display: loading ? 'none' : 'block' }}>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/about" element={<About />} />

              {/* Visualization Routes */}
              <Route path="/visualize/*" element={<VisualizeWrapper />} />

              {/* Protected route */}
              <Route
                path="/chat"
                element={<ChatInterface />}
              />

              {/* Fallback route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Router>
        </AuthProvider>
      </div>
    </>
  );
}

export default App;
