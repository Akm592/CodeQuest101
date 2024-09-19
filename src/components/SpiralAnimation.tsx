import { useState, useEffect, useMemo } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import { PlayCircle, PauseCircle, RotateCcw } from "lucide-react";

const SpiralMatrixAnimation = () => {
  const [matrix, setMatrix] = useState([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1000);

  const traversalOrder = useMemo(() => {
    const result = [];
    const n = matrix.length;
    let top = 0,
      bottom = n - 1,
      left = 0,
      right = n - 1;

    while (top <= bottom && left <= right) {
      for (let i = left; i <= right; i++) result.push([top, i]);
      top++;

      for (let i = top; i <= bottom; i++) result.push([i, right]);
      right--;

      if (top <= bottom) {
        for (let i = right; i >= left; i--) result.push([bottom, i]);
        bottom--;
      }

      if (left <= right) {
        for (let i = bottom; i >= top; i--) result.push([i, left]);
        left++;
      }
    }

    return result;
  }, [matrix]);

  useEffect(() => {
    if (isRunning && currentStep < traversalOrder.length) {
      const timer = setTimeout(() => {
        setCurrentStep((prevStep) => prevStep + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else if (currentStep >= traversalOrder.length) {
      setIsRunning(false);
    }
  }, [currentStep, traversalOrder.length, isRunning, speed]);

  const resetAnimation = () => {
    setCurrentStep(0);
    setIsRunning(false);
  };

  const toggleRunning = () => setIsRunning((prev) => !prev);

  const handleMatrixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    try {
      const newMatrix = JSON.parse(input);
      if (
        Array.isArray(newMatrix) &&
        newMatrix.every((row) => Array.isArray(row))
      ) {
        setMatrix(newMatrix);
        resetAnimation();
      }
    } catch {
      // Invalid input, do nothing
    }
  };

  return (
    <div className="w-screen mx-auto bg-white shadow-lg rounded-lg overflow-hidden pb-10 pt-5 pr-10  pl-10">
    <Card className="w-full max-w-6xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <CardHeader className="bg-black text-white p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-center">
          Spiral Matrix Animation
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="space-y-4">
          <Input
            type="text"
            value={JSON.stringify(matrix)}
            onChange={handleMatrixChange}
            placeholder="Enter matrix (e.g., [[1,2,3],[4,5,6],[7,8,9]])"
            className="w-full border-2 border-gray-300 focus:border-black rounded-md p-2"
          />
          <div className="flex items-center space-x-4">
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
        <div className="flex justify-center space-x-4">
          <Button
            onClick={toggleRunning}
            disabled={currentStep >= traversalOrder.length}
            className="flex items-center space-x-2 bg-black hover:bg-gray-800 text-white"
          >
            {isRunning ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
            <span>{isRunning ? "Pause" : "Start"}</span>
          </Button>
          <Button
            onClick={resetAnimation}
            className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white"
          >
            <RotateCcw size={20} />
            <span>Reset</span>
          </Button>
        </div>
        <div className="flex justify-center">
          <div
            className={`grid gap-1 sm:gap-2`}
            style={{
              gridTemplateColumns: `repeat(${matrix[0].length}, minmax(0, 1fr))`,
            }}
          >
            {matrix.map((row, i) =>
              row.map((cell, j) => (
                <div
                  key={`${i}-${j}`}
                  className={`w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 flex items-center justify-center border-2 rounded-md text-xs sm:text-sm md:text-base font-medium transition-all duration-300 ${
                    traversalOrder
                      .slice(0, currentStep)
                      .some(([r, c]) => r === i && c === j)
                      ? "bg-gray-200 border-black"
                      : "border-gray-300"
                  }`}
                >
                  {cell}
                </div>
              ))
            )}
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-base sm:text-lg font-semibold">
            Step: {currentStep} / {traversalOrder.length}
          </p>
          <p className="text-sm sm:text-md">
            Traversal Order:{" "}
            {traversalOrder
              .slice(0, currentStep)
              .map(([r, c]) => matrix[r][c])
              .join(" → ")}
          </p>
        </div>
      </CardContent>
    </Card>
    </div>
  );
};

export default SpiralMatrixAnimation;
