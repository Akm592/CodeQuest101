import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "./ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import { Slider } from "./ui/slider";
import { Input } from "./ui/input";
import { 
  PlayCircle, 
  PauseCircle, 
  RotateCcw, 
  Shuffle, 
  Plus
} from "lucide-react";
import VisualizerLayout from "./Visualizer/VisualizerLayout";
import { Label } from "./ui/label";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_ARRAY_SIZE = 40;
const MAX_VALUE = 100;
const DEFAULT_SPEED_MS = 300;
const MIN_SPEED_MS = 10;
const MAX_SPEED_MS = 1000;

const ALGO_INFO = {
  bubble: {
    title: "Bubble Sort",
    description: "A simple comparison-based sorting algorithm. It repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.",
    complexity: { time: "O(n²)", space: "O(1)" },
    pseudocode: `for i from 0 to n-1:
    for j from 0 to n-i-1:
        if arr[j] > arr[j+1]:
            swap(arr[j], arr[j+1])`
  },
  quick: {
    title: "Quick Sort",
    description: "A highly efficient, divide-and-conquer sorting algorithm. It works by selecting a 'pivot' element and partitioning the other elements into two sub-arrays according to whether they are less than or greater than the pivot.",
    complexity: { time: "O(n log n)", space: "O(log n)" },
    pseudocode: `quickSort(arr, low, high):
    if low < high:
        pi = partition(arr, low, high)
        quickSort(arr, low, pi - 1)
        quickSort(arr, pi + 1, high)`
  },
  selection: {
    title: "Selection Sort",
    description: "An in-place comparison sorting algorithm. It divides the input list into two parts: a sorted sublist and an unsorted sublist. It repeatedly finds the minimum element from the unsorted sublist and moves it to the beginning.",
    complexity: { time: "O(n²)", space: "O(1)" },
    pseudocode: `for i from 0 to n-1:
    min_idx = i
    for j from i+1 to n:
        if arr[j] < arr[min_idx]:
            min_idx = j
    swap(arr[min_idx], arr[i])`
  },
  merge: {
    title: "Merge Sort",
    description: "An efficient, stable, comparison-based, divide-and-conquer sorting algorithm. Most implementations produce a stable sort, meaning that the implementation preserves the input order of equal elements in the sorted output.",
    complexity: { time: "O(n log n)", space: "O(n)" },
    pseudocode: `mergeSort(arr, left, right):
    if left < right:
        mid = (left + right) / 2
        mergeSort(arr, left, mid)
        mergeSort(arr, mid + 1, right)
        merge(arr, left, mid, right)`
  }
};

interface SortingAlgorithmVisualizerProps {
  onBack: () => void;
}

