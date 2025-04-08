import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"; // Adjust path if needed
import { Button } from "./ui/button"; // Adjust path if needed
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select"; // Adjust path if needed
import { Slider } from "./ui/slider"; // Adjust path if needed
import { Input } from "./ui/input"; // Adjust path if needed
import { PlayCircle, PauseCircle, RotateCcw, Loader2 } from "lucide-react"; // Added Loader2
import SortingDetails from "./SortingDetails"; // Adjust path if needed

// Constants (can be adjusted)
const DEFAULT_ARRAY_SIZE = 35; // Slightly increased for visual interest
const MAX_VALUE = 100;
const DEFAULT_SPEED_MS = 300; // Slower default speed (lower value = faster animation)
const MIN_SPEED_MS = 10;
const MAX_SPEED_MS = 1000;

const SortingAlgorithmVisualizer = () => {
  const [array, setArray] = useState<number[]>([]);
  const [sortingAlgorithm, setSortingAlgorithm] = useState("bubble");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false); // For generate button loading
  // Store speed slider value (10-1000), higher value = slower animation
  const [speedValue, setSpeedValue] = useState(MAX_SPEED_MS - DEFAULT_SPEED_MS);
  const [customArray, setCustomArray] = useState("");
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [highlightIndices, setHighlightIndices] = useState<{ index: number; color: string }[]>([]); // Store color with index
  const [sortedIndices, setSortedIndices] = useState<number[]>([]); // Track fully sorted elements

  const pauseRef = useRef(false);
  const sortingAbortControllerRef = useRef<AbortController | null>(null);

  const generateRandomArray = useCallback((size = DEFAULT_ARRAY_SIZE) => {
    setIsGenerating(true);
    setCurrentStep(null);
    setSortedIndices([]);
    setHighlightIndices([]);
    // Simulate generation time slightly
    setTimeout(() => {
        const newArray = Array.from(
          { length: size },
          () => Math.floor(Math.random() * MAX_VALUE) + 1
        );
        setArray(newArray);
        setIsGenerating(false);
    }, 50); // Short delay
  }, []);

  // Initial array generation
  useEffect(() => {
    generateRandomArray();
  }, [generateRandomArray]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      sortingAbortControllerRef.current?.abort();
    };
  }, []);

  const calculateDelay = (sliderValue: number) => {
      // Map slider value (10-1000) inversely to delay (MAX_SPEED_MS to MIN_SPEED_MS)
      return MAX_SPEED_MS + MIN_SPEED_MS - sliderValue;
  }

  // Enhanced sleep function that respects pause and abort
  const sleep = useCallback((ms: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const check = () => {
        if (sortingAbortControllerRef.current?.signal.aborted) {
          reject(new Error("Sorting aborted")); // Reject promise on abort
          return;
        }
        if (!pauseRef.current) {
          setTimeout(resolve, ms); // Use the calculated delay
        } else {
          // If paused, check again shortly without resolving
          setTimeout(check, 100);
        }
      };
      check();
    });
  }, []);


  // --- State Update Functions ---
  const updateVisualState = (
    newArray: number[],
    highlights: { index: number; color: string }[] = [],
    stepDescription: string | null = null,
    newlySorted: number[] = []
  ) => {
    setArray([...newArray]);
    setHighlightIndices(highlights);
    if (stepDescription) {
        setCurrentStep(stepDescription);
    }
    if (newlySorted.length > 0) {
        setSortedIndices(prev => [...prev, ...newlySorted]);
    }
  };

  const markAsSorted = (indices: number[]) => {
     setSortedIndices(prev => [...new Set([...prev, ...indices])]); // Use Set to avoid duplicates
  }

  const clearHighlightsAndStatus = () => {
     setHighlightIndices([]);
     setCurrentStep("Array is sorted!");
  }

  // --- Sorting Algorithms (Adapted for better visualization) ---

  const swap = (arr: number[], i: number, j: number) => {
    [arr[i], arr[j]] = [arr[j], arr[i]];
  };

  // Bubble Sort
  const bubbleSort = async (signal: AbortSignal) => {
    const arr = [...array];
    const n = arr.length;
    const delay = calculateDelay(speedValue);
    let newSorted: number[] = [];

    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      for (let j = 0; j < n - i - 1; j++) {
        if (signal.aborted) return;

        updateVisualState(arr, [{ index: j, color: 'compare' }, { index: j + 1, color: 'compare' }], `Comparing ${arr[j]} and ${arr[j + 1]}`);
        await sleep(delay);

        if (arr[j] > arr[j + 1]) {
          swap(arr, j, j + 1);
          swapped = true;
          updateVisualState(arr, [{ index: j, color: 'swap' }, { index: j + 1, color: 'swap' }], `Swapped ${arr[j+1]} and ${arr[j]}`);
          await sleep(delay);
        }
         // Clear highlights for the next comparison
        updateVisualState(arr, [], `Comparing ${arr[j]} and ${arr[j + 1]}`);
      }
       // Mark the last element of this pass as sorted
      newSorted.push(n - 1 - i);
      markAsSorted([n - 1 - i]);
      updateVisualState(arr, [], `Pass ${i + 1} complete. ${arr[n - 1 - i]} is sorted.`);
      await sleep(delay * 0.5); // Shorter pause after pass completion

      if (!swapped) break; // Optimization: If no swaps, array is sorted
    }
     // Mark remaining unsorted elements as sorted if loop finished early
    const remainingUnsorted = arr.map((_, idx) => idx).filter(idx => !sortedIndices.includes(idx) && !newSorted.includes(idx));
    markAsSorted(remainingUnsorted);
    clearHighlightsAndStatus();
  };

  // Quick Sort
  const quickSort = async (signal: AbortSignal) => {
      const arr = [...array];
      const n = arr.length;
      const delay = calculateDelay(speedValue);

      const partition = async (low: number, high: number): Promise<number> => {
          const pivot = arr[high];
          let i = low - 1;

          updateVisualState(arr, [{ index: high, color: 'pivot' }], `Partitioning [${low}-${high}]. Pivot: ${pivot}`);
          await sleep(delay);

          for (let j = low; j < high; j++) {
              if (signal.aborted) return -1; // Indicate abort

              // Highlight comparing elements and pivot
              const currentHighlights = [{ index: j, color: 'compare' }, { index: high, color: 'pivot' }];
              if (i >= low) currentHighlights.push({ index: i, color: 'pointer' }); // Show 'i' pointer if valid
              updateVisualState(arr, currentHighlights, `Comparing ${arr[j]} with pivot ${pivot}`);
              await sleep(delay);

              if (arr[j] < pivot) {
                  i++;
                  swap(arr, i, j);
                  const swapHighlights = [{ index: i, color: 'swap' }, { index: j, color: 'swap' }, { index: high, color: 'pivot' }];
                  updateVisualState(arr, swapHighlights, `Swapped ${arr[i]} and ${arr[j]}`);
                  await sleep(delay);
              }
          }

          swap(arr, i + 1, high);
          const finalPivotIndex = i + 1;
          updateVisualState(arr, [{ index: finalPivotIndex, color: 'sorted' }, { index: high, color: 'swap' } ], `Pivot ${pivot} placed at index ${finalPivotIndex}`);
          markAsSorted([finalPivotIndex]); // Mark pivot as sorted
          await sleep(delay);
          return finalPivotIndex;
      };

      const sort = async (low: number, high: number) => {
          if (low < high) {
              const pi = await partition(low, high);
              if (signal.aborted || pi === -1) return;

              await sort(low, pi - 1);
              if (signal.aborted) return;

              await sort(pi + 1, high);
          } else if (low === high && low >= 0 && low < n) {
             // Mark single-element partitions as sorted
             markAsSorted([low]);
             updateVisualState(arr, [], `Element ${arr[low]} is sorted.`);
             await sleep(delay * 0.5);
          }
      };

      await sort(0, n - 1);
      if (!signal.aborted) {
        // Ensure all elements are marked sorted at the end
        markAsSorted(arr.map((_, idx) => idx));
        clearHighlightsAndStatus();
      }
  };


  // Selection Sort
  const selectionSort = async (signal: AbortSignal) => {
      const arr = [...array];
      const n = arr.length;
      const delay = calculateDelay(speedValue);

      for (let i = 0; i < n - 1; i++) {
          let minIdx = i;
           updateVisualState(arr, [{ index: i, color: 'pointer' }], `Finding minimum for index ${i}`);
           await sleep(delay * 0.7);

          for (let j = i + 1; j < n; j++) {
              if (signal.aborted) return;

              // Highlight current element being considered (i), potential minimum (minIdx), and comparison element (j)
              updateVisualState(arr, [{ index: i, color: 'pointer' }, { index: minIdx, color: 'compare' }, { index: j, color: 'compare' }], `Comparing ${arr[j]} with current min ${arr[minIdx]}`);
              await sleep(delay);

              if (arr[j] < arr[minIdx]) {
                  const oldMinIdx = minIdx;
                  minIdx = j;
                  // Highlight the new minimum found
                   updateVisualState(arr, [{ index: i, color: 'pointer' }, { index: j, color: 'compare' }, { index: oldMinIdx, color: 'compare' }], `New minimum found: ${arr[minIdx]}`);
                   await sleep(delay * 0.7);
              }
          }

          if (minIdx !== i) {
              swap(arr, i, minIdx);
              updateVisualState(arr, [{ index: i, color: 'swap' }, { index: minIdx, color: 'swap' }], `Swapped ${arr[i]} with minimum ${arr[minIdx]}`);
              await sleep(delay);
          }

          markAsSorted([i]); // Mark the element at index i as sorted
           updateVisualState(arr, [], `Placed ${arr[i]} at sorted index ${i}`);
           await sleep(delay * 0.5);
      }

      markAsSorted([n - 1]); // Mark the last element as sorted
      if (!signal.aborted) {
          clearHighlightsAndStatus();
      }
  };


  // Merge Sort
  const mergeSort = async (signal: AbortSignal) => {
    const arr = [...array];
    const n = arr.length;
    const tempArr = [...arr]; // Use a temporary array for merging visualization
    const delay = calculateDelay(speedValue);

    const merge = async (left: number, mid: number, right: number) => {
        let i = left;       // Initial index of first subarray
        let j = mid + 1;    // Initial index of second subarray
        let k = left;       // Initial index of merged subarray (in tempArr)

         updateVisualState(arr, [], `Merging subarrays [${left}-${mid}] and [${mid + 1}-${right}]`);
         await sleep(delay);

        // Copy data to temp arrays L[] and R[] - conceptually visualize this step
        // The actual merge happens directly into tempArr for visualization

        while (i <= mid && j <= right) {
            if (signal.aborted) return;

            // Highlight elements being compared
             updateVisualState(arr, [{index: i, color: 'compare'}, {index: j, color: 'compare'}], `Comparing ${arr[i]} and ${arr[j]}`);
             await sleep(delay);

            if (arr[i] <= arr[j]) {
                 updateVisualState(arr, [{index: i, color: 'swap'}, {index: k, color: 'pointer'}], `Copying ${arr[i]} to merged array at index ${k}`);
                 tempArr[k] = arr[i];
                 i++;
            } else {
                 updateVisualState(arr, [{index: j, color: 'swap'}, {index: k, color: 'pointer'}], `Copying ${arr[j]} to merged array at index ${k}`);
                 tempArr[k] = arr[j];
                 j++;
            }
            k++;
            // Show the element being placed in the temp array conceptually by modifying the original array view
            const displayArr = [...arr]; displayArr[k-1] = tempArr[k-1]; // Show placement
            updateVisualState(displayArr, [], `Placed element in merged array (index ${k-1})`);
            await sleep(delay);
        }

        // Copy remaining elements of L[] if any
        while (i <= mid) {
            if (signal.aborted) return;
            updateVisualState(arr, [{index: i, color: 'swap'}, {index: k, color: 'pointer'}], `Copying remaining ${arr[i]} from left subarray`);
            tempArr[k] = arr[i];
            const displayArr = [...arr]; displayArr[k] = tempArr[k];
            updateVisualState(displayArr, [], `Placed element in merged array (index ${k})`);
            i++; k++;
            await sleep(delay);
        }

        // Copy remaining elements of R[] if any
        while (j <= right) {
            if (signal.aborted) return;
             updateVisualState(arr, [{index: j, color: 'swap'}, {index: k, color: 'pointer'}], `Copying remaining ${arr[j]} from right subarray`);
            tempArr[k] = arr[j];
            const displayArr = [...arr]; displayArr[k] = tempArr[k];
             updateVisualState(displayArr, [], `Placed element in merged array (index ${k})`);
            j++; k++;
            await sleep(delay);
        }

        // Copy the sorted subarray back to the original array for the next steps
        for (let l = left; l <= right; l++) {
             if (signal.aborted) return;
             arr[l] = tempArr[l];
        }
         updateVisualState(arr, [], `Merged subarray [${left}-${right}] is now sorted`);
         // Mark elements as sorted only after the full merge sort is complete for simplicity
         await sleep(delay);
    };

    const sort = async (left: number, right: number) => {
        if (left < right) {
            const mid = Math.floor(left + (right - left) / 2);
             updateVisualState(arr, [], `Dividing array [${left}-${right}] at index ${mid}`);
             await sleep(delay * 0.7);

            if (signal.aborted) return;
            await sort(left, mid);

            if (signal.aborted) return;
            await sort(mid + 1, right);

            if (signal.aborted) return;
            await merge(left, mid, right);
        } else if (left === right && left >= 0 && left < n) {
           // Optional: Highlight single elements during division
           updateVisualState(arr, [{index: left, color: 'compare'}], `Single element subarray [${left}]`);
           await sleep(delay * 0.5);
        }
    };

    await sort(0, n - 1);
    if (!signal.aborted) {
      markAsSorted(arr.map((_, idx) => idx)); // Mark all as sorted at the very end for Merge Sort
      clearHighlightsAndStatus();
    }
  };


  // --- Event Handlers ---

  const sortingAlgorithmsMap = {
    bubble: bubbleSort,
    quick: quickSort,
    selection: selectionSort,
    merge: mergeSort,
  };

  const startSorting = useCallback(() => {
    if (isRunning) return; // Prevent multiple starts

    setIsRunning(true);
    setIsPaused(false);
    pauseRef.current = false;
    setSortedIndices([]); // Clear sorted status on new run
    sortingAbortControllerRef.current?.abort(); // Abort previous run if any

    const controller = new AbortController();
    sortingAbortControllerRef.current = controller;

    const sortingFunction = sortingAlgorithmsMap[sortingAlgorithm as keyof typeof sortingAlgorithmsMap];

    if (sortingFunction) {
      sortingFunction(controller.signal)
        .catch((error) => {
          if (error.message !== "Sorting aborted") {
            console.error("Sorting error:", error);
            setCurrentStep(`Error during sorting: ${error.message}`);
          } else {
             setCurrentStep("Sorting stopped.");
          }
        })
        .finally(() => {
          // Check if aborted before declaring finished or resetting state
          if (!controller.signal.aborted) {
              setIsRunning(false);
          }
        });
    } else {
        console.error("Selected algorithm function not found");
        setIsRunning(false);
    }
  }, [sortingAlgorithm, array, speedValue, sleep]); // Include sleep in dependencies

  const togglePause = useCallback(() => {
    if (!isRunning) return;
    const nextPausedState = !isPaused;
    setIsPaused(nextPausedState);
    pauseRef.current = nextPausedState;
    setCurrentStep(nextPausedState ? "Paused" : "Resumed");
  }, [isRunning, isPaused]);

  const resetSorting = useCallback(() => {
    sortingAbortControllerRef.current?.abort(); // Send abort signal
    sortingAbortControllerRef.current = null; // Clear the ref
    setIsRunning(false);
    setIsPaused(false);
    pauseRef.current = false;
    generateRandomArray(); // Generate new array resets highlights/steps
  }, [generateRandomArray]);

  const handleCustomArrayInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers, commas, and spaces
    const value = e.target.value.replace(/[^0-9,\s]/g, '');
    setCustomArray(value);
  };

  const applyCustomArray = () => {
    if (isRunning) return;
    const newArray = customArray
      .split(/[\s,]+/) // Split by comma or space
      .map(Number)
      .filter(num => !isNaN(num) && num > 0 && num <= MAX_VALUE); // Validate numbers

    if (newArray.length > 0 && newArray.length <= 100) { // Add size limit
        setArray(newArray);
        setCurrentStep(null);
        setSortedIndices([]);
        setHighlightIndices([]);
        setCustomArray(""); // Clear input after applying
    } else if (newArray.length > 100) {
        alert("Maximum array size is 100 elements.");
    } else {
        alert("Invalid custom array input. Please use comma or space-separated positive numbers up to " + MAX_VALUE);
    }
  };

  const handleAlgorithmChange = (newAlgorithm: string) => {
    if (isRunning) {
      // Optionally reset or just prevent change while running
       resetSorting(); // Resetting might be better UX
    }
    setSortingAlgorithm(newAlgorithm);
    setCurrentStep(null); // Clear step description
    setSortedIndices([]);
  };

  const getBarColor = (index: number): string => {
      if (sortedIndices.includes(index)) {
          return 'bg-green-500'; // Sorted elements
      }
      const highlight = highlightIndices.find(h => h.index === index);
      if (highlight) {
          switch (highlight.color) {
              case 'compare': return 'bg-yellow-500'; // Comparing
              case 'swap': return 'bg-red-500';      // Swapping
              case 'pivot': return 'bg-purple-500'; // Pivot (Quick Sort)
              case 'pointer': return 'bg-blue-500';   // Pointer/Min Index (Selection Sort) / Merge Pointer
              case 'sorted': return 'bg-green-500';  // Element just placed correctly (Quick Sort)
              default: return 'bg-teal-400';        // Default highlight
          }
      }
      return 'bg-gradient-to-t from-gray-600 to-gray-500'; // Default bar color
  }

  return (
    // Main container with dark background
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-black p-4 text-gray-300">
      {/* Main Card with dark styling */}
      <Card className="w-full max-w-5xl mx-auto bg-gray-900 border border-gray-700/50 shadow-xl rounded-lg overflow-hidden">
        {/* Card Header */}
        <CardHeader className="bg-gray-800 border-b border-gray-700/50 text-gray-100 p-4 sm:p-5">
          <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-center">
            Sorting Algorithm Visualizer
          </CardTitle>
        </CardHeader>

        {/* Card Content */}
        <CardContent className="p-4 sm:p-6 space-y-5">
          {/* Controls Row 1: Algorithm Select & Generate Button */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Select
              value={sortingAlgorithm}
              onValueChange={handleAlgorithmChange}
              disabled={isRunning || isGenerating}
            >
              <SelectTrigger className="w-full sm:w-[200px] bg-gray-800 border-gray-600 text-gray-300 focus:border-teal-500 focus:ring-teal-500 disabled:opacity-70">
                <SelectValue placeholder="Select algorithm" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-gray-300">
                <SelectItem value="bubble" className="hover:bg-teal-900/50 focus:bg-teal-900/50">Bubble Sort</SelectItem>
                <SelectItem value="quick" className="hover:bg-teal-900/50 focus:bg-teal-900/50">Quick Sort</SelectItem>
                <SelectItem value="selection" className="hover:bg-teal-900/50 focus:bg-teal-900/50">Selection Sort</SelectItem>
                <SelectItem value="merge" className="hover:bg-teal-900/50 focus:bg-teal-900/50">Merge Sort</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => generateRandomArray()}
              disabled={isRunning || isGenerating}
               className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium disabled:opacity-60"
            >
               {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate New Array
            </Button>
          </div>

          {/* Controls Row 2: Speed Slider */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pt-2">
            <span className="text-sm font-medium text-gray-400 shrink-0">
              Animation Speed:
            </span>
            <Slider
              value={[speedValue]}
              onValueChange={(value) => setSpeedValue(value[0])}
              min={MIN_SPEED_MS} // Slider min
              max={MAX_SPEED_MS} // Slider max
              step={10}
              className="flex-grow [&>span:first-child]:h-2 [&>span>span]:bg-teal-500 [&>span:first-child]:bg-gray-700" // Custom track/thumb colors
              disabled={isRunning}
              aria-label="Animation Speed Control"
            />
             <span className="text-xs font-mono text-gray-500 w-16 text-right">
                {`${calculateDelay(speedValue)} ms`} {/* Display calculated delay */}
             </span>
          </div>

           {/* Controls Row 3: Custom Array Input */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Input
              placeholder="Custom array (e.g., 5, 3, 8, 1)"
              value={customArray}
              onChange={handleCustomArrayInput}
              disabled={isRunning || isGenerating}
              className="w-full sm:flex-grow h-10 bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500 disabled:opacity-70"
            />
            <Button
              onClick={applyCustomArray}
              disabled={isRunning || isGenerating || !customArray.trim()}
              className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium disabled:opacity-60"
            >
              Apply Array
            </Button>
          </div>

          {/* Controls Row 4: Start/Pause/Reset Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-3 border-t border-gray-700/50">
            {!isRunning ? (
              <Button
                onClick={startSorting}
                disabled={isGenerating}
                className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold w-full sm:w-auto px-6 py-2.5 disabled:opacity-60"
              >
                <PlayCircle size={18} />
                <span>Start Sorting</span>
              </Button>
            ) : (
              <>
                <Button
                  onClick={togglePause}
                  className={`flex items-center justify-center gap-2 ${
                    isPaused
                      ? "bg-blue-600 hover:bg-blue-700" // Resume button color
                      : "bg-yellow-600 hover:bg-yellow-700" // Pause button color
                  } text-white font-semibold w-full sm:w-auto px-6 py-2.5`}
                >
                  {isPaused ? (
                    <PlayCircle size={18} />
                  ) : (
                    <PauseCircle size={18} />
                  )}
                  <span>{isPaused ? "Resume" : "Pause"}</span>
                </Button>
                <Button
                  onClick={resetSorting}
                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold w-full sm:w-auto px-6 py-2.5"
                >
                  <RotateCcw size={18} />
                  <span>Reset</span>
                </Button>
              </>
            )}
          </div>

          {/* Visualization Area */}
          <div className="h-64 md:h-80 lg:h-[400px] flex items-end justify-center gap-px sm:gap-0.5 p-2 bg-black/20 rounded border border-gray-700/50 overflow-hidden">
            {array.map((value, index) => (
              <div
                key={index}
                className={`flex-grow transition-colors duration-150 ease-linear rounded-t-sm ${getBarColor(index)}`}
                 // Calculate height relative to the MAX_VALUE for consistency
                style={{ height: `${Math.max((value / MAX_VALUE) * 100, 1)}%` }} // Ensure min height of 1%
                title={`Value: ${value}`} // Tooltip on hover
              ></div>
            ))}
          </div>

          {/* Current Step Display */}
          {currentStep && (
            <div className="p-3 bg-gray-800 text-gray-300 mt-4 rounded-md border border-gray-700/50 min-h-[60px]">
              <h3 className="font-semibold text-gray-200 text-sm mb-1">Status:</h3>
              <p className="text-sm font-mono">{currentStep}</p>
            </div>
          )}

          {/* Algorithm Details */}
          <SortingDetails algorithm={sortingAlgorithm} />
        </CardContent>
      </Card>
    </div>
  );
};

export default SortingAlgorithmVisualizer;