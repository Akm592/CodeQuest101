import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "./ui/button"; // Adjust path
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"; // Adjust path
import { Input } from "./ui/input"; // Adjust path
import { Slider } from "./ui/slider"; // Adjust path
import { PlayCircle, PauseCircle, RotateCcw, Loader2 } from "lucide-react"; // Added Loader2

// Flattened default matrix in one-line format:
const DEFAULT_FLAT_MATRIX = [1, 2, 3, 4, 12, 13, 14, 5, 11, 16, 15, 6, 10, 9, 8, 7];
const MIN_SPEED_MS = 100;
const MAX_SPEED_MS = 1500;
const DEFAULT_SPEED_MS = 500;

const SpiralMatrixAnimation = () => {
  // Convert the default flat matrix into a square matrix
  const defaultDimension = Math.sqrt(DEFAULT_FLAT_MATRIX.length);
  const DEFAULT_MATRIX = [];
  for (let i = 0; i < defaultDimension; i++) {
    DEFAULT_MATRIX.push(DEFAULT_FLAT_MATRIX.slice(i * defaultDimension, (i + 1) * defaultDimension));
  }
  
  const [matrix, setMatrix] = useState(DEFAULT_MATRIX);
  const [matrixInput, setMatrixInput] = useState(JSON.stringify(DEFAULT_FLAT_MATRIX)); // One-line input
  const [inputError, setInputError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speedValue, setSpeedValue] = useState(MAX_SPEED_MS + MIN_SPEED_MS - DEFAULT_SPEED_MS);
  const [isResetting, setIsResetting] = useState(false);

  const traversalOrder = useMemo(() => {
    const result: [number, number][] = [];
    if (!matrix || matrix.length === 0 || !matrix[0] || matrix[0].length === 0) {
      return [];
    }
    const rows = matrix.length;
    const cols = matrix[0].length;
    let top = 0, bottom = rows - 1, left = 0, right = cols - 1;
    let dir = 0; // 0: right, 1: down, 2: left, 3: up

    while (top <= bottom && left <= right) {
      if (dir === 0) {
        for (let i = left; i <= right; i++) result.push([top, i]);
        top++;
      } else if (dir === 1) {
        for (let i = top; i <= bottom; i++) result.push([i, right]);
        right--;
      } else if (dir === 2) {
        for (let i = right; i >= left; i--) result.push([bottom, i]);
        bottom--;
      } else if (dir === 3) {
        for (let i = bottom; i >= top; i--) result.push([i, left]);
        left++;
      }
      dir = (dir + 1) % 4;
    }
    return result;
  }, [matrix]);

  const calculateDelay = (sliderValue: number): number => {
    return MAX_SPEED_MS + MIN_SPEED_MS - sliderValue;
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isRunning && currentStep < traversalOrder.length) {
      const delay = calculateDelay(speedValue);
      timer = setTimeout(() => {
        setCurrentStep((prevStep) => prevStep + 1);
      }, delay);
    } else if (currentStep >= traversalOrder.length && traversalOrder.length > 0) {
      setIsRunning(false);
    }
    return () => clearTimeout(timer);
  }, [currentStep, traversalOrder.length, isRunning, speedValue]);

  const resetAnimation = useCallback(() => {
    setIsResetting(true);
    setIsRunning(false);
    setCurrentStep(0);
    setTimeout(() => setIsResetting(false), 100);
  }, []);

  const toggleRunning = () => {
    if (currentStep >= traversalOrder.length) {
      resetAnimation();
      setTimeout(() => setIsRunning(true), 120);
    } else {
      setIsRunning((prev) => !prev);
    }
  };

  const handleMatrixInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMatrixInput(e.target.value);
    setInputError(null);
  };

  const applyMatrixInput = () => {
    if (isRunning) return;
    try {
      const flatArray = JSON.parse(matrixInput);
      if (!Array.isArray(flatArray)) {
        setInputError("Input must be a one-dimensional array.");
        return;
      }
      const totalElements = flatArray.length;
      const dimension = Math.sqrt(totalElements);
      if (!Number.isInteger(dimension)) {
        setInputError("Array length must be a perfect square to form a square matrix.");
        return;
      }
      const newMatrix = [];
      for (let i = 0; i < dimension; i++) {
        newMatrix.push(flatArray.slice(i * dimension, (i + 1) * dimension));
      }
      setMatrix(newMatrix);
      resetAnimation();
      setInputError(null);
    } catch (err) {
      console.error("Matrix parsing error:", err);
      setInputError("Invalid JSON format. Please enter a one-line array.");
    }
  };

  const getCellClass = (r: number, c: number) => {
    const isVisited = traversalOrder.slice(0, currentStep).some(([row, col]) => row === r && col === c);
    const isCurrent = currentStep > 0 && traversalOrder[currentStep - 1]?.[0] === r && traversalOrder[currentStep - 1]?.[1] === c;
    let baseClass =
      "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center border rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ease-in-out";
    if (isCurrent) {
      return `${baseClass} bg-teal-500 border-teal-300 text-white scale-110 shadow-lg z-10`;
    } else if (isVisited) {
      return `${baseClass} bg-gray-700 border-gray-600 text-gray-300`;
    } else {
      return `${baseClass} bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700/50`;
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-black p-4 text-gray-300">
      <Card className="w-full max-w-3xl mx-auto bg-gray-900 border border-gray-700/50 shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="bg-gray-800 border-b border-gray-700/50 text-gray-100 p-4 sm:p-5">
          <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-center">
            Spiral Matrix Traversal
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-5">
          {/* Input Area */}
          <div className="space-y-3">
            <label htmlFor="matrixInput" className="text-sm font-medium text-gray-400 block mb-1">
              Matrix (Enter a one-line flat array, e.g. [1,2,3,4,12,13,14,5,11,16,15,6,10,9,8,7]):
            </label>
            <Input
              id="matrixInput"
              value={matrixInput}
              onChange={handleMatrixInputChange}
              placeholder='[1,2,3,...]'
              disabled={isRunning}
              className="w-full font-mono text-sm bg-gray-800 border border-gray-600 text-gray-100 placeholder:text-gray-500 rounded-md p-2 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-70"
            />
            {inputError && <p className="text-xs text-red-400 mt-1">{inputError}</p>}
            <Button
              onClick={applyMatrixInput}
              disabled={isRunning || !matrixInput.trim()}
              className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm px-4 py-1.5 disabled:opacity-60"
            >
              Apply Matrix
            </Button>
          </div>

          {/* Speed Control */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pt-3">
            <span className="text-sm font-medium text-gray-400 shrink-0">Animation Speed:</span>
            <Slider
              value={[speedValue]}
              onValueChange={(value) => setSpeedValue(value[0])}
              min={MIN_SPEED_MS}
              max={MAX_SPEED_MS}
              step={50}
              className="flex-grow [&>span:first-child]:h-2 [&>span>span]:bg-teal-500 [&>span:first-child]:bg-gray-700"
              disabled={isRunning}
              aria-label="Animation Speed Control"
            />
            <span className="text-xs font-mono text-gray-500 w-16 text-right">
              {`${calculateDelay(speedValue)} ms`}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4 border-t border-gray-700/50">
            <Button
              onClick={toggleRunning}
              disabled={isResetting || (isRunning && currentStep >= traversalOrder.length) || traversalOrder.length === 0}
              className={`flex items-center justify-center gap-2 font-semibold w-full sm:w-auto px-6 py-2.5 disabled:opacity-60 ${
                isRunning ? "bg-yellow-600 hover:bg-yellow-700" : "bg-teal-600 hover:bg-teal-700"
              } text-white`}
            >
              {isRunning ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
              <span>{isRunning ? "Pause" : currentStep >= traversalOrder.length && currentStep > 0 ? "Replay" : "Start"}</span>
            </Button>
            <Button
              onClick={resetAnimation}
              disabled={isResetting || (!isRunning && currentStep === 0)}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold w-full sm:w-auto px-6 py-2.5 disabled:opacity-60"
            >
              {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw size={18} />}
              <span>Reset</span>
            </Button>
          </div>

          {/* Matrix Visualization */}
          {matrix && matrix.length > 0 && matrix[0].length > 0 ? (
            <div className="flex justify-center pt-2">
              <div
                className="grid gap-1 sm:gap-1.5"
                style={{
                  gridTemplateColumns: `repeat(${matrix[0].length}, minmax(0, auto))`,
                  width: "max-content",
                }}
              >
                {matrix.map((row, i) =>
                  row.map((cell, j) => (
                    <div key={`${i}-${j}`} className={getCellClass(i, j)}>
                      {cell}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-10">Enter a valid matrix to visualize.</p>
          )}

          {/* Status Display */}
          <div className="text-center space-y-1 pt-4 border-t border-gray-700/50">
            <p className="text-sm font-medium text-gray-400">
              Step: {currentStep} / {traversalOrder.length}
            </p>
            <p className="text-xs sm:text-sm text-teal-300 font-mono break-all h-10 overflow-y-auto p-1 bg-black/20 rounded">
              {traversalOrder
                .slice(0, currentStep)
                .map(([r, c]) => matrix?.[r]?.[c] ?? "?")
                .join(" → ") || (currentStep === 0 ? "Traversal path will appear here..." : "")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpiralMatrixAnimation;
