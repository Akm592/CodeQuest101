import  { useState, useEffect, useCallback, useRef } from "react";
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
      { length: 30 },
      () => Math.floor(Math.random() * 100) + 1
    );
    setArray(newArray);
  }, []);

  useEffect(() => {
    generateRandomArray();
  }, [generateRandomArray]);

  const sleep = (ms: number) =>
    new Promise((resolve) => {
      setTimeout(() => {
        if (pauseRef.current) {
          return new Promise((innerResolve) => {
            const checkPause = () => {
              if (!pauseRef.current) {
                innerResolve(void 0);
              } else {
                setTimeout(checkPause, 100);
              }
            };
            checkPause();
          }).then(() => resolve(void 0));
        } else {
          resolve(void 0);
        }
      }, ms);
    });

  const bubbleSort = async () => {
    const arr = [...array];
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          setArray([...arr]);
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
          [arr[i], arr[j]] = [arr[j], arr[i]];
          setArray([...arr]);
          await sleep(speed);
        }
      }
      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
      setArray([...arr]);
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
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        setArray([...arr]);
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
        setArray([...arr]);
        await sleep(speed);
      }
      while (i < n1) {
        arr[k] = L[i];
        i++;
        k++;
        setArray([...arr]);
        await sleep(speed);
      }
      while (j < n2) {
        arr[k] = R[j];
        j++;
        k++;
        setArray([...arr]);
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

  const startSorting = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    pauseRef.current = false;
    let sortingFunction;
    switch (sortingAlgorithm) {
      case "bubble":
        sortingFunction = bubbleSort;
        break;
      case "quick":
        sortingFunction = quickSort;
        break;
      case "selection":
        sortingFunction = selectionSort;
        break;
      case "merge":
        sortingFunction = mergeSort;
        break;
      default:
        return;
    }
    sortingRef.current = sortingFunction;
    sortingFunction();
  }, [sortingAlgorithm, array, speed, bubbleSort, mergeSort, quickSort, selectionSort]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
    pauseRef.current = !pauseRef.current;
  }, []);

  const resetSorting = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    pauseRef.current = false;
    if (sortingRef.current) {
      sortingRef.current = null;
    }
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
    <Card className="w-full max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6">
        <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
          Sorting Algorithm Visualizer
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Select
            value={sortingAlgorithm}
            onValueChange={setSortingAlgorithm}
            disabled={isRunning}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select algorithm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bubble">Bubble Sort</SelectItem>
              <SelectItem value="quick">Quick Sort</SelectItem>
              <SelectItem value="selection">Selection Sort</SelectItem>
              <SelectItem value="merge">Merge Sort</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={generateRandomArray} disabled={isRunning}>
            Generate New Array
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">Speed:</span>
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
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Enter custom array (comma-separated)"
            value={customArray}
            onChange={handleCustomArrayInput}
            disabled={isRunning}
          />
          <Button onClick={applyCustomArray} disabled={isRunning}>
            Apply Custom Array
          </Button>
        </div>
        <div className="flex justify-center space-x-4">
          {!isRunning ? (
            <Button
              onClick={startSorting}
              className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white"
            >
              <PlayCircle size={20} />
              <span>Start Sorting</span>
            </Button>
          ) : (
            <>
              <Button
                onClick={togglePause}
                className={`flex items-center space-x-2 ${
                  isPaused
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-yellow-500 hover:bg-yellow-600"
                } text-white`}
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
                className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white"
              >
                <RotateCcw size={20} />
                <span>Reset</span>
              </Button>
            </>
          )}
        </div>
        <div className="h-64 flex items-end justify-center">
          {array.map((value, index) => (
            <div
              key={index}
              className="w-2 bg-blue-500 mr-1"
              style={{ height: `${(value / Math.max(...array)) * 100}%` }}
            ></div>
          ))}
        </div>
        <SortingDetails algorithm={sortingAlgorithm} />
      </CardContent>
    </Card>
  );
};

export default SortingAlgorithmVisualizer;
