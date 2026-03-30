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

const VisualizeWrapper = () => {
  const navigate = useNavigate();
  const handleBack = () => navigate('/');

  return (
    <Routes>
      <Route path="binarySearch" element={<BinarySearchVisualizer onBack={handleBack} />} />
      <Route path="sortingAlgorithms" element={<SortingAlgorithmVisualizer onBack={handleBack} />} />
      {/* Fallback for other visualizers that might not be refactored yet */}
      <Route path="longestSubarray" element={<LongestSubarraySumKVisualizer onBack={handleBack} />} />
      <Route path="spiralMatrix" element={<SpiralMatrixAnimation onBack={handleBack} />} />
      <Route path="rotateImage" element={<RotateImageVisualizer onBack={handleBack} />} />
      <Route path="binaryTree" element={<BinaryTreeTraversalVisualizer onBack={handleBack} />} />
      <Route path="linkedList" element={<LinkedListVisualizer onBack={handleBack} />} />
      <Route path="stack" element={<StackAndQueueVisualizer onBack={handleBack} />} />
      <Route path="hareTortoise" element={<FloydsAlgorithmVisualizer onBack={handleBack} />} />
      <Route path="tree" element={<TreeVisualizer onBack={handleBack} />} />
      <Route path="neuralNetwork" element={<NeuralNetworkVisualizer onBack={handleBack} />} />
      <Route path="graph" element={<GraphTraversalVisualizer onBack={handleBack} />} />
      <Route path="heap" element={<HeapDataStructure onBack={handleBack} />} />
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
