import { useEffect, lazy, Suspense } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { warmBackend } from "./lib/api";
import HomePage from "./components/HomePage";
import { LoginPage } from "./components/Auth/Login";
import { AuthCallback } from "./components/Auth/AuthCallback";

import { SignUpPage } from "./components/Auth/SignUpPage";
import { ForgotPassword } from "./components/Auth/ForgotPassword";
import NotFoundPage from "./components/404";
import About from "./components/About";
import ScrollToHash from "./components/ScrollToHash";
import Seo from "./components/Seo";
import VisualizationDirectory from "./components/VisualizationDirectory";
import VisualizerPage from "./components/Visualizer/VisualizerPage";
import { allVisualizations, type VisualizationKey } from "./components/homepage/catalog";

// Visualizers, lazily loaded.
//
// Every one of these sits behind its own route and none is needed for first
// paint, while the app previously shipped as a single 3.1 MB chunk that Vite
// warned about on every build. Splitting them here is what keeps adding
// visualizers from making the landing page slower.
const ChatInterface = lazy(() => import("./components/chatbot/chatBot"));
const BinarySearchVisualizer = lazy(() => import("./components/BinarySearchVisualizer"));
const ArraysHashingPage = lazy(() => import("./components/patterns/ArraysHashingPage"));
const TwoPointersPage = lazy(() => import("./components/patterns/TwoPointersPage"));
const SlidingWindowPage = lazy(() => import("./components/patterns/SlidingWindowPage"));
const StackPage = lazy(() => import("./components/patterns/StackPage"));
const BinarySearchPage = lazy(() => import("./components/patterns/BinarySearchPage"));
const LinkedListPage = lazy(() => import("./components/patterns/LinkedListPage"));
const TreesPage = lazy(() => import("./components/patterns/TreesPage"));
const TriesPage = lazy(() => import("./components/patterns/TriesPage"));
const HeapPage = lazy(() => import("./components/patterns/HeapPage"));
const BacktrackingPage = lazy(() => import("./components/patterns/BacktrackingPage"));
const GraphsPage = lazy(() => import("./components/patterns/GraphsPage"));
const AdvancedGraphsPage = lazy(() => import("./components/patterns/AdvancedGraphsPage"));
const Dp1Page = lazy(() => import("./components/patterns/Dp1Page"));
const SortingAlgorithmVisualizer = lazy(() => import("./components/SortingAlgorithmVisualizer"));
const LinkedListVisualizer = lazy(() => import("./components/LinkedListVisualizer"));
const LongestSubarraySumKVisualizer = lazy(() => import("./components/LongestSubarraySumKVisualizer"));
const SpiralMatrixAnimation = lazy(() => import("./components/SpiralAnimation"));
const RotateImageVisualizer = lazy(() => import("./components/RotateImageVisualizer"));
const BinaryTreeTraversalVisualizer = lazy(() => import("./components/BinaryTreeTraversalVisualizer"));
const StackAndQueueVisualizer = lazy(() => import("./components/StackVisualizater"));
const FloydsAlgorithmVisualizer = lazy(() => import("./components/FloydsAlgorithmVisualizer"));
const TreeVisualizer = lazy(() => import("./components/TreeVisualizer"));
const NeuralNetworkTrainer = lazy(() => import("./components/ml/NeuralNetworkTrainer"));
const GradientDescentVisualizer = lazy(() => import("./components/ml/GradientDescentVisualizer"));
const LinearRegressionVisualizer = lazy(() => import("./components/ml/LinearRegressionVisualizer"));
const KMeansVisualizer = lazy(() => import("./components/ml/KMeansVisualizer"));
const AttentionVisualizer = lazy(() => import("./components/ml/AttentionVisualizer"));
const SamplingVisualizer = lazy(() => import("./components/ml/SamplingVisualizer"));
const DecisionTreeVisualizer = lazy(() => import("./components/ml/DecisionTreeVisualizer"));
const NaiveBayesVisualizer = lazy(() => import("./components/ml/NaiveBayesVisualizer"));
const RandomForestVisualizer = lazy(() => import("./components/ml/RandomForestVisualizer"));
const GradientBoostingVisualizer = lazy(() => import("./components/ml/GradientBoostingVisualizer"));
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
  neuralNetwork: { kind: "page", title: "Neural Network", Component: NeuralNetworkTrainer },
  gradientDescent: { kind: "page", title: "Gradient Descent", Component: GradientDescentVisualizer },
  linearRegression: { kind: "page", title: "Linear Regression", Component: LinearRegressionVisualizer },
  kMeans: { kind: "page", title: "K-Means Clustering", Component: KMeansVisualizer },
  attention: { kind: "page", title: "Self-Attention", Component: AttentionVisualizer },
  sampling: { kind: "page", title: "Next-Token Sampling", Component: SamplingVisualizer },
  decisionTree: { kind: "page", title: "Decision Tree", Component: DecisionTreeVisualizer },
  naiveBayes: { kind: "page", title: "Naive Bayes", Component: NaiveBayesVisualizer },
  randomForest: { kind: "page", title: "Random Forest", Component: RandomForestVisualizer },
  gradientBoosting: { kind: "page", title: "Gradient Boosting", Component: GradientBoostingVisualizer },
  graph: { kind: "page", title: "Graph Algorithms", Component: GraphTraversalVisualizer },
  heap: { kind: "page", title: "Heap Data Structure", Component: HeapDataStructure },

  dynamicProgramming: { kind: "page", title: "Dynamic Programming", Component: DynamicProgrammingVisualizer },
  topologicalSort: { kind: "page", title: "Topological Sort & Union-Find", Component: TopologicalSortVisualizer },
  nQueens: { kind: "page", title: "N-Queens Backtracking", Component: NQueensVisualizer },
  trie: { kind: "page", title: "Trie (Prefix Tree)", Component: TrieVisualizer },
  arraysHashing: { kind: "page", title: "Arrays & Hashing", Component: ArraysHashingPage },
  twoPointers: { kind: "page", title: "Two Pointers", Component: TwoPointersPage },
  slidingWindow: { kind: "page", title: "Sliding Window", Component: SlidingWindowPage },
  stackPattern: { kind: "page", title: "Stack", Component: StackPage },
  binarySearchPattern: { kind: "page", title: "Binary Search", Component: BinarySearchPage },
  linkedListPattern: { kind: "page", title: "Linked List", Component: LinkedListPage },
  treesPattern: { kind: "page", title: "Trees", Component: TreesPage },
  triesPattern: { kind: "page", title: "Tries", Component: TriesPage },
  heapPattern: { kind: "page", title: "Heap / Priority Queue", Component: HeapPage },
  backtrackingPattern: { kind: "page", title: "Backtracking", Component: BacktrackingPage },
  graphsPattern: { kind: "page", title: "Graphs", Component: GraphsPage },
  advancedGraphsPattern: { kind: "page", title: "Advanced Graphs", Component: AdvancedGraphsPage },
  dp1Pattern: { kind: "page", title: "1-D Dynamic Programming", Component: Dp1Page },
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
                <VisualizerPage title={spec.title} description={allVisualizations.find((viz) => viz.key === key)?.description} onBack={handleBack}>
                  <Suspense fallback={<ChunkFallback />}>
                    <spec.Component />
                  </Suspense>
                </VisualizerPage>
              )
            }
          />
        ),
      )}

      <Route index element={<Navigate to="/visualizations" replace />} />
      {/* Without this, /visualize/typo rendered a blank page under no header. */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

function App() {
  // Wake the backend while the user is still reading; see warmBackend.
  // There is no splash screen any more: it held every page behind a fixed
  // 1.8s "System initializing" animation that was waiting on nothing.
  useEffect(() => warmBackend(), []);

  return (
    <>
      <div>
        <AuthProvider>
          <>
            <Seo />
            <ScrollToHash />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/about" element={<About />} />
              <Route path="/visualizations" element={<VisualizationDirectory />} />

              {/* Visualization Routes */}
              <Route path="/visualize/*" element={<VisualizeWrapper />} />

              {/* AI tutor */}
              <Route
                path="/chat"
                element={
                  <Suspense fallback={<p className="p-8 text-center text-sm text-muted-foreground">Loading AI tutor…</p>}>
                    <ChatInterface />
                  </Suspense>
                }
              />

              {/* Fallback route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </>
        </AuthProvider>
      </div>
    </>
  );
}

export default App;
