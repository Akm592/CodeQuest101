import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import { PlayCircle, PauseCircle, RotateCcw, ArrowRight } from "lucide-react";

const RotateImageVisualizer = () => {
  const [matrix, setMatrix] = useState([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ]);
  const [step, setStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1000);

  interface RotationStep {
    type: "swap" | "reverse";
    i: number;
    j: number;
    i2?: number;
    j2?: number;
  }

  const rotateMatrix = useCallback((mat: number[][]): RotationStep[] => {
    const n = mat.length;
    const steps: RotationStep[] = [];

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        steps.push({ type: "swap", i, j, i2: j, j2: i });
      }
    }

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < Math.floor(n / 2); j++) {
        steps.push({ type: "swap", i, j, i2: i, j2: n - 1 - j });
      }
    }

    return steps;
  }, []);

  const rotationSteps = useMemo(
    () => rotateMatrix([...matrix]),
    [matrix, rotateMatrix]
  );

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && step < rotationSteps.length) {
      timer = setTimeout(() => {
        setStep((prevStep) => prevStep + 1);
      }, speed);
    } else if (step >= rotationSteps.length) {
      setIsRunning(false);
    }
    return () => clearTimeout(timer);
  }, [step, rotationSteps.length, isRunning, speed]);

  const reset = useCallback(() => {
    setStep(0);
    setIsRunning(false);
  }, []);

  const toggleRunning = useCallback(() => setIsRunning((prev) => !prev), []);

  const handleMatrixChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const newMatrix: number[][] = JSON.parse(e.target.value);
        if (
          Array.isArray(newMatrix) &&
          newMatrix.every((row) => Array.isArray(row))
        ) {
          setMatrix(newMatrix);
          reset();
        }
      } catch {
        // Invalid input, do nothing
      }
    },
    [reset]
  );

  const getCellStyle = useCallback(
    (i: number, j: number) => {
      if (step > 0 && step <= rotationSteps.length) {
        const currentStep = rotationSteps[step - 1];
        if (
          currentStep.type === "swap" &&
          ((i === currentStep.i && j === currentStep.j) ||
            (i === currentStep.i2 && j === currentStep.j2))
        ) {
          return "bg-gray-200 border-gray-500";
        }
      }
      return "border-gray-300";
    },
    [step, rotationSteps]
  );

  const renderMatrix = useCallback(
    (mat: number[][], isRotated = false) => (
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${mat[0].length}, minmax(0, 1fr))`,
        }}
      >
        {mat.map((row, i) =>
          row.map((cell, j) => {
            const value = isRotated ? mat[mat.length - 1 - j][i] : cell;
            return (
              <div
                key={`${isRotated ? "rotated-" : ""}${i}-${j}`}
                className={`w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 flex items-center justify-center border-2 rounded-md text-xs sm:text-sm md:text-base font-medium transition-all duration-300 ${
                  isRotated && step >= rotationSteps.length
                    ? "bg-gray-100 border-gray-500"
                    : getCellStyle(i, j)
                }`}
              >
                {value}
              </div>
            );
          })
        )}
      </div>
    ),
    [getCellStyle, step, rotationSteps.length]
  );

  return (
    <div className=" bg-white w-screen">
    <Card className="w-full  mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <CardHeader className="bg-black text-white p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-center">
          Rotate Image Visualizer
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="space-y-4">
          <Input
            type="text"
            value={JSON.stringify(matrix)}
            onChange={handleMatrixChange}
            placeholder="Enter matrix (e.g., [[1,2,3],[4,5,6],[7,8,9]])"
            className="w-full border-2 border-gray-300 focus:border-gray-500 rounded-md p-2"
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
            disabled={step >= rotationSteps.length}
            className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white"
          >
            {isRunning ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
            <span>{isRunning ? "Pause" : "Start"}</span>
          </Button>
          <Button
            onClick={reset}
            className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white"
          >
            <RotateCcw size={20} />
            <span>Reset</span>
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
          {renderMatrix(matrix)}
          <ArrowRight
            size={32}
            className="text-gray-500 transform rotate-90 sm:rotate-0"
          />
          {renderMatrix(matrix, true)}
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">
            Step: {step} / {rotationSteps.length}
          </p>
          <p className="text-sm sm:text-md">
            {step > 0 && step <= rotationSteps.length
              ? rotationSteps[step - 1].type === "swap"
                ? `Swapping (${rotationSteps[step - 1].i},${
                    rotationSteps[step - 1].j
                  }) with (${rotationSteps[step - 1].i2},${
                    rotationSteps[step - 1].j2
                  })`
                : "Reversing row"
              : step > rotationSteps.length
              ? "Rotation complete!"
              : "Ready to start"}
          </p>
        </div>
      </CardContent>
    </Card>
    </div>
  );
};

export default RotateImageVisualizer;
