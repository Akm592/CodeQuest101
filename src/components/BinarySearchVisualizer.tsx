import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import { PlayCircle, RotateCcw, Shuffle } from "lucide-react";

const BinarySearchVisualizer: React.FC = () => {
  const [array, setArray] = useState<number[]>([]);
  const [target, setTarget] = useState<number>(0);
  const [left, setLeft] = useState<number>(0);
  const [right, setRight] = useState<number>(0);
  const [mid, setMid] = useState<number>(0);
  const [found, setFound] = useState<boolean | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(500);
  const [customArrayInput, setCustomArrayInput] = useState<string>("");

  const generateSortedArray = useCallback(() => {
    const newArray = Array.from({ length: 20 }, () =>
      Math.floor(Math.random() * 100)
    ).sort((a, b) => a - b);
    setArray(newArray);
    setRight(newArray.length - 1);
    resetSearch();
  }, []);

  useEffect(() => {
    generateSortedArray();
  }, [generateSortedArray]);

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const binarySearch = useCallback(async () => {
    setIsRunning(true);
    setFound(null);
    let l = 0;
    let r = array.length - 1;

    while (l <= r) {
      setLeft(l);
      setRight(r);
      const m = Math.floor((l + r) / 2);
      setMid(m);

      await sleep(speed);

      if (array[m] === target) {
        setFound(true);
        setIsRunning(false);
        return;
      }

      if (array[m] < target) {
        l = m + 1;
      } else {
        r = m - 1;
      }
    }

    setFound(false);
    setIsRunning(false);
  }, [array, target, speed]);

  const resetSearch = () => {
    setLeft(0);
    setRight(array.length - 1);
    setMid(0);
    setFound(null);
    setIsRunning(false);
  };

  const handleCustomArrayInput = () => {
    const newArray = customArrayInput
      .split(",")
      .map(Number)
      .filter((n) => !isNaN(n));
    if (newArray.length > 0) {
      const sortedArray = [...newArray].sort((a, b) => a - b);
      setArray(sortedArray);
      setRight(sortedArray.length - 1);
      resetSearch();
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gray-100 p-4">
    <Card className="w-full mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <CardHeader className="bg-black text-white p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-center">
          Binary Search Visualizer
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Input
            type="number"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            placeholder="Enter target number"
            className="w-full sm:w-48"
          />
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              onClick={binarySearch}
              disabled={isRunning}
              className="flex items-center space-x-2 bg-black text-white hover:bg-gray-800"
            >
              <PlayCircle size={20} />
              <span>Start Search</span>
            </Button>
            <Button
              onClick={resetSearch}
              disabled={isRunning}
              className="flex items-center space-x-2 bg-black text-white hover:bg-gray-800"
            >
              <RotateCcw size={20} />
              <span>Reset</span>
            </Button>
            <Button
              onClick={generateSortedArray}
              disabled={isRunning}
              className="flex items-center space-x-2 bg-black text-white hover:bg-gray-800"
            >
              <Shuffle size={20} />
              <span>New Array</span>
            </Button>
          </div>
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
          />
        </div>
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <Input
            value={customArrayInput}
            onChange={(e) => setCustomArrayInput(e.target.value)}
            placeholder="Enter custom array (comma-separated)"
            className="w-full sm:flex-grow"
          />
          <Button
            onClick={handleCustomArrayInput}
            disabled={isRunning}
            className="w-full sm:w-auto bg-black text-white hover:bg-gray-800"
          >
            Set Custom Array
          </Button>
        </div>
        <div className="h-64 sm:h-80 md:h-96 flex items-end justify-center relative">
          {array.map((value, index) => (
            <div
              key={index}
              className={`w-4 sm:w-6 md:w-8 mx-0.5 sm:mx-1 relative ${
                index === mid
                  ? "bg-gray-900"
                  : index >= left && index <= right
                  ? "bg-gray-600"
                  : "bg-gray-300"
              }`}
              style={{ height: `${(value / Math.max(...array)) * 100}%` }}
            >
              <div className="text-xs text-center overflow-hidden">{value}</div>
              {index === left && (
                <div className="absolute -top-6 left-0 text-xs font-bold">
                  L
                </div>
              )}
              {index === right && (
                <div className="absolute -top-6 right-0 text-xs font-bold">
                  H
                </div>
              )}
              {index === mid && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold">
                  M
                </div>
              )}
            </div>
          ))}
        </div>
        {found !== null && (
          <div className="text-center font-bold">
            {found
              ? `Target ${target} found at index ${mid}`
              : `Target ${target} not found in the array`}
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
};

export default BinarySearchVisualizer;
