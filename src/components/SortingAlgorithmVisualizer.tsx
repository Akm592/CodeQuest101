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
  const [speed, setSpeed] = useState(100);
  const [customArray, setCustomArray] = useState("");
  const pauseRef = useRef(false);
  const sortingRef = useRef<(() => void) | null>(null);

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

  const sleep = (ms: number) =>
    new Promise((resolve) => {
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
      }, ms);
      return () => clearTimeout(timeout);
    });

  const updateArray = (newArray: number[]) => {
    setArray([...newArray]);
  };

  const swap = (arr: number[], i: number, j: number) => {
    [arr[i], arr[j]] = [arr[j], arr[i]];
  };

  const bubbleSort = async () => {
    const arr = [...array];
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (arr[j] > arr[j + 1]) {
          swap(arr, j, j + 1);
          updateArray(arr);
          await sleep(speed);
        }
      }
    }
    setIsRunning(false);
  };

  const quickSort = async () => {
    const arr = [...array];
    const partition = async (low: number, high: number) => {
      const pivot = arr[high];
      let i = low - 1;
      for (let j = low; j < high; j++) {
        if (arr[j] < pivot) {
          i++;
          swap(arr, i, j);
          updateArray(arr);
          await sleep(speed);
        }
      }
      swap(arr, i + 1, high);
      updateArray(arr);
      await sleep(speed);
      return i + 1;
    };

    const sort = async (low: number, high: number) => {
      if (low < high) {
        const pi = await partition(low, high);
        await sort(low, pi - 1);
        await sort(pi + 1, high);
      }
    };

    await sort(0, arr.length - 1);
    setIsRunning(false);
  };

  const selectionSort = async () => {
    const arr = [...array];
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      for (let j = i + 1; j < n; j++) {
        if (arr[j] < arr[minIdx]) {
          minIdx = j;
        }
      }
      if (minIdx !== i) {
        swap(arr, i, minIdx);
        updateArray(arr);
        await sleep(speed);
      }
    }
    setIsRunning(false);
  };

  const mergeSort = async () => {
    const arr = [...array];
    const merge = async (left: number, middle: number, right: number) => {
      const n1 = middle - left + 1;
      const n2 = right - middle;
      const L = arr.slice(left, middle + 1);
      const R = arr.slice(middle + 1, right + 1);
      let i = 0,
        j = 0,
        k = left;
      while (i < n1 && j < n2) {
        if (L[i] <= R[j]) {
          arr[k] = L[i];
          i++;
        } else {
          arr[k] = R[j];
          j++;
        }
        k++;
        updateArray(arr);
        await sleep(speed);
      }
      while (i < n1) {
        arr[k] = L[i];
        i++;
        k++;
        updateArray(arr);
        await sleep(speed);
      }
      while (j < n2) {
        arr[k] = R[j];
        j++;
        k++;
        updateArray(arr);
        await sleep(speed);
      }
    };

    const sort = async (left: number, right: number) => {
      if (left < right) {
        const middle = Math.floor((left + right) / 2);
        await sort(left, middle);
        await sort(middle + 1, right);
        await merge(left, middle, right);
      }
    };

    await sort(0, arr.length - 1);
    setIsRunning(false);
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
    const sortingFunction =
      sortingAlgorithms[sortingAlgorithm as keyof typeof sortingAlgorithms];
    if (sortingFunction) {
      sortingRef.current = sortingFunction;
      sortingFunction();
    }
  }, [sortingAlgorithm]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
    pauseRef.current = !pauseRef.current;
  }, []);

  const resetSorting = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    pauseRef.current = false;
    sortingRef.current = null;
    generateRandomArray();
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
              onValueChange={setSortingAlgorithm}
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
              onValueChange={(value) => setSpeed(1010 - value[0])}
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
                className="w-1 sm:w-2 bg-gray-600 dark:bg-gray-400 mr-px sm:mr-1"
                style={{ height: `${(value / Math.max(...array)) * 100}%` }}
              ></div>
            ))}
          </div>
          <SortingDetails algorithm={sortingAlgorithm} />
        </CardContent>
      </Card>
    </div>
  );
};

export default SortingAlgorithmVisualizer;
