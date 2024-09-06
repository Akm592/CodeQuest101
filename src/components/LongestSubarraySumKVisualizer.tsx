import { useState, useEffect } from "react";
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
  const [maxStart, setMaxStart] = useState(0);
  const [maxEnd, setMaxEnd] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [speed, setSpeed] = useState(1000);

  const reset = () => {
    setLeft(0);
    setRight(0);
    setCurrentSum(0);
    setMaxLength(0);
    setMaxStart(0);
    setMaxEnd(0);
    setIsRunning(false);
    setIsDone(false);
  };

  const step = () => {
    if (right < arr.length) {
      setCurrentSum((prev) => prev + arr[right]);
      setRight((prev) => prev + 1);
    } else {
      setIsRunning(false);
      setIsDone(true);
    }
  };

  useEffect(() => {
    if (isRunning) {
      const timer = setTimeout(() => {
        if (currentSum > k && left < right) {
          setCurrentSum((prev) => prev - arr[left]);
          setLeft((prev) => prev + 1);
        } else if (currentSum === k) {
          if (right - left > maxLength) {
            setMaxLength(right - left);
            setMaxStart(left);
            setMaxEnd(right - 1);
          }
          step();
        } else {
          step();
        }
      }, speed);
      return () => clearTimeout(timer);
    }
  }, [isRunning, left, right, currentSum, k, arr, speed, maxLength]);

  const toggleRunning = () => setIsRunning((prev) => !prev);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl text-center">Longest Sub-Array with Sum K Visualizer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            type="text"
            value={arr.join(', ')}
            onChange={(e) => {
              setArr(e.target.value.split(',').map(Number));
              reset();
            }}
            placeholder="Enter array (comma-separated)"
            className="w-full placeholder-gray-400 placeholder-opacity-75"
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="number"
              value={k}
              onChange={(e) => {
                setK(Number(e.target.value));
                reset();
              }}
              placeholder="Enter target sum (k)"
              className="w-full sm:w-1/2 placeholder-gray-400 placeholder-opacity-75"
            />
            <Input
              type="number"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              placeholder="Animation speed (ms)"
              className="w-full sm:w-1/2 placeholder-gray-400 placeholder-opacity-75"
            />
          </div>
        </div>
        <div className="flex justify-center space-x-2">
          <Button onClick={toggleRunning} disabled={isDone}>
            {isRunning ? 'Pause' : 'Start'}
          </Button>
          <Button onClick={reset}>Reset</Button>
        </div>
        <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
          {arr.map((num, index) => (
            <div
              key={index}
              className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border text-xs sm:text-sm ${
                index >= left && index < right ? 'bg-blue-200' : ''
              } ${index === left ? 'border-l-4 border-l-green-500' : ''} ${
                index === right - 1 ? 'border-r-4 border-r-red-500' : ''
              } ${isDone && index >= maxStart && index <= maxEnd ? 'bg-yellow-200' : ''}`}
            >
              {num}
            </div>
          ))}
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm sm:text-base">Current Sum: {currentSum}</p>
          <p className="text-sm sm:text-base">Max Length: {maxLength}</p>
          <p className="text-sm sm:text-base">Target Sum (k): {k}</p>
          {isDone && (
            <p className="font-bold mt-4 text-sm sm:text-base">
              Longest subarray with sum {k}: [{arr.slice(maxStart, maxEnd + 1).join(', ')}]
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LongestSubarraySumKVisualizer;





