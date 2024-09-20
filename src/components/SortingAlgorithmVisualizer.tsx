import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
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
import { PlayCircle, PauseCircle, RotateCcw } from "lucide-react";
import SortingDetails from "./SortingDetails";

const ARRAY_SIZE = 30;
const MAX_VALUE = 100;

const SortingAlgorithmVisualizer = () => {
  const [array, setArray] = useState<number[]>([]);
  const [sortingAlgorithm, setSortingAlgorithm] = useState("bubble");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
    const [speed, setSpeed] = useState(500);
  const [customArray, setCustomArray] = useState("");
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [highlightIndices, setHighlightIndices] = useState<number[]>([]);
  const pauseRef = useRef(false);
  const sortingRef = useRef<AbortController | null>(null);

  const generateRandomArray = useCallback(() => {
    const newArray = Array.from(
      { length: ARRAY_SIZE },
      () => Math.floor(Math.random() * MAX_VALUE) + 1
    );
    setArray(newArray);
  }, []);

  useEffect(() => {
    generateRandomArray();
  }, [generateRandomArray]);

  useEffect(() => {
    return () => {
      if (sortingRef.current) {
        sortingRef.current.abort();
      }
    };
  }, []);

  const sleep = (ms: number) =>
    new Promise((resolve) => {
      const delay = 1010 - ms; // Invert the delay
      const timeout = setTimeout(() => {
        if (pauseRef.current) {
          const checkPause = () => {
            if (!pauseRef.current) {
              resolve(void 0);
            } else {
              setTimeout(checkPause, 100);
            }
          };
          checkPause();
        } else {
          resolve(void 0);
        }
      }, delay);
      return () => clearTimeout(timeout);
    });


  const updateArray = (newArray: number[], highlights: number[] = []) => {
    setArray([...newArray]);
    setHighlightIndices(highlights);
  };

  const swap = (arr: number[], i: number, j: number) => {
    [arr[i], arr[j]] = [arr[j], arr[i]];
  };

  const bubbleSort = async (signal: AbortSignal) => {
    const arr = [...array];
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (signal.aborted) return;
        setCurrentStep(`Comparing ${arr[j]} and ${arr[j + 1]}`);
        updateArray(arr, [j, j + 1]);
        await sleep(speed);
        if (arr[j] > arr[j + 1]) {
          swap(arr, j, j + 1);
          setCurrentStep(`Swapped ${arr[j + 1]} and ${arr[j]}`);
          updateArray(arr, [j, j + 1]);
          await sleep(speed);
        }
      }
    }
    setIsRunning(false);
    setCurrentStep("Array is sorted!");
    setHighlightIndices([]);
  };

