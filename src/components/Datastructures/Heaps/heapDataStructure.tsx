import { useState } from 'react';
import HeapVisualization from "./HeapVisualization"; // Assuming this component exists and will be updated
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"; // Using Card for structure
import { Eye, EyeOff } from 'lucide-react'; // Icons for toggle button

const HeapDataStructure = () => {
  const [showExplanations, setShowExplanations] = useState(true);
  const [activeTab, setActiveTab] = useState('insertion');

  // Tabs definition
  const tabs = [
    { id: 'insertion', label: 'Insertion' },
    { id: 'deletion', label: 'Deletion' },
    { id: 'heapify', label: 'Heapify Down' },
    { id: 'building', label: 'Build Heap' },
    { id: 'update', label: 'Update Key' },
    { id: 'heapsort', label: 'Heap Sort' },
    { id: 'summary', label: 'Operations Summary' }
  ];

  const toggleExplanations = () => {
    setShowExplanations((prev) => !prev);
  };

  const renderTabContent = () => {
    // Common dark theme classes
    const cardClass = "bg-gray-800 border border-gray-700/50 p-4 sm:p-6 rounded-lg text-gray-300";
    const codeBlockClass = "bg-black/50 p-3 rounded-md border border-gray-700 my-3 overflow-x-auto";
    const codeClass = "text-sm font-mono text-teal-300";
    const complexityClass = "text-teal-400 font-mono text-sm";
    const sectionTitleClass = "text-lg sm:text-xl font-semibold text-teal-400 mb-3";
    const descriptionClass = "text-sm text-gray-300 mb-2 leading-relaxed";
    const listClass = "list-decimal list-inside mb-4 ml-4 space-y-1 text-sm text-gray-400";

    switch (activeTab) {
      case 'insertion':
        return (
          <div className={cardClass}>
            <h3 className={sectionTitleClass}>Heap Insertion</h3>
            <p className={descriptionClass}>
              <strong className="font-medium text-gray-200">Goal:</strong> Add a new element while maintaining the heap property (min-heap or max-heap).
            </p>
            <p className="font-medium text-gray-200 mb-1 text-sm">Algorithm:</p>
            <ol className={listClass}>
              <li>Add the new element to the bottom level of the heap (end of the array).</li>
              <li>Compare the added element with its parent.</li>
              <li>If they are in the wrong order (e.g., child &lt; parent in min-heap), swap them.</li>
              <li>Repeat steps 2 and 3 ("sift-up" or "bubble-up") until the heap property is restored or the root is reached.</li>
            </ol>
            <div className={codeBlockClass}>
              <pre>
                <code className={codeClass}>{`function insert(heap, value, isMinHeap) {
  heap.push(value);
  let index = heap.length - 1;
  while (index > 0) {
    let parentIndex = Math.floor((index - 1) / 2);
    // Condition changes based on heap type
    const shouldSwap = isMinHeap
      ? heap[index] < heap[parentIndex]
      : heap[index] > heap[parentIndex];

    if (!shouldSwap) break; // Correct position found

    // Swap
    [heap[index], heap[parentIndex]] = [heap[parentIndex], heap[index]];
    index = parentIndex; // Move up
  }
}`}</code>
              </pre>
            </div>
            <p className="text-sm">
              <strong className="font-medium text-gray-200">Time Complexity:</strong> <span className={complexityClass}>O(log n)</span>
            </p>
          </div>
        );
      case 'deletion':
        return (
          <div className={cardClass}>
            <h3 className={sectionTitleClass}>Root Extraction (Deletion)</h3>
            <p className={descriptionClass}>
              <strong className="font-medium text-gray-200">Goal:</strong> Remove the root element (min/max value) and restore the heap property.
            </p>
            <p className="font-medium text-gray-200 mb-1 text-sm">Algorithm:</p>
            <ol className={listClass}>
              <li>Replace the root element with the last element of the heap.</li>
              <li>Remove the last element (reducing the heap size).</li>
              <li>Compare the new root with its children.</li>
              <li>If the new root is out of order (smaller for max-heap or larger for min-heap), swap it with the appropriate child.</li>
              <li>Repeat steps 3 and 4 ("sift-down" or "heapify-down") until the heap property is restored.</li>
            </ol>
            <div className={codeBlockClass}>
              <pre>
                <code className={codeClass}>{`function extractRoot(heap, isMinHeap) {
  if (heap.length === 0) return null;
  const root = heap[0];
  const lastElement = heap.pop(); // Remove last element
  if (heap.length > 0) {
    heap[0] = lastElement; // Place it at the root
    heapifyDown(heap, 0, isMinHeap); // Restore heap property
  }
  return root;
}

// (heapifyDown function needed - similar to heapify in buildHeap)
`}</code>
              </pre>
            </div>
            <p className="text-sm">
              <strong className="font-medium text-gray-200">Time Complexity:</strong> <span className={complexityClass}>O(log n)</span>
            </p>
          </div>
        );
      case 'heapify':
        return (
          <div className={cardClass}>
            <h3 className={sectionTitleClass}>Heapify Down (Sift Down)</h3>
            <p className={descriptionClass}>
              <strong className="font-medium text-gray-200">Goal:</strong> Restore the heap property for a subtree rooted at a given index, assuming its children are already valid heaps.
            </p>
            <p className="font-medium text-gray-200 mb-1 text-sm">Algorithm:</p>
            <ol className={listClass}>
              <li>Start at the given node index.</li>
              <li>Compare the node with its left and right children.</li>
              <li>Select the target element (smallest for min-heap, largest for max-heap) among the node and its children.</li>
              <li>If the target is not the current node, swap them.</li>
              <li>Recursively apply heapify-down on the affected subtree.</li>
            </ol>
            <div className={codeBlockClass}>
              <pre>
                <code className={codeClass}>{`function heapifyDown(heap, index, isMinHeap) {
  const n = heap.length;
  let targetIndex = index;
  const leftChildIndex = 2 * index + 1;
  const rightChildIndex = 2 * index + 2;

  if (leftChildIndex < n) {
    const shouldSwapLeft = isMinHeap
      ? heap[leftChildIndex] < heap[targetIndex]
      : heap[leftChildIndex] > heap[targetIndex];
    if (shouldSwapLeft) targetIndex = leftChildIndex;
  }
  if (rightChildIndex < n) {
    const shouldSwapRight = isMinHeap
      ? heap[rightChildIndex] < heap[targetIndex]
      : heap[rightChildIndex] > heap[targetIndex];
    if (shouldSwapRight) targetIndex = rightChildIndex;
  }

  if (targetIndex !== index) {
    [heap[index], heap[targetIndex]] = [heap[targetIndex], heap[index]];
    heapifyDown(heap, targetIndex, isMinHeap);
  }
}`}</code>
              </pre>
            </div>
            <p className="text-sm">
              <strong className="font-medium text-gray-200">Time Complexity:</strong> <span className={complexityClass}>O(log n)</span>
            </p>
          </div>
        );
      case 'building':
        return (
          <div className={cardClass}>
            <h3 className={sectionTitleClass}>Build Heap</h3>
            <p className={descriptionClass}>
              <strong className="font-medium text-gray-200">Goal:</strong> Convert an arbitrary array into a valid heap efficiently.
            </p>
            <p className="font-medium text-gray-200 mb-1 text-sm">Algorithm (Bottom-Up):</p>
            <ol className={listClass}>
              <li>Start from the last non-leaf node: <code className={codeClass}>Math.floor(n/2) - 1</code>.</li>
              <li>Call <code className={codeClass}>heapifyDown</code> on this node.</li>
              <li>Move to the previous node and repeat until the root is processed.</li>
            </ol>
            <div className={codeBlockClass}>
              <pre>
                <code className={codeClass}>{`function buildHeap(array, isMinHeap) {
  const n = array.length;
  const firstNonLeafIndex = Math.floor(n / 2) - 1;

  for (let i = firstNonLeafIndex; i >= 0; i--) {
    heapifyDown(array, i, isMinHeap);
  }
  // The array is now a valid heap
}`}</code>
              </pre>
            </div>
            <p className="text-sm">
              <strong className="font-medium text-gray-200">Time Complexity:</strong> <span className={complexityClass}>O(n)</span> (More efficient than n insertions)
            </p>
          </div>
        );
      case 'update':
        return (
          <div className={cardClass}>
            <h3 className={sectionTitleClass}>Update Key</h3>
            <p className={descriptionClass}>
              <strong className="font-medium text-gray-200">Goal:</strong> Change a node’s value and restore the heap property.
            </p>
            <p className="font-medium text-gray-200 mb-1 text-sm">Algorithm:</p>
            <ol className={listClass}>
              <li>Update the value at the specified index.</li>
              <li>Determine if the new value is more or less important compared to the old value.</li>
              <li>If more important (e.g. smaller for min-heap), perform a sift-up.</li>
              <li>If less important, perform a heapify-down.</li>
            </ol>
            <div className={codeBlockClass}>
              <pre>
                <code className={codeClass}>{`function updateKey(heap, index, newValue, isMinHeap) {
  if (index < 0 || index >= heap.length) return; // Out of bounds

  const oldValue = heap[index];
  heap[index] = newValue;

  const valueIncreased = isMinHeap ? newValue < oldValue : newValue > oldValue;
  const valueDecreased = isMinHeap ? newValue > oldValue : newValue < oldValue;

  if (valueIncreased) {
    let currentIndex = index;
    while (currentIndex > 0) {
      const parentIndex = Math.floor((currentIndex - 1) / 2);
      const shouldSwap = isMinHeap
        ? heap[currentIndex] < heap[parentIndex]
        : heap[currentIndex] > heap[parentIndex];
      if (!shouldSwap) break;
      [heap[currentIndex], heap[parentIndex]] = [heap[parentIndex], heap[currentIndex]];
      currentIndex = parentIndex;
    }
  } else if (valueDecreased) {
    heapifyDown(heap, index, isMinHeap);
  }
}`}</code>
              </pre>
            </div>
            <p className="text-sm">
              <strong className="font-medium text-gray-200">Time Complexity:</strong> <span className={complexityClass}>O(log n)</span>
            </p>
          </div>
        );
      case 'heapsort':
        return (
          <div className={cardClass}>
            <h3 className={sectionTitleClass}>Heap Sort</h3>
            <p className={descriptionClass}>
              <strong className="font-medium text-gray-200">Goal:</strong> Sort an array in-place using a heap.
            </p>
            <p className="font-medium text-gray-200 mb-1 text-sm">Algorithm:</p>
            <ol className={listClass}>
              <li>Build a heap (max-heap for ascending, min-heap for descending).</li>
              <li>Swap the root with the last element and reduce the heap size.</li>
              <li>Call <code className={codeClass}>heapifyDown</code> on the new root.</li>
              <li>Repeat until one element remains.</li>
            </ol>
            <div className={codeBlockClass}>
              <pre>
                <code className={codeClass}>{`function heapSort(array, sortAscending = true) {
  const isMinHeap = !sortAscending; // Use min-heap for descending sort
  buildHeap(array, isMinHeap);

  for (let i = array.length - 1; i > 0; i--) {
    [array[0], array[i]] = [array[i], array[0]];
    heapifyDownForSort(array, 0, i, isMinHeap);
  }
  return array;
}

// heapifyDownForSort is a modified version that accepts heapSize.
function heapifyDownForSort(heap, index, heapSize, isMinHeap) {
  // Similar to heapifyDown but using heapSize instead of heap.length.
}
`}</code>
              </pre>
            </div>
            <p className="text-sm">
              <strong className="font-medium text-gray-200">Time Complexity:</strong> <span className={complexityClass}>O(n log n)</span> (Build: O(n), Extractions: n * O(log n))
            </p>
            <p className="text-sm">
              <strong className="font-medium text-gray-200">Space Complexity:</strong> O(1) (In-place sort)
            </p>
          </div>
        );
      case 'summary': {
        const summaryItemClass = "bg-gray-700/50 p-3 rounded border border-gray-600/50";
        const summaryTitleClass = "font-semibold text-teal-400 mb-1 text-base";
        const summaryDescClass = "text-gray-300 text-xs";
        const summaryTimeClass = "text-xs text-teal-500 mt-1 font-mono";
        return (
          <div className={cardClass}>
            <h3 className={sectionTitleClass}>Operations Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
              <div className={summaryItemClass}>
                <h4 className={summaryTitleClass}>Insertion</h4>
                <p className={summaryDescClass}>Add element, sift up.</p>
                <p className={summaryTimeClass}>O(log n)</p>
              </div>
              <div className={summaryItemClass}>
                <h4 className={summaryTitleClass}>Extraction (Root)</h4>
                <p className={summaryDescClass}>Remove root, replace, sift down.</p>
                <p className={summaryTimeClass}>O(log n)</p>
              </div>
              <div className={summaryItemClass}>
                <h4 className={summaryTitleClass}>Heapify Down</h4>
                <p className={summaryDescClass}>Restore heap property downward.</p>
                <p className={summaryTimeClass}>O(log n)</p>
              </div>
              <div className={summaryItemClass}>
                <h4 className={summaryTitleClass}>Build Heap</h4>
                <p className={summaryDescClass}>Efficiently convert array to heap.</p>
                <p className={summaryTimeClass}>O(n)</p>
              </div>
              <div className={summaryItemClass}>
                <h4 className={summaryTitleClass}>Update Key</h4>
                <p className={summaryDescClass}>Change value, adjust position.</p>
                <p className={summaryTimeClass}>O(log n)</p>
              </div>
              <div className={summaryItemClass}>
                <h4 className={summaryTitleClass}>Heap Sort</h4>
                <p className={summaryDescClass}>In-place sort using heap properties.</p>
                <p className={summaryTimeClass}>O(n log n)</p>
              </div>
            </div>
            <p className={descriptionClass}>
              Heaps provide efficient retrieval of the min/max element and are ideal for priority queues. Heap Sort offers an efficient in-place sorting method.
            </p>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-gray-950 to-black text-gray-300">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-2">Heap Data Structure</h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
            Visualize and understand binary heap operations like insertion, extraction, and heapify.
          </p>
        </header>

        {/* Visualization Card */}
        <Card className="bg-gray-900 border border-gray-700/50 shadow-xl rounded-lg overflow-hidden mb-8 sm:mb-12">
          <CardHeader className="bg-gray-800 border-b border-gray-700/50 p-4">
            <CardTitle className="text-lg text-gray-200 text-center">
              Interactive Heap Visualization
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <HeapVisualization />
          </CardContent>
        </Card>

        {/* Explanations Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-100">Heap Operations Explained</h2>
            <button
              onClick={toggleExplanations}
              className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium text-xs sm:text-sm py-1.5 px-3 rounded-md transition duration-150 ease-in-out flex items-center gap-1.5"
            >
              {showExplanations ? <EyeOff size={16} /> : <Eye size={16} />}
              {showExplanations ? "Hide Details" : "Show Details"}
            </button>
          </div>

          {showExplanations && (
            <Card className="bg-gray-900 border border-gray-700/50 shadow-lg rounded-lg overflow-hidden">
              {/* Tabs */}
              <div className="border-b border-gray-700">
                <div className="flex overflow-x-auto no-scrollbar">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2.5 px-4 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'text-teal-400 border-teal-500'
                          : 'text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-600'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Tab Content */}
              <div className="p-4 sm:p-6">
                {renderTabContent()}
              </div>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
};

export default HeapDataStructure;
