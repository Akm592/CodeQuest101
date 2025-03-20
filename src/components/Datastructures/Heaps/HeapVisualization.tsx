import React, { useRef, useEffect, useState } from 'react';
import p5 from 'p5';

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
  const p5InstanceRef = useRef<any>(null);
  const [inputValue, setInputValue] = useState("");
  const [initialArray, setInitialArray] = useState<number[]>([]);

  useEffect(() => {
    const sketch = (p: p5) => {
      let heap: number[] = [];
      let heapSize = 0;
      let isMinHeap = true;
      let animationState: "idle" | "inserting" | "comparing" | "swapping" | "done" | "building" = "idle";
      let animationStep = 0;
      let animationSpeed = 30;
      let frameCounter = 0;
      let currentValue: number | null = null;
      let currentIndex = -1;
      let parentIndex = -1;
      let explanationText = "";
      let buildingStep = 0;

      const nodeRadius = 30;
      const levelHeight = 80;
      const canvasWidth = 800;
      const canvasHeight = 500;

      p.setup = () => {
        p.createCanvas(canvasWidth, canvasHeight);
        p.textAlign(p.CENTER, p.CENTER);
      };

      p.draw = () => {
        p.background(240);
        p.textSize(16);
        p.fill(0);
        p.text(isMinHeap ? "Min Heap" : "Max Heap", 650, 25);
        p.textSize(14);
        p.textAlign(p.LEFT);
        p.fill(0);
        p.text(explanationText, 20, p.height - 50, p.width - 40, 40);
        p.textAlign(p.CENTER, p.CENTER);

        drawHeap();

        if (animationState !== "idle") {
          frameCounter++;
          if (frameCounter >= animationSpeed) {
            frameCounter = 0;
            nextAnimationStep();
          }
        }
      };

      function drawHeap() {
        if (heap.length === 0) return;
        const maxLevel = Math.floor(Math.log2(heap.length)) + 1;
        const xSpacing = canvasWidth / Math.pow(2, maxLevel);

        for (let i = 0; i < heapSize; i++) {
          const level = Math.floor(Math.log2(i + 1));
          const position = i + 1 - Math.pow(2, level);
          const x = canvasWidth / 2 - (Math.pow(2, level) / 2 - position - 0.5) * xSpacing * Math.pow(2, maxLevel - level);
          const y = 100 + level * levelHeight;

          if (2 * i + 1 < heapSize) {
            const childLevel = level + 1;
            const childPosition = 2 * i + 1 - Math.pow(2, childLevel) + 1;
            const childX = canvasWidth / 2 - (Math.pow(2, childLevel) / 2 - childPosition - 0.5) * xSpacing * Math.pow(2, maxLevel - childLevel);
            const childY = 100 + childLevel * levelHeight;
            p.stroke(100);
            p.line(x, y, childX, childY);
          }
          if (2 * i + 2 < heapSize) {
            const childLevel = level + 1;
            const childPosition = 2 * i + 2 - Math.pow(2, childLevel) + 1;
            const childX = canvasWidth / 2 - (Math.pow(2, childLevel) / 2 - childPosition - 0.5) * xSpacing * Math.pow(2, maxLevel - childLevel);
            const childY = 100 + childLevel * levelHeight;
            p.stroke(100);
            p.line(x, y, childX, childY);
          }

          if (i === currentIndex) {
            p.fill(255, 200, 200);
          } else if (i === parentIndex) {
            p.fill(200, 200, 255);
          } else if (animationState === "building" && i === buildingStep) {
            p.fill(255, 255, 200);
          } else {
            p.fill(255);
          }
          p.stroke(0);
          p.ellipse(x, y, nodeRadius * 2, nodeRadius * 2);
          p.noStroke();
          p.fill(0);
          p.textSize(16);
          p.text(heap[i], x, y);
          p.textSize(10);
          p.text("[" + i + "]", x, y + nodeRadius + 10);
        }

        if (animationState === "inserting" && animationStep === 0) {
          p.fill(255, 255, 200);
          const level = Math.floor(Math.log2(heapSize + 1));
          const position = heapSize - Math.pow(2, level);
          const x = canvasWidth / 2 - (Math.pow(2, level) / 2 - position - 0.5) * xSpacing * Math.pow(2, maxLevel - level);
          const y = 100 + level * levelHeight;
          p.stroke(0);
          p.ellipse(x, y, nodeRadius * 2, nodeRadius * 2);
          p.noStroke();
          p.fill(0);
          p.textSize(16);
          p.text(currentValue ?? "", x, y);
        }
      }

      function startInsertion(newValue: number) {
        if (animationState !== "idle") return;
        currentValue = newValue;
        animationState = "inserting";
        animationStep = 0;
        explanationText = "Step 1: Add the new element (" + currentValue + ") to the end of the heap.";
      }

      function nextAnimationStep() {
        if (animationState === "inserting") {
          if (animationStep === 0) {
            heap[heapSize] = currentValue!;
            currentIndex = heapSize;
            heapSize++;
            animationState = "comparing";
            animationStep = 0;
            explanationText = "Step 2: Compare the new element with its parent and sift up if needed.";
          }
        } else if (animationState === "comparing") {
          if (currentIndex > 0) {
            parentIndex = Math.floor((currentIndex - 1) / 2);
            let needSwap = false;
            if (isMinHeap) {
              needSwap = heap[currentIndex] < heap[parentIndex];
              explanationText = "Comparing " + heap[currentIndex] + " with its parent " + heap[parentIndex] + ". Since this is a min-heap, " + (needSwap ? "we need to swap because child < parent." : "no swap needed because child ≥ parent.");
            } else {
              needSwap = heap[currentIndex] > heap[parentIndex];
              explanationText = "Comparing " + heap[currentIndex] + " with its parent " + heap[parentIndex] + ". Since this is a max-heap, " + (needSwap ? "we need to swap because child > parent." : "no swap needed because child ≤ parent.");
            }
            if (needSwap) {
              animationState = "swapping";
            } else {
              animationState = "done";
              explanationText = "Insertion complete! The heap property is satisfied.";
            }
          } else {
            animationState = "done";
            explanationText = "Insertion complete! The element is at the root position.";
          }
        } else if (animationState === "swapping") {
          const temp = heap[currentIndex];
          heap[currentIndex] = heap[parentIndex];
          heap[parentIndex] = temp;
          explanationText = "Swapping " + heap[parentIndex] + " with its parent " + heap[currentIndex] + ".";
          currentIndex = parentIndex;
          animationState = "comparing";
        } else if (animationState === "done") {
          animationState = "idle";
          currentIndex = -1;
          parentIndex = -1;
        } else if (animationState === "building") {
          if (buildingStep < heap.length) {
            heapifyUp(buildingStep);
            buildingStep++;
            explanationText = `Building heap: Processing element at index ${buildingStep - 1}`;
          } else {
            animationState = "idle";
            explanationText = "Heap construction complete!";
          }
        }
      }

      function toggleHeapType() {
        if (animationState !== "idle") return;
        isMinHeap = !isMinHeap;
        const oldHeap = [...heap];
        resetHeap();
        for (let i = 0; i < oldHeap.length; i++) {
          insertToHeap(oldHeap[i]);
        }
      }

      function resetHeap() {
        heap = [];
        heapSize = 0;
        animationState = "idle";
        currentIndex = -1;
        parentIndex = -1;
        explanationText = "Heap has been reset.";
      }

      function insertToHeap(value: number) {
        heap[heapSize] = value;
        let currentIdx = heapSize++;
        while (currentIdx > 0) {
          const parentIdx = Math.floor((currentIdx - 1) / 2);
          if (
            (isMinHeap && heap[currentIdx] >= heap[parentIdx]) ||
            (!isMinHeap && heap[currentIdx] <= heap[parentIdx])
          ) {
            break;
          }
          const temp = heap[currentIdx];
          heap[currentIdx] = heap[parentIdx];
          heap[parentIdx] = temp;
          currentIdx = parentIdx;
        }
      }

      function heapifyUp(index: number) {
        let currentIdx = index;
        while (currentIdx > 0) {
          const parentIdx = Math.floor((currentIdx - 1) / 2);
          if (
            (isMinHeap && heap[currentIdx] >= heap[parentIdx]) ||
            (!isMinHeap && heap[currentIdx] <= heap[parentIdx])
          ) {
            break;
          }
          const temp = heap[currentIdx];
          heap[currentIdx] = heap[parentIdx];
          heap[parentIdx] = temp;
          currentIdx = parentIdx;
        }
      }

      function buildHeapFromArray(arr: number[]) {
        resetHeap();
        heap = [...arr];
        heapSize = arr.length;
        buildingStep = 1;
        animationState = "building";
        explanationText = "Starting heap construction from the given array.";
      }

      // Expose functions to React
      (p as any).startInsertion = startInsertion;
      (p as any).toggleHeapType = toggleHeapType;
      (p as any).resetHeap = resetHeap;
      (p as any).buildHeapFromArray = buildHeapFromArray;
    };

    const myP5 = new p5(sketch, sketchRef.current!);
    p5InstanceRef.current = myP5;
    
    return () => {
      myP5.remove();
    };
  }, []);

  const handleInsert = () => {
    const num = parseInt(inputValue);
    if (!isNaN(num) && p5InstanceRef.current?.startInsertion) {
      p5InstanceRef.current.startInsertion(num);
      setInputValue("");
    }
  };

  const handleToggleHeap = () => {
    if (p5InstanceRef.current?.toggleHeapType) {
      p5InstanceRef.current.toggleHeapType();
    }
  };

  const handleResetHeap = () => {
    if (p5InstanceRef.current?.resetHeap) {
      p5InstanceRef.current.resetHeap();
    }
  };

  const handleBuildHeap = () => {
    if (p5InstanceRef.current?.buildHeapFromArray && initialArray.length > 0) {
      p5InstanceRef.current.buildHeapFromArray(initialArray);
    }
  };

  const handleGenerateRandomArray = () => {
    const randomArray = Array.from({ length: 7 }, () => Math.floor(Math.random() * 100));
    setInitialArray(randomArray);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
  
      <div style={{ width: '100%', maxWidth: '800px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
        <input
          type="number"
          placeholder="Enter value"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: '1 1 150px', minWidth: '150px' }}
        />
        <button onClick={handleInsert} style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', background: '#007bff', color: '#fff', cursor: 'pointer' }}>
          Insert Element
        </button>
        <button onClick={handleToggleHeap} style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', background: '#28a745', color: '#fff', cursor: 'pointer' }}>
          Toggle Min/Max Heap
        </button>
        <button onClick={handleResetHeap} style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', background: '#dc3545', color: '#fff', cursor: 'pointer' }}>
          Reset Heap
        </button>
      </div>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button onClick={handleGenerateRandomArray} style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', background: '#17a2b8', color: '#fff', cursor: 'pointer' }}>
          Generate Random Array
        </button>
        <span>Initial Array: [{initialArray.join(', ')}]</span>
      </div>
      <button onClick={handleBuildHeap} style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', background: '#ffc107', color: '#000', cursor: 'pointer', marginBottom: '20px' }}>
        Build Heap from Array
      </button>
      <div ref={sketchRef} style={{ width: '100%', maxWidth: '800px', border: '1px solid #ccc', borderRadius: '5px' }} />
    </div>
  );
};

export default HeapVisualization;
