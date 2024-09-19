import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import { PlayCircle, PauseCircle, RotateCcw } from "lucide-react";

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
    <div className="min-h-screen w-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="bg-black text-white p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-center">
            Longest Sub-Array with Sum K Visualizer
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="space-y-4">
            <Input
              type="text"
              value={arr.join(", ")}
              onChange={(e) => {
                setArr(e.target.value.split(",").map(Number));
                reset();
              }}
              placeholder="Enter array (comma-separated)"
              className="w-full border-2 border-gray-300 focus:border-black rounded-md p-2"
            />
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                type="number"
                value={k}
                onChange={(e) => {
                  setK(Number(e.target.value));
                  reset();
                }}
                placeholder="Enter target sum (k)"
                className="w-full sm:w-1/2 border-2 border-gray-300 focus:border-black rounded-md p-2"
              />
              <div className="w-full sm:w-1/2 flex items-center space-x-4">
                <span className="text-sm font-medium">Speed:</span>
                <Slider
                  value={[speed]}
                  onValueChange={(value) => setSpeed(value[0])}
                  min={100}
                  max={2000}
                  step={100}
                  className="flex-grow"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-center space-x-4">
            <Button
              onClick={toggleRunning}
              disabled={isDone}
              className="flex items-center space-x-2 bg-black hover:bg-gray-800 text-white"
            >
              {isRunning ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
              <span>{isRunning ? "Pause" : "Start"}</span>
            </Button>
            <Button
              onClick={reset}
              className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white"
            >
              <RotateCcw size={20} />
              <span>Reset</span>
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
            {arr.map((num, index) => (
              <div
                key={index}
                className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center border-2 rounded-md text-xs sm:text-sm md:text-base font-medium transition-all duration-300 ${
                  index >= left && index < right
                    ? "bg-gray-200 border-black"
                    : "border-gray-300"
                } ${index === left ? "border-l-4 border-l-black" : ""} ${
                  index === right - 1 ? "border-r-4 border-r-black" : ""
                } ${
                  isDone && index >= maxStart && index <= maxEnd
                    ? "bg-gray-300 border-black"
                    : ""
                }`}
              >
                {num}
              </div>
            ))}
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm sm:text-base">
              Current Sum: <span className="font-bold">{currentSum}</span>
            </p>
            <p className="text-sm sm:text-base">
              Max Length: <span className="font-bold">{maxLength}</span>
            </p>
            <p className="text-sm sm:text-base">
              Target Sum (k): <span className="font-bold">{k}</span>
            </p>
            {isDone && (
              <p className="font-bold mt-4 text-base sm:text-lg md:text-xl text-black">
                Longest subarray with sum {k}: [
                {arr.slice(maxStart, maxEnd + 1).join(", ")}]
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LongestSubarraySumKVisualizer;
