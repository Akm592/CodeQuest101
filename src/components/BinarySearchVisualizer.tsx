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

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6">
        <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
          Binary Search Visualizer
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Input
            type="number"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            placeholder="Enter target number"
            className="w-48"
          />
          <Button
            onClick={binarySearch}
            disabled={isRunning}
            className="flex items-center space-x-2"
          >
            <PlayCircle size={20} />
            <span>Start Search</span>
          </Button>
          <Button
            onClick={resetSearch}
            disabled={isRunning}
            className="flex items-center space-x-2"
          >
            <RotateCcw size={20} />
            <span>Reset</span>
          </Button>
          <Button
            onClick={generateSortedArray}
            disabled={isRunning}
            className="flex items-center space-x-2"
          >
            <Shuffle size={20} />
            <span>New Array</span>
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
          />
        </div>
        <div className="h-64 flex items-end justify-center">
          {array.map((value, index) => (
            <div
              key={index}
              className={`w-8 mx-1 ${
                index === mid
                  ? "bg-yellow-500"
                  : index >= left && index <= right
                  ? "bg-blue-500"
                  : "bg-gray-300"
              }`}
              style={{ height: `${(value / Math.max(...array)) * 100}%` }}
            >
              <div className="text-xs text-center">{value}</div>
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
  );
};

export default BinarySearchVisualizer;