const quickSort = async (signal: AbortSignal) => {
  const arr = [...array];
  const partition = async (low: number, high: number): Promise<number> => {
    const pivot = arr[high];
    let i = low - 1;
    setCurrentStep(`Partitioning with pivot ${pivot}`);
    updateArray(arr, [high]);
    await sleep(speed);
    for (let j = low; j < high; j++) {
      if (signal.aborted) return low; // Return a default value if aborted
      setCurrentStep(`Comparing ${arr[j]} with pivot ${pivot}`);
      updateArray(arr, [j, high]);
      await sleep(speed);
      if (arr[j] < pivot) {
        i++;
        swap(arr, i, j);
        setCurrentStep(`Swapped ${arr[i]} and ${arr[j]}`);
        updateArray(arr, [i, j, high]);
        await sleep(speed);
      }
    }
    swap(arr, i + 1, high);
    setCurrentStep(`Placed pivot ${pivot} in its correct position`);
    updateArray(arr, [i + 1, high]);
    await sleep(speed);
    return i + 1;
  };

  const sort = async (low: number, high: number) => {
    if (low < high) {
      const pi = await partition(low, high);
      if (signal.aborted) return;
      await sort(low, pi - 1);
      if (signal.aborted) return;
      await sort(pi + 1, high);
    }
  };

  await sort(0, arr.length - 1);
  if (!signal.aborted) {
    setIsRunning(false);
    setCurrentStep("Array is sorted!");
    setHighlightIndices([]);
  }
};

  const selectionSort = async (signal: AbortSignal) => {
    const arr = [...array];
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
      if (signal.aborted) return;
      let minIdx = i;
      setCurrentStep(
        `Finding the smallest element in the subarray [${arr.slice(i)}]`
      );
      updateArray(arr, [i]);
      await sleep(speed);
      for (let j = i + 1; j < n; j++) {
        if (signal.aborted) return;
        setCurrentStep(
          `Comparing ${arr[j]} with current minimum ${arr[minIdx]}`
        );
        updateArray(arr, [i, j, minIdx]);
        await sleep(speed);
        if (arr[j] < arr[minIdx]) {
          minIdx = j;
        }
      }
      if (minIdx !== i) {
        setCurrentStep(`Swapping ${arr[i]} with ${arr[minIdx]}`);
        swap(arr, i, minIdx);
        updateArray(arr, [i, minIdx]);
        await sleep(speed);
      }
    }
    setIsRunning(false);
    setCurrentStep("Array is sorted!");
    setHighlightIndices([]);
  };

  const mergeSort = async (signal: AbortSignal) => {
    const arr = [...array];
    const merge = async (left: number, middle: number, right: number) => {
      const n1 = middle - left + 1;
      const n2 = right - middle;
      const L = arr.slice(left, middle + 1);
      const R = arr.slice(middle + 1, right + 1);
      let i = 0,
        j = 0,
        k = left;
      setCurrentStep(`Merging subarrays ${L} and ${R}`);
      while (i < n1 && j < n2) {
        if (signal.aborted) return;
        updateArray(arr, [left + i, middle + 1 + j]);
        await sleep(speed);
        if (L[i] <= R[j]) {
          arr[k] = L[i];
          i++;
        } else {
          arr[k] = R[j];
          j++;
        }
        k++;
        updateArray(arr, [k - 1]);
        await sleep(speed);
      }
      while (i < n1) {
        if (signal.aborted) return;
        arr[k] = L[i];
        i++;
        k++;
        updateArray(arr, [k - 1]);
        await sleep(speed);
      }
      while (j < n2) {
        if (signal.aborted) return;
        arr[k] = R[j];
        j++;
        k++;
        updateArray(arr, [k - 1]);
        await sleep(speed);
      }
    };

    const sort = async (left: number, right: number) => {
      if (left < right) {
        const middle = Math.floor((left + right) / 2);
        setCurrentStep(`Dividing array at index ${middle}`);
        updateArray(arr, [left, middle, right]);
        await sleep(speed);
        if (signal.aborted) return;
        await sort(left, middle);
        if (signal.aborted) return;
        await sort(middle + 1, right);
        if (signal.aborted) return;
        await merge(left, middle, right);
      }
    };

    await sort(0, arr.length - 1);
    if (!signal.aborted) {
      setIsRunning(false);
      setCurrentStep("Array is sorted!");
      setHighlightIndices([]);
    }
  };

  const sortingAlgorithms = {
    bubble: bubbleSort,
    quick: quickSort,
    selection: selectionSort,
    merge: mergeSort,
  };

  const startSorting = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    pauseRef.current = false;
    if (sortingRef.current) {
      sortingRef.current.abort();
    }
    const controller = new AbortController();
    sortingRef.current = controller;
    const sortingFunction =
      sortingAlgorithms[sortingAlgorithm as keyof typeof sortingAlgorithms];
    if (sortingFunction) {
      sortingFunction(controller.signal).catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Sorting error:", error);
        }
      });
    }
  }, [sortingAlgorithm, array, speed]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
    pauseRef.current = !pauseRef.current;
  }, []);

  const resetSorting = useCallback(() => {
    if (sortingRef.current) {
      sortingRef.current.abort();
    }
    setIsRunning(false);
    setIsPaused(false);
    pauseRef.current = false;
    sortingRef.current = null;
    generateRandomArray();
    setCurrentStep(null);
    setHighlightIndices([]);
  }, [generateRandomArray]);

  const handleCustomArrayInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomArray(e.target.value);
  };

  const applyCustomArray = () => {
    const newArray = customArray.split(",").map(Number).filter(Boolean);
    if (newArray.length > 0) {
      setArray(newArray);
    }
  };

  const handleAlgorithmChange = (newAlgorithm: string) => {
    if (isRunning) {
      resetSorting();
    }
    setSortingAlgorithm(newAlgorithm);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-center">
            Sorting Algorithm Visualizer
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Select
              value={sortingAlgorithm}
              onValueChange={handleAlgorithmChange}
              disabled={isRunning}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select algorithm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bubble">Bubble Sort</SelectItem>
                <SelectItem value="quick">Quick Sort</SelectItem>
                <SelectItem value="selection">Selection Sort</SelectItem>
                <SelectItem value="merge">Merge Sort</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={generateRandomArray}
              disabled={isRunning}
              className="w-full sm:w-auto"
            >
              Generate New Array
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Speed:
            </span>
            <Slider
              value={[speed]}
              onValueChange={(value) => setSpeed(value[0])}
              min={10}
              max={1000}
              step={10}
              className="flex-grow"
              disabled={isRunning}
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Input
              placeholder="Enter custom array (comma-separated)"
              value={customArray}
              onChange={handleCustomArrayInput}
              disabled={isRunning}
              className="w-full sm:flex-grow"
            />
            <Button
              onClick={applyCustomArray}
              disabled={isRunning}
              className="w-full sm:w-auto"
            >
              Apply Custom Array
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            {!isRunning ? (
              <Button
                onClick={startSorting}
                className="flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-900 text-white w-full sm:w-auto"
              >
                <PlayCircle size={20} />
                <span>Start Sorting</span>
              </Button>
            ) : (
              <>
                <Button
                  onClick={togglePause}
                  className={`flex items-center justify-center space-x-2 ${
                    isPaused
                      ? "bg-gray-600 hover:bg-gray-700"
                      : "bg-gray-400 hover:bg-gray-500"
                  } text-white w-full sm:w-auto`}
                >
                  {isPaused ? (
                    <PlayCircle size={20} />
                  ) : (
                    <PauseCircle size={20} />
                  )}
                  <span>{isPaused ? "Resume" : "Pause"}</span>
                </Button>
                <Button
                  onClick={resetSorting}
                  className="flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-800 text-white w-full sm:w-auto"
                >
                  <RotateCcw size={20} />
                  <span>Reset</span>
                </Button>
              </>
            )}
          </div>

          <div className="h-48 sm:h-64 md:h-80 lg:h-96 flex items-end justify-center">
            {array.map((value, index) => (
              <div
                key={index}
                className={`w-1 sm:w-2 mr-px sm:mr-1 transition-all duration-200 ${
                  highlightIndices.includes(index)
                    ? "bg-blue-500"
                    : "bg-gray-600 dark:bg-gray-400"
                }`}
                style={{ height: `${(value / Math.max(...array)) * 100}%` }}
              ></div>
            ))}
          </div>

          {currentStep && (
            <div className="p-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white mt-4 rounded-md">
              <h3 className="font-bold text-lg mb-2">Current Step</h3>
              <p>{currentStep}</p>
            </div>
          )}

          <SortingDetails algorithm={sortingAlgorithm} />
        </CardContent>
      </Card>
    </div>
  );
};

export default SortingAlgorithmVisualizer;