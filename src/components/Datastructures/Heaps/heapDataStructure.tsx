import { useState } from 'react';
import HeapVisualization from "./HeapVisualization";

const HeapDataStructure = () => {
    const [showExplanations, setShowExplanations] = useState(true);
    const [activeTab, setActiveTab] = useState('insertion');

    const toggleExplanations = () => {
        setShowExplanations((prev) => !prev);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'insertion':
                return (
                    <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-indigo-700 mb-3">Insertion</h3>
                        <p className="mb-2">
                            <span className="font-medium text-gray-700">Description:</span> Add a new element to the heap while maintaining the heap property.
                        </p>
                        <p className="mb-2">
                            <span className="font-medium text-gray-700">Algorithm:</span>
                        </p>
                        <ol className="list-decimal list-inside mb-4 ml-4 space-y-1 text-gray-700">
                            <li>Place the new element at the end of the underlying array.</li>
                            <li>
                                "Bubble up" the element by comparing it with its parent and swapping if needed.
                            </li>
                            <li>Repeat until the correct position is found.</li>
                        </ol>
                        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-3">
                            <pre className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-3">
                                <code className="text-sm font-mono text-gray-800">{`function insert(heap, value) {
  heap.push(value);
  let index = heap.length - 1;
  while (index > 0) {
    let parentIndex = Math.floor((index - 1) / 2);
    if (heap[index] <= heap[parentIndex]) break;
    [heap[index], heap[parentIndex]] = [heap[parentIndex], heap[index]];
    index = parentIndex;
  }
}`}</code>
                            </pre>
                        </div>
                        <p>
                            <span className="font-medium text-gray-700">Time Complexity:</span> <span className="text-indigo-600">O(log n)</span>
                        </p>
                    </div>
                );
            case 'deletion':
                return (
                    <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-indigo-700 mb-3">Deletion (Extracting the Root)</h3>
                        <p className="mb-2">
                            <span className="font-medium text-gray-700">Description:</span> Remove the root element (the maximum for a max-heap or minimum for a min-heap) and restore the heap property.
                        </p>
                        <p className="mb-2">
                            <span className="font-medium text-gray-700">Algorithm:</span>
                        </p>
                        <ol className="list-decimal list-inside mb-4 ml-4 space-y-1 text-gray-700">
                            <li>Remove the root element.</li>
                            <li>Replace it with the last element in the heap.</li>
                            <li>
                                "Heapify" the new root by comparing it with its children and swapping where necessary.
                            </li>
                            <li>Repeat until the heap property is restored.</li>
                        </ol>

                        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-3">
                            <pre className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-3">
                                <code className="text-sm font-mono text-gray-800">{`function extractRoot(heap) {
  if (heap.length === 0) return null;
  const root = heap[0];
  heap[0] = heap.pop();
  heapify(heap, 0);
  return root;
}

function heapify(heap, index) {
  const length = heap.length;
  let largest = index;
  const left = 2 * index + 1;
  const right = 2 * index + 2;

  if (left < length && heap[left] > heap[largest]) {
    largest = left;
  }
  if (right < length && heap[right] > heap[largest]) {
    largest = right;
  }
  if (largest !== index) {
    [heap[index], heap[largest]] = [heap[largest], heap[index]];
    heapify(heap, largest);
  }
}`}</code>
                            </pre>

                        </div>
                        <p>
                            <span className="font-medium text-gray-700">Time Complexity:</span> <span className="text-indigo-600">O(log n)</span>
                        </p>
                    </div>
                );
            case 'heapify':
                return (
                    <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-indigo-700 mb-3">Heapify</h3>
                        <p className="mb-2">
                            <span className="font-medium text-gray-700">Description:</span> Reorder a subtree to ensure the heap property holds.
                        </p>
                        <p className="mb-2">
                            <span className="font-medium text-gray-700">Algorithm:</span>
                        </p>
                        <ol className="list-decimal list-inside mb-4 ml-4 space-y-1 text-gray-700">
                            <li>Identify the node that may violate the heap property.</li>
                            <li>Compare the node with its children.</li>
                            <li>
                                Swap the node with the largest (or smallest) child if the heap condition is not met.
                            </li>
                            <li>Recursively apply the process to the subtree.</li>
                        </ol>
                        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-3">
                            <pre className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-3">
                                <code className="text-sm font-mono text-gray-800">{`function heapify(heap, index) {
  const length = heap.length;
  let largest = index;
  const left = 2 * index + 1;
  const right = 2 * index + 2;

  if (left < length && heap[left] > heap[largest]) {
    largest = left;
  }
  if (right < length && heap[right] > heap[largest]) {
    largest = right;
  }
  if (largest !== index) {
    [heap[index], heap[largest]] = [heap[largest], heap[index]];
    heapify(heap, largest);
  }
}`}</code>
                            </pre>
                        </div>
                        <p>
                            <span className="font-medium text-gray-700">Time Complexity:</span> <span className="text-indigo-600">O(log n)</span>
                        </p>
                    </div>
                );
            case 'building':
                return (
                    <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-indigo-700 mb-3">Building a Heap (Heap Construction)</h3>
                        <p className="mb-2">
                            <span className="font-medium text-gray-700">Description:</span> Convert an unsorted array into a heap.
                        </p>
                        <p className="mb-2">
                            <span className="font-medium text-gray-700">Algorithm:</span>
                        </p>
                        <ol className="list-decimal list-inside mb-4 ml-4 space-y-1 text-gray-700">
                            <li>Start from the last non-leaf node (at index Math.floor(n/2) - 1).</li>
                            <li>Apply the heapify operation on each node in reverse order.</li>
                            <li>Finish when the entire array represents a valid heap.</li>
                        </ol>
                        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-3">
                            <pre className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-3">
                                <code className="text-sm font-mono text-gray-800">{`function buildHeap(array) {
  const startIdx = Math.floor(array.length / 2) - 1;
  for (let i = startIdx; i >= 0; i--) {
    heapify(array, i);
  }
}`}</code>
                            </pre>
                        </div>
                        <p>
                            <span className="font-medium text-gray-700">Time Complexity:</span> <span className="text-indigo-600">O(n)</span>
                        </p>
                    </div>
                );
            case 'update':
                return (
                    <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-indigo-700 mb-3">Increase/Decrease Key</h3>
                        <p className="mb-2">
                            <span className="font-medium text-gray-700">Description:</span> Update the value of an element and adjust its position to maintain the heap property.
                        </p>
                        <p className="mb-2">
                            <span className="font-medium text-gray-700">Algorithm:</span>
                        </p>
                        <ul className="list-disc list-inside mb-4 ml-4 space-y-1 text-gray-700">
                            <li>
                                For Increase Key (in a max-heap): Increase the value and "bubble up."
                            </li>
                            <li>
                                For Decrease Key (in a max-heap): Decrease the value and "heapify" downwards.
                            </li>
                        </ul>
                        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-3">
                            <pre className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-3">
                                <code className="text-sm font-mono text-gray-800">{`function updateKey(heap, index, newKey) {
  const oldKey = heap[index];
  heap[index] = newKey;
  if (newKey > oldKey) {
    // Bubble up for max-heap
    while (index > 0) {
      let parentIndex = Math.floor((index - 1) / 2);
      if (heap[index] <= heap[parentIndex]) break;
      [heap[index], heap[parentIndex]] = [heap[parentIndex], heap[index]];
      index = parentIndex;
    }
  } else {
    // Heapify down
    heapify(heap, index);
  }
}`}</code>
                            </pre>
                        </div>
                        <p>
                            <span className="font-medium text-gray-700">Time Complexity:</span> <span className="text-indigo-600">O(log n)</span>
                        </p>
                    </div>
                );
            case 'heapsort':
                return (
                    <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-indigo-700 mb-3">Heap Sort</h3>
                        <p className="mb-2">
                            <span className="font-medium text-gray-700">Description:</span> Sort an array efficiently by using the heap to repeatedly extract the root.
                        </p>
                        <p className="mb-2">
                            <span className="font-medium text-gray-700">Algorithm:</span>
                        </p>
                        <ol className="list-decimal list-inside mb-4 ml-4 space-y-1 text-gray-700">
                            <li>Convert the array into a heap using buildHeap.</li>
                            <li>Repeatedly extract the root and move it to the end of the array.</li>
                            <li>Restore the heap property after each extraction.</li>
                            <li>Continue until the array is sorted.</li>
                        </ol>
                        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-3">
                            <pre className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-3">
                                <code className="text-sm font-mono text-gray-800">{`function heapSort(array) {
  buildHeap(array);
  for (let i = array.length - 1; i > 0; i--) {
    [array[0], array[i]] = [array[i], array[0]];
    heapify(array, 0);
  }
  return array;
}`}</code>
                            </pre>
                        </div>
                        <p>
                            <span className="font-medium text-gray-700">Time Complexity:</span> <span className="text-indigo-600">O(n log n)</span>
                        </p>
                    </div>
                );
            case 'summary':
                return (
                    <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-indigo-700 mb-3">Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                <h4 className="font-semibold text-indigo-600 mb-2">Insertion</h4>
                                <p className="text-gray-700">Add an element and bubble it up</p>
                                <p className="text-sm text-indigo-500 mt-1">O(log n)</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                <h4 className="font-semibold text-indigo-600 mb-2">Deletion</h4>
                                <p className="text-gray-700">Remove the root and restore the heap</p>
                                <p className="text-sm text-indigo-500 mt-1">O(log n)</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                <h4 className="font-semibold text-indigo-600 mb-2">Heapify</h4>
                                <p className="text-gray-700">Reorder a subtree to fix violations</p>
                                <p className="text-sm text-indigo-500 mt-1">O(log n)</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                <h4 className="font-semibold text-indigo-600 mb-2">Building a Heap</h4>
                                <p className="text-gray-700">Convert unsorted array into a valid heap</p>
                                <p className="text-sm text-indigo-500 mt-1">O(n)</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                <h4 className="font-semibold text-indigo-600 mb-2">Update Key</h4>
                                <p className="text-gray-700">Update value and reposition element</p>
                                <p className="text-sm text-indigo-500 mt-1">O(log n)</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                <h4 className="font-semibold text-indigo-600 mb-2">Heap Sort</h4>
                                <p className="text-gray-700">Sort array by extracting the root</p>
                                <p className="text-sm text-indigo-500 mt-1">O(n log n)</p>
                            </div>
                        </div>
                        <p className="text-gray-700">
                            These operations form the basis of efficient priority queues and sorting algorithms, making heaps a versatile and powerful data structure.
                        </p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen w-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <header className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-indigo-800 mb-2">Heap Data Structure Visualization</h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Explore the fundamental operations of a binary heap data structure with interactive visualizations
                    </p>
                </header>

                <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
                    <div className="p-6">
                        <HeapVisualization />
                    </div>
                </div>

                {/* Explanations Section with Toggle */}
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-indigo-800">Heap Operations Explained</h2>
                        <button
                            onClick={toggleExplanations}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out flex items-center"
                        >
                            {showExplanations ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    Hide Explanations
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                    </svg>
                                    Show Explanations
                                </>
                            )}
                        </button>
                    </div>

                    {showExplanations && (
                        <div className="bg-white rounded-xl shadow-md overflow-hidden">
                            <div className="border-b">
                                <div className="flex overflow-x-auto">
                                    {['insertion', 'deletion', 'heapify', 'building', 'update', 'heapsort', 'summary'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`py-3 px-6 font-medium border-b-2 whitespace-nowrap ${activeTab === tab
                                                    ? 'text-indigo-600 border-indigo-600'
                                                    : 'text-gray-500 border-transparent hover:text-indigo-600 hover:border-indigo-300'
                                                }`}
                                        >
                                            {tab === 'insertion' && 'Insertion'}
                                            {tab === 'deletion' && 'Extraction'}
                                            {tab === 'heapify' && 'Heapify'}
                                            {tab === 'building' && 'Build Heap'}
                                            {tab === 'update' && 'Update Key'}
                                            {tab === 'heapsort' && 'Heap Sort'}
                                            {tab === 'summary' && 'Summary'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="p-6">
                                {renderTabContent()}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default HeapDataStructure;