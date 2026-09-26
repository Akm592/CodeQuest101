import React, { useState, useMemo, useCallback } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";

import { useAlgorithmPlayer } from "../hooks/useAlgorithmPlayer";
import VisualizerControls from "./Visualizer/VisualizerControls";

// Flattened default matrix in one-line format:
const DEFAULT_FLAT_MATRIX = [1, 2, 3, 4, 12, 13, 14, 5, 11, 16, 15, 6, 10, 9, 8, 7];

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

  // The traversal was already a memoized array of steps, so this page only ever
  // needed a player over it. The hook replaces the local timer effect, the
  // speed constants, the isRunning flag and the isResetting spinner — and adds
  // step-forward/backward, which this page never had.
  const player = useAlgorithmPlayer(traversalOrder, { initialDelayMs: 500 });

  // `index` is the position in the traversal; the views below count cells
  // visited, which is one more.
  const visitedCount = player.index + 1;

  const handleMatrixInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMatrixInput(e.target.value);
    setInputError(null);
  };

  const applyMatrixInput = useCallback(() => {
    if (player.status === "running") return;
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
      // No explicit reset needed: a new matrix gives traversalOrder a new
      // identity, and the player rewinds on that.
      setMatrix(newMatrix);
      setInputError(null);
    } catch (err) {
      console.error("Matrix parsing error:", err);
      setInputError("Invalid JSON format. Please enter a one-line array.");
    }
  }, [matrixInput, player.status]);

  const getCellClass = (r: number, c: number) => {
    const isVisited = traversalOrder.slice(0, visitedCount).some(([row, col]) => row === r && col === c);
    const isCurrent = player.index >= 0 && traversalOrder[player.index]?.[0] === r && traversalOrder[player.index]?.[1] === c;
    const baseClass =
      "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center border rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ease-in-out";
    if (isCurrent) {
      return `${baseClass} bg-viz-current border-viz-current text-primary-foreground scale-110 shadow-lg z-10`;
    } else if (isVisited) {
      return `${baseClass} bg-viz-visited/20 border-viz-visited/40 text-foreground`;
    } else {
      return `${baseClass} bg-muted border-border text-muted-foreground hover:bg-muted/50`;
    }
  };

  return (
    <div className="flex w-full items-center justify-center">
      <Card className="w-full max-w-3xl mx-auto shadow-xl overflow-hidden">
        <CardContent className="p-4 sm:p-6 space-y-5">
          {/* Input Area */}
          <div className="space-y-3">
            <label htmlFor="matrixInput" className="text-sm font-medium text-muted-foreground block mb-1">
              Matrix (Enter a one-line flat array, e.g. [1,2,3,4,12,13,14,5,11,16,15,6,10,9,8,7]):
            </label>
            <Input
              id="matrixInput"
              value={matrixInput}
              onChange={handleMatrixInputChange}
              placeholder='[1,2,3,...]'
              disabled={player.status === "running"}
              className="w-full font-mono text-sm bg-muted border border-border text-foreground placeholder:text-muted-foreground rounded-md p-2 focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-70"
            />
            {inputError && <p className="text-xs text-destructive mt-1">{inputError}</p>}
            <Button
              variant="outline"
              onClick={applyMatrixInput}
              disabled={player.status === "running" || !matrixInput.trim()}
              className="w-full sm:w-auto"
            >
              Apply Matrix
            </Button>
          </div>

          <div className="border-t border-border pt-4">
            <VisualizerControls
              status={player.status}
              onPlay={player.play}
              onPause={player.pause}
              onReset={player.reset}
              onStepForward={player.stepForward}
              onStepBack={player.stepBack}
              delayMs={player.delayMs}
              onDelayChange={player.setDelayMs}
              stepIndex={player.index}
              stepCount={player.stepCount}
              disabledReason={traversalOrder.length === 0 ? "Enter a valid matrix first." : null}
            />
          </div>

          {/* Matrix Visualization */}
          {matrix && matrix.length > 0 && matrix[0].length > 0 ? (
            <div className="flex justify-center overflow-x-auto pt-2">
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
            <p className="text-center text-muted-foreground py-10">Enter a valid matrix to visualize.</p>
          )}

          {/* Status Display */}
          <div className="text-center space-y-1 pt-4 border-t border-border">
            <p className="text-xs sm:text-sm text-primary font-mono break-all h-10 overflow-y-auto p-1 bg-black/20 rounded">
              {traversalOrder
                .slice(0, visitedCount)
                .map(([r, c]) => matrix?.[r]?.[c] ?? "?")
                .join(" → ") || "Traversal path will appear here..."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpiralMatrixAnimation;
