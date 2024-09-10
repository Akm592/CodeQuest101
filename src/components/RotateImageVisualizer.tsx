import  { useState, useEffect, useMemo, useCallback } from "react";
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

    // Step 1: Transpose the matrix
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        steps.push({ type: "swap", i, j, i2: j, j2: i });
      }
    }

    // Step 2: Reverse each row
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
    (i: number , j : number) => {
      if (step > 0 && step <= rotationSteps.length) {
        const currentStep = rotationSteps[step - 1];
        if (
          currentStep.type === "swap" &&
          ((i === currentStep.i && j === currentStep.j) ||
            (i === currentStep.i2 && j === currentStep.j2))
        ) {
          return "bg-yellow-200 border-yellow-500";
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
                className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center border-2 rounded-md text-sm sm:text-base font-medium transition-all duration-300 ${
                  isRotated && step >= rotationSteps.length
                    ? "bg-green-100 border-green-500"
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
    <Card className="w-full max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6">
        <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
          Rotate Image Visualizer
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <Input
            type="text"
            value={JSON.stringify(matrix)}
            onChange={handleMatrixChange}
            placeholder="Enter matrix (e.g., [[1,2,3],[4,5,6],[7,8,9]])"
            className="w-full border-2 border-gray-300 focus:border-purple-500 rounded-md p-2"
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
            className="flex items-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white"
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
        <div className="flex justify-center items-center space-x-4">
          {renderMatrix(matrix)}
          <ArrowRight size={32} className="text-purple-500" />
          {renderMatrix(matrix, true)}
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">
            Step: {step} / {rotationSteps.length}
          </p>
          <p className="text-md">
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
  );
};

export default RotateImageVisualizer;