const SortingAlgorithmVisualizer: React.FC<SortingAlgorithmVisualizerProps> = ({ onBack }) => {
  const [array, setArray] = useState<number[]>([]);
  const [sortingAlgorithm, setSortingAlgorithm] = useState("bubble");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [_isGenerating, _setIsGenerating] = useState(false);
  const [speedValue, setSpeedValue] = useState(MAX_SPEED_MS - DEFAULT_SPEED_MS);
  const [customArray, setCustomArray] = useState("");
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [highlightIndices, setHighlightIndices] = useState<{ index: number; color: string }[]>([]);
  const [sortedIndices, setSortedIndices] = useState<number[]>([]);

  const pauseRef = useRef(false);
  const sortingAbortControllerRef = useRef<AbortController | null>(null);

  const generateRandomArray = useCallback((size = DEFAULT_ARRAY_SIZE) => {
    _setIsGenerating(true);
    setCurrentStep(null);
    setSortedIndices([]);
    setHighlightIndices([]);
    setTimeout(() => {
        const newArray = Array.from(
          { length: size },
          () => Math.floor(Math.random() * MAX_VALUE) + 1
        );
        setArray(newArray);
        _setIsGenerating(false);
    }, 100);
  }, []);

  useEffect(() => {
    generateRandomArray();
  }, [generateRandomArray]);

  useEffect(() => {
    return () => {
      sortingAbortControllerRef.current?.abort();
    };
  }, []);

  const calculateDelay = (sliderValue: number) => {
      return MAX_SPEED_MS + MIN_SPEED_MS - sliderValue;
  }

  const sleep = useCallback((ms: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const check = () => {
        if (sortingAbortControllerRef.current?.signal.aborted) {
          reject(new Error("Sorting aborted"));
          return;
        }
        if (!pauseRef.current) {
          setTimeout(resolve, ms);
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }, []);

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
     setSortedIndices(prev => [...new Set([...prev, ...indices])]);
  }

  const clearHighlightsAndStatus = () => {
     setHighlightIndices([]);
     setCurrentStep("Sorted!");
  }

  const swap = (arr: number[], i: number, j: number) => {
    [arr[i], arr[j]] = [arr[j], arr[i]];
  };

  const bubbleSort = async (signal: AbortSignal) => {
    const arr = [...array];
    const n = arr.length;
    const delay = calculateDelay(speedValue);

    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      for (let j = 0; j < n - i - 1; j++) {
        if (signal.aborted) return;
        updateVisualState(arr, [{ index: j, color: 'compare' }, { index: j + 1, color: 'compare' }], `Comparing ${arr[j]} and ${arr[j+1]}`);
        await sleep(delay);
        if (arr[j] > arr[j + 1]) {
          swap(arr, j, j + 1);
          swapped = true;
          updateVisualState(arr, [{ index: j, color: 'swap' }, { index: j + 1, color: 'swap' }], `Swapped ${arr[j+1]} and ${arr[j]}`);
          await sleep(delay);
        }
      }
      markAsSorted([n - 1 - i]);
      if (!swapped) break;
    }
    markAsSorted(arr.map((_, idx) => idx));
    clearHighlightsAndStatus();
  };

  const quickSort = async (signal: AbortSignal) => {
      const arr = [...array];
      const n = arr.length;
      const delay = calculateDelay(speedValue);
      const partition = async (low: number, high: number): Promise<number> => {
          const pivot = arr[high];
          let i = low - 1;
          updateVisualState(arr, [{ index: high, color: 'pivot' }], `Pivot: ${pivot}`);
          await sleep(delay);
          for (let j = low; j < high; j++) {
              if (signal.aborted) return -1;
              updateVisualState(arr, [{ index: j, color: 'compare' }, { index: high, color: 'pivot' }], `Checking ${arr[j]}`);
              await sleep(delay);
              if (arr[j] < pivot) {
                  i++;
                  swap(arr, i, j);
                  updateVisualState(arr, [{ index: i, color: 'swap' }, { index: j, color: 'swap' }], `Swap elements`);
                  await sleep(delay);
              }
          }
          swap(arr, i + 1, high);
          markAsSorted([i + 1]);
          return i + 1;
      };
      const sort = async (low: number, high: number) => {
          if (low < high) {
              const pi = await partition(low, high);
              if (signal.aborted || pi === -1) return;
              await sort(low, pi - 1);
              await sort(pi + 1, high);
          } else if (low === high) {
             markAsSorted([low]);
          }
      };
      await sort(0, n - 1);
      markAsSorted(arr.map((_, idx) => idx));
      clearHighlightsAndStatus();
  };

  const selectionSort = async (signal: AbortSignal) => {
      const arr = [...array];
      const n = arr.length;
      const delay = calculateDelay(speedValue);
      for (let i = 0; i < n - 1; i++) {
          let minIdx = i;
          for (let j = i + 1; j < n; j++) {
              if (signal.aborted) return;
              updateVisualState(arr, [{ index: minIdx, color: 'pointer' }, { index: j, color: 'compare' }]);
              await sleep(delay);
              if (arr[j] < arr[minIdx]) minIdx = j;
          }
          if (minIdx !== i) swap(arr, i, minIdx);
          markAsSorted([i]);
      }
      markAsSorted([n - 1]);
      clearHighlightsAndStatus();
  };

  const mergeSort = async (signal: AbortSignal) => {
    const arr = [...array];
    const n = arr.length;
    const delay = calculateDelay(speedValue);
    const merge = async (left: number, mid: number, right: number) => {
        let i = left, j = mid + 1, k = 0;
        const temp = new Array(right - left + 1);
        while (i <= mid && j <= right) {
            if (signal.aborted) return;
            updateVisualState(arr, [{index: i, color: 'compare'}, {index: j, color: 'compare'}]);
            await sleep(delay);
            if (arr[i] <= arr[j]) temp[k++] = arr[i++];
            else temp[k++] = arr[j++];
        }
        while (i <= mid) temp[k++] = arr[i++];
        while (j <= right) temp[k++] = arr[j++];
        for (let l = 0; l < temp.length; l++) {
            if (signal.aborted) return;
            arr[left + l] = temp[l];
            updateVisualState(arr, [{index: left + l, color: 'swap'}]);
            await sleep(delay / 2);
        }
    };
    const sort = async (l: number, r: number) => {
        if (l < r) {
            const m = Math.floor((l + r) / 2);
            await sort(l, m);
            await sort(m + 1, r);
            await merge(l, m, r);
        }
    };
    await sort(0, n - 1);
    markAsSorted(arr.map((_, idx) => idx));
    clearHighlightsAndStatus();
  };

  const sortingAlgorithmsMap = {
    bubble: bubbleSort,
    quick: quickSort,
    selection: selectionSort,
    merge: mergeSort,
  };

  const startSorting = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setIsPaused(false);
    pauseRef.current = false;
    setSortedIndices([]);
    const controller = new AbortController();
    sortingAbortControllerRef.current = controller;
    const sortingFunction = sortingAlgorithmsMap[sortingAlgorithm as keyof typeof sortingAlgorithmsMap];
    if (sortingFunction) {
      sortingFunction(controller.signal)
        .finally(() => {
          if (!controller.signal.aborted) setIsRunning(false);
        });
    }
  }, [sortingAlgorithm, array, speedValue]);

  const togglePause = useCallback(() => {
    if (!isRunning) return;
    const nextPausedState = !isPaused;
    setIsPaused(nextPausedState);
    pauseRef.current = nextPausedState;
    setCurrentStep(nextPausedState ? "Paused" : "Resumed");
  }, [isRunning, isPaused]);

  const resetSorting = useCallback(() => {
    sortingAbortControllerRef.current?.abort();
    setIsRunning(false);
    setIsPaused(false);
    pauseRef.current = false;
    generateRandomArray();
  }, [generateRandomArray]);

  const handleAlgorithmChange = (val: string) => {
    if (isRunning) resetSorting();
    setSortingAlgorithm(val);
    setSortedIndices([]);
  };

  const getBarColor = (index: number): string => {
      if (sortedIndices.includes(index)) return 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]';
      const highlight = highlightIndices.find(h => h.index === index);
      if (highlight) {
          switch (highlight.color) {
              case 'compare': return 'bg-primary shadow-[0_0_15px_rgba(6,182,212,0.4)]';
              case 'swap': return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]';
              case 'pivot': return 'bg-secondary shadow-[0_0_15px_rgba(139,92,246,0.4)]';
              case 'pointer': return 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]';
              default: return 'bg-primary';
          }
      }
      return 'bg-white/10 border-white/5';
  }

  const controls = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
      {/* Selection & Speed */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-[10px] sm:text-xs uppercase tracking-widest text-gray-500 font-bold">Algorithm</Label>
          <Select value={sortingAlgorithm} onValueChange={handleAlgorithmChange} disabled={isRunning}>
            <SelectTrigger className="bg-white/5 border-white/10 h-10 sm:h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-950 border-white/10">
              <SelectItem value="bubble">Bubble Sort</SelectItem>
              <SelectItem value="quick">Quick Sort</SelectItem>
              <SelectItem value="selection">Selection Sort</SelectItem>
              <SelectItem value="merge">Merge Sort</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-[10px] sm:text-xs uppercase tracking-widest text-gray-500 font-bold text-glow">Animation Speed</Label>
            <span className="text-[10px] font-mono text-primary">{calculateDelay(speedValue)}ms</span>
          </div>
          <Slider
            value={[speedValue]}
            onValueChange={(value) => setSpeedValue(value[0])}
            min={MIN_SPEED_MS}
            max={MAX_SPEED_MS}
            step={10}
            disabled={isRunning}
          />
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex flex-col gap-3">
        <Label className="text-[10px] sm:text-xs uppercase tracking-widest text-gray-500 font-bold">Playback</Label>
        <div className="grid grid-cols-2 gap-2">
          {!isRunning ? (
            <Button onClick={startSorting} className="h-10 sm:h-11 bg-primary hover:bg-primary/80 text-black font-bold col-span-2 text-xs sm:text-sm">
              <PlayCircle className="mr-2 h-4 w-4" /> Start Sorting
            </Button>
          ) : (
            <>
              <Button onClick={togglePause} className={`h-10 sm:h-11 ${isPaused ? 'bg-green-600' : 'bg-amber-600'} text-white font-bold text-xs sm:text-sm`}>
                {isPaused ? <PlayCircle className="mr-2 h-4 w-4" /> : <PauseCircle className="mr-2 h-4 w-4" />}
                {isPaused ? "Resume" : "Pause"}
              </Button>
              <Button onClick={resetSorting} variant="destructive" className="h-10 sm:h-11 font-bold text-xs sm:text-sm">
                <RotateCcw className="mr-2 h-4 w-4" /> Stop
              </Button>
            </>
          )}
          <Button onClick={() => generateRandomArray()} variant="outline" disabled={isRunning} className="h-10 sm:h-11 col-span-2 border-white/10 hover:bg-white/5 text-xs sm:text-sm">
             <Shuffle className="mr-2 h-4 w-4" /> New Array
          </Button>
        </div>
      </div>

      {/* Custom Input */}
      <div className="space-y-2 sm:col-span-2 lg:col-span-1">
        <Label className="text-[10px] sm:text-xs uppercase tracking-widest text-gray-500 font-bold">Custom Data</Label>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. 5, 2, 8, 1..."
            value={customArray}
            onChange={(e) => setCustomArray(e.target.value)}
            disabled={isRunning}
            className="h-10 sm:h-11 bg-white/5 border-white/10 text-sm"
          />
          <Button 
            onClick={() => {
              const arr = customArray.split(/[\s,]+/).map(Number).filter(n => !isNaN(n) && n > 0);
              if (arr.length) setArray(arr);
              setCustomArray("");
            }}
            variant="secondary"
            disabled={isRunning || !customArray.trim()}
            className="h-10 sm:h-11"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
           <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-gray-400">
              <div className="w-2 h-2 rounded-full bg-primary" /> Comparing
           </div>
           <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-gray-400">
              <div className="w-2 h-2 rounded-full bg-red-500" /> Swapping
           </div>
           <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-gray-400">
              <div className="w-2 h-2 rounded-full bg-green-500" /> Sorted
           </div>
        </div>
      </div>
    </div>
  );

  const currentAlgo = ALGO_INFO[sortingAlgorithm as keyof typeof ALGO_INFO];

  return (
    <VisualizerLayout
      title={currentAlgo.title}
      description={currentAlgo.description}
      controls={controls}
      onBack={onBack}
      pseudocode={currentAlgo.pseudocode}
      complexity={currentAlgo.complexity}
    >
       <div className="w-full h-full max-h-[350px] sm:max-h-[500px] flex items-end justify-center gap-0.5 p-4 sm:p-8 bg-black/20 rounded-2xl sm:rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="flex items-end justify-center w-full h-full gap-[1px] sm:gap-0.5">
            {array.map((value, index) => (
              <motion.div
                key={index}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex-grow rounded-t-sm border-t border-x border-white/5 transition-all duration-200 ${getBarColor(index)}`}
                style={{ height: `${Math.max((value / MAX_VALUE) * 100, 2)}%` }}
              />
            ))}
          </div>

          <AnimatePresence>
            {currentStep && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 20 }}
                 className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 glass-panel rounded-full text-[10px] font-bold tracking-widest uppercase text-primary border-primary/20"
               >
                 {currentStep}
               </motion.div>
            )}
          </AnimatePresence>
       </div>
    </VisualizerLayout>
  );
};

export default SortingAlgorithmVisualizer;
