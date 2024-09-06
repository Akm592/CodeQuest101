import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

const LongestSubarraySumKVisualizer = () => {
  const [arr, setArr] = useState([10, 5, 2, 7, 1, 9]);
  const [k, setK] = useState(15);
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(0);
  const [currentSum, setCurrentSum] = useState(0);
  const [maxLength, setMaxLength] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1000);

  const reset = () => {
    setLeft(0);
    setRight(0);
    setCurrentSum(0);
    setMaxLength(0);
    setIsRunning(false);
  };

  const step = () => {
    if (right < arr.length) {
      setCurrentSum((prev) => prev + arr[right]);
      setRight((prev) => prev + 1);
    } else {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (isRunning) {
      const timer = setTimeout(() => {
        if (currentSum > k && left < right) {
          setCurrentSum((prev) => prev - arr[left]);
          setLeft((prev) => prev + 1);
        } else if (currentSum === k) {
          setMaxLength((prev) => Math.max(prev, right - left));
          step();
        } else {
          step();
        }
      }, speed);
      return () => clearTimeout(timer);
    }
  }, [isRunning, left, right, currentSum, k, arr, speed]);

  const toggleRunning = () => setIsRunning((prev) => !prev);

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Longest Sub-Array with Sum K Visualizer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            type="text"
            value={arr.join(", ")}
            onChange={(e) => setArr(e.target.value.split(",").map(Number))}
            placeholder="Enter array (comma-separated)"
            className="mb-2"
          />
          <Input
            type="number"
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
            placeholder="Enter target sum (k)"
            className="mb-2"
          />
          <Input
            type="number"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            placeholder="Animation speed (ms)"
            className="mb-2"
          />
        </div>
        <div className="flex justify-center space-x-2 mb-4">
          <Button onClick={toggleRunning}>
            {isRunning ? "Pause" : "Start"}
          </Button>
          <Button onClick={reset}>Reset</Button>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {arr.map((num, index) => (
            <div
              key={index}
              className={`w-10 h-10 flex items-center justify-center border ${
                index >= left && index < right ? "bg-blue-200" : ""
              } ${index === left ? "border-l-4 border-l-green-500" : ""} ${
                index === right - 1 ? "border-r-4 border-r-red-500" : ""
              }`}
            >
              {num}
            </div>
          ))}
        </div>
        <div className="text-center">
          <p>Current Sum: {currentSum}</p>
          <p>Max Length: {maxLength}</p>
          <p>Target Sum (k): {k}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LongestSubarraySumKVisualizer;
