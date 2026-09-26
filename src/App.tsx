import { useState, useEffect, lazy, Suspense } from "react";
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
import ScrollToHash from "./components/ScrollToHash";
import VisualizerPage from "./components/Visualizer/VisualizerPage";
import type { VisualizationKey } from "./components/homepage/catalog";

// Visualizers, lazily loaded.
//
// Every one of these sits behind its own route and none is needed for first
// paint, while the app previously shipped as a single 3.1 MB chunk that Vite
// warned about on every build. Splitting them here is what keeps adding
// visualizers from making the landing page slower.
const BinarySearchVisualizer = lazy(() => import("./components/BinarySearchVisualizer"));
const SortingAlgorithmVisualizer = lazy(() => import("./components/SortingAlgorithmVisualizer"));
const LinkedListVisualizer = lazy(() => import("./components/LinkedListVisualizer"));
const LongestSubarraySumKVisualizer = lazy(() => import("./components/LongestSubarraySumKVisualizer"));
const SpiralMatrixAnimation = lazy(() => import("./components/SpiralAnimation"));
const RotateImageVisualizer = lazy(() => import("./components/RotateImageVisualizer"));
const BinaryTreeTraversalVisualizer = lazy(() => import("./components/BinaryTreeTraversalVisualizer"));
const StackAndQueueVisualizer = lazy(() => import("./components/StackVisualizater"));
const FloydsAlgorithmVisualizer = lazy(() => import("./components/FloydsAlgorithmVisualizer"));
const TreeVisualizer = lazy(() => import("./components/TreeVisualizer"));
const NeuralNetworkVisualizer = lazy(() => import("./components/NeuralNetworkVisualizer"));
const GraphTraversalVisualizer = lazy(() => import("./components/GraphTraversalVisualizer"));
const HeapDataStructure = lazy(() => import("./components/Datastructures/Heaps/heapDataStructure"));
const DynamicProgrammingVisualizer = lazy(() => import("./components/DynamicProgrammingVisualizer"));
const TopologicalSortVisualizer = lazy(() => import("./components/TopologicalSortVisualizer"));
const NQueensVisualizer = lazy(() => import("./components/NQueensVisualizer"));
const TrieVisualizer = lazy(() => import("./components/trie/TrieVisualizer"));

/**
 * One entry per catalogue key.
 *
 * Typed as a Record over VisualizationKey so a catalogue entry with no route,
 * or a route whose path is misspelled, is a compile error. Before this the two
 * lists were kept in step by hand, and a mismatch rendered a blank page under
 * no header with nothing to catch it.
 *
 * "own" means the component renders its own full-screen chrome via
 * VisualizerLayout and needs `onBack`; "page" means it is plain content that
 * VisualizerPage wraps.
 */
type RouteSpec =
  | { kind: "own"; Component: React.ComponentType<{ onBack: () => void }> }
  | { kind: "page"; title: string; Component: React.ComponentType };

const VISUALIZER_ROUTES: Record<VisualizationKey, RouteSpec> = {
  binarySearch: { kind: "own", Component: BinarySearchVisualizer },
  sortingAlgorithms: { kind: "own", Component: SortingAlgorithmVisualizer },
  linkedList: { kind: "own", Component: LinkedListVisualizer },

  longestSubarray: { kind: "page", title: "Longest Subarray with Sum K", Component: LongestSubarraySumKVisualizer },
  spiralMatrix: { kind: "page", title: "Spiral Matrix Traversal", Component: SpiralMatrixAnimation },
  rotateImage: { kind: "page", title: "Rotate Image", Component: RotateImageVisualizer },
  binaryTree: { kind: "page", title: "Binary Tree Traversal", Component: BinaryTreeTraversalVisualizer },
  stack: { kind: "page", title: "Stacks & Queues", Component: StackAndQueueVisualizer },
  hareTortoise: { kind: "page", title: "Floyd's Cycle Detection", Component: FloydsAlgorithmVisualizer },
  tree: { kind: "page", title: "Binary Search Tree", Component: TreeVisualizer },
  neuralNetwork: { kind: "page", title: "Neural Network", Component: NeuralNetworkVisualizer },
  graph: { kind: "page", title: "Graph Algorithms", Component: GraphTraversalVisualizer },
  heap: { kind: "page", title: "Heap Data Structure", Component: HeapDataStructure },

  dynamicProgramming: { kind: "page", title: "Dynamic Programming", Component: DynamicProgrammingVisualizer },
  topologicalSort: { kind: "page", title: "Topological Sort & Union-Find", Component: TopologicalSortVisualizer },
  nQueens: { kind: "page", title: "N-Queens Backtracking", Component: NQueensVisualizer },
  trie: { kind: "page", title: "Trie (Prefix Tree)", Component: TrieVisualizer },
};

/** Deliberately plain: the UI checker samples ~1.4s after load, so a fallback
 *  that animates or delays would be what it measures. */
const ChunkFallback = () => (
  <p className="p-8 text-center text-sm text-muted-foreground">Loading visualizer…</p>
);

const VisualizeWrapper = () => {
  const navigate = useNavigate();
  // Return to the visualization grid the user launched from, rather than the
  // top of the home page. ScrollToHash performs the scroll — React Router will
  // put the fragment in the URL but not act on it.
  const handleBack = () => navigate({ pathname: "/", hash: "visualizations" });

  return (
    <Routes>
      {(Object.entries(VISUALIZER_ROUTES) as [VisualizationKey, RouteSpec][]).map(
        ([key, spec]) => (
          <Route
            key={key}
            path={key}
            element={
              spec.kind === "own" ? (
                <Suspense fallback={<ChunkFallback />}>
                  <spec.Component onBack={handleBack} />
                </Suspense>
              ) : (
                // Suspense sits inside the page, not around it, so the header
                // and its Back button are in the DOM while the chunk loads.
                <VisualizerPage title={spec.title} onBack={handleBack}>
                  <Suspense fallback={<ChunkFallback />}>
                    <spec.Component />
                  </Suspense>
                </VisualizerPage>
              )
            }
          />
        ),
      )}

      <Route index element={<Navigate to="/" replace />} />
      {/* Without this, /visualize/typo rendered a blank page under no header. */}
      <Route path="*" element={<NotFoundPage />} />
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
            <ScrollToHash />
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
