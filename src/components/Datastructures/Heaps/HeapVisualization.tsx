import React, { useRef, useEffect, useState, useCallback } from 'react';
import p5 from 'p5';
import { Button } from "../../ui/button"; // Using shadcn Button
import { Input } from "../../ui/input"; // Using shadcn Input
import { AlertCircle, ArrowDownUp, RotateCcw, Plus, Shuffle, Settings, Loader2 } from 'lucide-react'; // Icons

// Augment p5 instance type if needed
declare module 'p5' {
  interface p5 {
    startInsertion: (value: number) => void;
    toggleHeapType: () => void;
    resetHeap: () => void;
    buildHeapFromArray: (arr: number[]) => void;
  }
}

const HeapVisualization: React.FC = () => {
  const sketchRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [initialArrayInput, setInitialArrayInput] = useState(""); // Input for build array
  const [inputError, setInputError] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState(false); // Loading state for build
  const [isMinHeap, setIsMinHeap] = useState(true); // Track heap type in React state

  const sketchFunction = useCallback((p: p5) => {
    // Heap-related variables
    let heap: number[] = [];
    let heapSize = 0;
    let currentIsMinHeap = true; // Internal heap type
    let animationState: "idle" | "inserting" | "comparing" | "swapping" | "done" | "building" = "idle";
    let animationStep = 0;
    let animationSpeed = 35; // Adjust frame count for speed (lower is faster)
    let frameCounter = 0;
    let currentValue: number | null = null;
    let currentIndex = -1;
    let parentIndex = -1;
    let explanationText = "Enter a value to insert or build from array.";
    let buildingStep = -1; // Will be set once in buildHeapFromArray

    const nodeRadius = 16;
    const levelHeight = 70;
    let canvasWidth = 800;
    let canvasHeight = 400;

    p.setup = () => {
      const container = sketchRef.current;
      canvasWidth = container?.offsetWidth || 800;
      canvasHeight = container?.offsetHeight || 400;
      p.createCanvas(canvasWidth, canvasHeight);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
    };

    p.windowResized = () => {
      const container = sketchRef.current;
      canvasWidth = container?.offsetWidth || 800;
      canvasHeight = container?.offsetHeight || 400;
      p.resizeCanvas(canvasWidth, canvasHeight);
    };

    p.draw = () => {
      p.background(17, 24, 39); // bg-gray-900

      // Draw Heap Title
      p.textSize(14);
      p.fill(209, 213, 219); // gray-300
      p.textAlign(p.RIGHT, p.TOP);
      p.text(currentIsMinHeap ? "Min Heap" : "Max Heap", canvasWidth - 20, 15);

      // Draw Explanation Text
      p.textSize(11);
      p.textAlign(p.LEFT, p.TOP);
      p.fill(156, 163, 175); // gray-400
      p.text(explanationText, 20, canvasHeight - 35, canvasWidth - 40, 30);

      p.textAlign(p.CENTER, p.CENTER); // Reset alignment

      drawHeapTree();

      if (animationState !== "idle") {
        frameCounter++;
        if (frameCounter >= animationSpeed) {
          frameCounter = 0;
          nextAnimationStep();
        }
      }
    };

    function drawHeapTree() {
      if (heapSize === 0) return;
      const maxLevel = heapSize > 0 ? Math.floor(Math.log2(heapSize)) : 0;
      const maxNodesAtBase = Math.pow(2, maxLevel);
      const baseLayerWidth = Math.max(maxNodesAtBase * (nodeRadius * 3), canvasWidth * 0.8);
      const xSpacingUnit = baseLayerWidth / maxNodesAtBase;

      for (let i = 0; i < heapSize; i++) {
        const level = Math.floor(Math.log2(i + 1));
        const nodesInLevel = Math.pow(2, level);
        const positionInLevel = i + 1 - nodesInLevel;
        const levelWidth = nodesInLevel * xSpacingUnit;
        const levelStartX = (canvasWidth - levelWidth) / 2;

        const x = levelStartX + (positionInLevel + 0.5) * xSpacingUnit;
        const y = 60 + level * levelHeight;

        const leftChildIndex = 2 * i + 1;
        const rightChildIndex = 2 * i + 2;

        if (leftChildIndex < heapSize) drawLineToChild(x, y, leftChildIndex, level + 1, xSpacingUnit);
        if (rightChildIndex < heapSize) drawLineToChild(x, y, rightChildIndex, level + 1, xSpacingUnit);

        let nodeFill = p.color(55, 65, 81);
        let nodeStroke = p.color(107, 114, 128);
        let scale = 1;

        if (i === currentIndex) {
          nodeFill = p.color(245, 158, 11);
          nodeStroke = p.color(253, 230, 138);
          scale = 1.1;
        } else if (i === parentIndex) {
          nodeFill = p.color(59, 130, 246);
          nodeStroke = p.color(147, 197, 253);
          scale = 1.1;
        } else if (animationState === "building" && i >= buildingStep && buildingStep !== -1) {
          nodeFill = p.color(79, 70, 229, 150);
        } else if (animationState === 'swapping' && (i === currentIndex || i === parentIndex)) {
          nodeFill = p.color(239, 68, 68);
          nodeStroke = p.color(252, 165, 165);
          scale = 1.15;
        } else if (animationState === 'done' && i === currentIndex) {
          nodeFill = p.color(34, 197, 94);
          nodeStroke = p.color(134, 239, 172);
        }

        p.strokeWeight(1.5);
        p.stroke(nodeStroke);
        p.fill(nodeFill);
        p.ellipse(x, y, nodeRadius * 2 * scale, nodeRadius * 2 * scale);

        p.noStroke();
        p.fill(229, 231, 235);
        p.textSize(12 * scale);
        p.text(heap[i], x, y);
        p.textSize(8 * scale);
        p.fill(156, 163, 175);
        p.text(`[${i}]`, x, y + nodeRadius * scale + 8);
      }
    }

    function drawLineToChild(parentX: number, parentY: number, childIndex: number, childLevel: number, xSpacingUnit: number) {
      const nodesInLevel = Math.pow(2, childLevel);
      const positionInLevel = childIndex + 1 - Math.pow(2, childLevel);
      const levelWidth = nodesInLevel * xSpacingUnit;
      const levelStartX = (canvasWidth - levelWidth) / 2;

      const childX = levelStartX + (positionInLevel + 0.5) * xSpacingUnit;
      const childY = 60 + childLevel * levelHeight;

      const angle = p.atan2(childY - parentY, childX - parentX);
      const startX = parentX + p.cos(angle) * (nodeRadius + 2);
      const startY = parentY + p.sin(angle) * (nodeRadius + 2);
      const endX = childX - p.cos(angle) * (nodeRadius + 2);
      const endY = childY - p.sin(angle) * (nodeRadius + 2);

      p.strokeWeight(1);
      p.stroke(107, 114, 128, 150);
      p.line(startX, startY, endX, endY);
    }

    // --- Animation Logic ---
    function startInsertion(newValue: number) {
      if (animationState !== "idle") return;
      if (heapSize >= 31) {
        explanationText = "Heap size limit (31 nodes) reached for visualization clarity.";
        return;
      }
      currentValue = newValue;
      animationState = "inserting";
      animationStep = 0;
      explanationText = `Step 1: Add ${currentValue} to the end.`;
    }

    function nextAnimationStep() {
      if (animationState === "inserting") {
        if (animationStep === 0) {
          heap[heapSize] = currentValue!;
          currentIndex = heapSize;
          heapSize++;
          animationState = "comparing";
          animationStep = 0;
          explanationText = `Step 2: Compare ${heap[currentIndex]} with parent & sift up if needed.`;
        }
      } else if (animationState === "comparing") {
        parentIndex = currentIndex > 0 ? Math.floor((currentIndex - 1) / 2) : -1;
        if (parentIndex !== -1) {
          let needSwap = false;
          const childVal = heap[currentIndex];
          const parentVal = heap[parentIndex];
          if (currentIsMinHeap) {
            needSwap = childVal < parentVal;
            explanationText = `Compare ${childVal} (idx ${currentIndex}) with parent ${parentVal} (idx ${parentIndex}). Min Heap: Swap? ${needSwap ? 'Yes' : 'No'}.`;
          } else {
            needSwap = childVal > parentVal;
            explanationText = `Compare ${childVal} (idx ${currentIndex}) with parent ${parentVal} (idx ${parentIndex}). Max Heap: Swap? ${needSwap ? 'Yes' : 'No'}.`;
          }
          if (needSwap) {
            animationState = "swapping";
          } else {
            animationState = "done";
            explanationText = `Correct position found. Heap property satisfied.`;
          }
        } else {
          animationState = "done";
          explanationText = `Element is at the root. Heap property satisfied.`;
        }
      } else if (animationState === "swapping") {
        if (currentIndex !== -1 && parentIndex !== -1) {
          explanationText = `Swapping ${heap[currentIndex]} (idx ${currentIndex}) and ${heap[parentIndex]} (idx ${parentIndex}).`;
          [heap[currentIndex], heap[parentIndex]] = [heap[parentIndex], heap[currentIndex]];
          currentIndex = parentIndex;
          parentIndex = -1;
          animationState = "comparing";
        } else {
          animationState = 'idle';
        }
      } else if (animationState === "done") {
        animationState = "idle";
        explanationText = "Insertion complete.";
        currentIndex = -1;
        parentIndex = -1;
        currentValue = null;
      } else if (animationState === "building") {
        // Process one build step at a time without reinitializing buildingStep
        if (buildingStep >= 0) {
          explanationText = `Build Heap: Heapifying down from index ${buildingStep} (value ${heap[buildingStep]}).`;
          heapifyDown(buildingStep);
          buildingStep--;
        } else {
          animationState = "idle";
          explanationText = "Heap built successfully from array.";
          setIsBuilding(false);
        }
      }
    }

    // --- Helper Heap Functions ---
    function heapifyUp(index: number) {
      let currentIdx = index;
      while (currentIdx > 0) {
        const parentIdx = Math.floor((currentIdx - 1) / 2);
        const shouldSwap = currentIsMinHeap
          ? heap[currentIdx] < heap[parentIdx]
          : heap[currentIdx] > heap[parentIdx];
        if (!shouldSwap) break;
        [heap[currentIdx], heap[parentIdx]] = [heap[parentIdx], heap[currentIdx]];
        currentIdx = parentIdx;
      }
    }

    function heapifyDown(index: number) {
      const n = heapSize;
      let targetIndex = index;
      while (true) {
        let currentTarget = targetIndex;
        const leftChildIndex = 2 * targetIndex + 1;
        const rightChildIndex = 2 * targetIndex + 2;

        if (leftChildIndex < n) {
          const shouldSwapLeft = currentIsMinHeap
            ? heap[leftChildIndex] < heap[currentTarget]
            : heap[leftChildIndex] > heap[currentTarget];
          if (shouldSwapLeft) currentTarget = leftChildIndex;
        }
        if (rightChildIndex < n) {
          const shouldSwapRight = currentIsMinHeap
            ? heap[rightChildIndex] < heap[currentTarget]
            : heap[rightChildIndex] > heap[currentTarget];
          if (shouldSwapRight) currentTarget = rightChildIndex;
        }

        if (currentTarget === targetIndex) break;
        [heap[targetIndex], heap[currentTarget]] = [heap[currentTarget], heap[targetIndex]];
        targetIndex = currentTarget;
      }
    }

    // --- Exposing Functions to React ---
    (p as p5).startInsertion = (newValue: number) => {
      startInsertion(newValue);
    };

    (p as p5).toggleHeapType = () => {
      if (animationState !== "idle") return;
      currentIsMinHeap = !currentIsMinHeap;
      const elements = heap.slice(0, heapSize);
      heap = [];
      heapSize = 0;
      elements.forEach(val => {
        heap[heapSize] = val;
        heapifyUp(heapSize);
        heapSize++;
      });
      explanationText = `Switched to ${currentIsMinHeap ? 'Min' : 'Max'} Heap and rebuilt.`;
      setIsMinHeap(currentIsMinHeap);
    };

    (p as p5).resetHeap = () => {
      heap = [];
      heapSize = 0;
      animationState = "idle";
      currentIndex = -1;
      parentIndex = -1;
      currentValue = null;
      buildingStep = -1;
      explanationText = "Heap reset.";
    };

    (p as p5).buildHeapFromArray = (arr: number[]) => {
      if (animationState !== "idle") return;
      if (arr.length > 31) {
        explanationText = "Array too large (max 31). Please use a smaller array.";
        return;
      }
      heap = [...arr];
      heapSize = arr.length;
      // Initialize buildingStep only once here
      buildingStep = Math.floor(heapSize / 2) - 1;
      animationState = "building";
      explanationText = `Building ${currentIsMinHeap ? 'Min' : 'Max'} Heap from array... Starting heapify down.`;
      setIsBuilding(true);
    };
  }, []);

  // Create and store p5 instance on mount; build a default heap.
  useEffect(() => {
    if (sketchRef.current) {
      const instance = new p5(sketchFunction, sketchRef.current);
      p5InstanceRef.current = instance;
      // Build a default heap (adjust values as desired)
      setTimeout(() => {
        instance.buildHeapFromArray([40, 20, 60, 10, 30, 50, 70]);
      }, 100);
      return () => {
        instance.remove();
        p5InstanceRef.current = null;
      };
    }
  }, [sketchFunction]);

  // --- React Component Handlers ---
  const handleInsert = () => {
    setInputError(null);
    const num = parseInt(inputValue);
    if (isNaN(num)) {
      setInputError("Please enter a valid number.");
      return;
    }
    p5InstanceRef.current?.startInsertion(num);
    setInputValue("");
  };

  const handleToggleHeap = () => {
    p5InstanceRef.current?.toggleHeapType();
  };

  const handleResetHeap = () => {
    p5InstanceRef.current?.resetHeap();
    setInitialArrayInput("");
    setInputError(null);
  };

  const handleBuildHeap = () => {
    setInputError(null);
    const arr = initialArrayInput
      .split(/[\s,]+/)
      .filter(s => s.trim() !== '')
      .map(Number);
    if (arr.some(isNaN)) {
      setInputError("Array contains non-numeric values.");
      return;
    }
    if (arr.length === 0) {
      setInputError("Please enter numbers for the array.");
      return;
    }
    if (arr.length > 31) {
      setInputError("Max array size is 31 for visualization.");
      return;
    }
    p5InstanceRef.current?.buildHeapFromArray(arr);
  };

  return (
    <div className="flex flex-col items-center p-4 gap-4 w-full">
      <div className="flex flex-col sm:flex-row w-full max-w-md gap-2">
        <Input
          type="number"
          placeholder="Value to insert"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setInputError(null); }}
          disabled={isBuilding}
          className="h-9 bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500 disabled:opacity-70"
        />
        <Button onClick={handleInsert} disabled={isBuilding || !inputValue} className="h-9 text-sm bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-60">
          <Plus size={16} className="mr-1" /> Insert
        </Button>
      </div>
      <div className="flex flex-col sm:flex-row w-full max-w-md gap-2">
        <Input
          type="text"
          placeholder="Array (e.g., 50, 20, 80, 10)"
          value={initialArrayInput}
          onChange={(e) => { setInitialArrayInput(e.target.value); setInputError(null); }}
          disabled={isBuilding}
          className="h-9 bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500 disabled:opacity-70 font-mono text-xs"
        />
        <Button onClick={handleBuildHeap} disabled={isBuilding || !initialArrayInput.trim()} className="h-9 text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">
          {isBuilding ? <Loader2 size={16} className="mr-1 animate-spin" /> : <Settings size={16} className="mr-1" />}
          {isBuilding ? "Building..." : "Build Heap"}
        </Button>
      </div>
      {inputError && <p className="text-xs text-red-400 mt-1 self-center">{inputError}</p>}
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        <Button onClick={handleToggleHeap} disabled={isBuilding} className="text-xs px-3 py-1 h-auto bg-gray-700 hover:bg-gray-600 disabled:opacity-60">
          <ArrowDownUp size={14} className="mr-1" /> Toggle <span className='font-mono ml-1'>{isMinHeap ? '[MIN]' : '[MAX]'}</span>
        </Button>
        <Button onClick={handleResetHeap} disabled={isBuilding} className="text-xs px-3 py-1 h-auto bg-red-700 hover:bg-red-600 text-white disabled:opacity-60">
          <RotateCcw size={14} className="mr-1" /> Reset
        </Button>
      </div>
      <div
        ref={sketchRef}
        className="w-full max-w-3xl h-[400px] sm:h-[450px] border border-gray-700/50 rounded-lg bg-gray-900 mt-4 overflow-hidden"
        aria-label="Heap visualization canvas"
      />
    </div>
  );
};

export default HeapVisualization;
