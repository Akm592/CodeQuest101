import React, { useState, useCallback, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { 
  PlayCircle, 
  RotateCcw, 
  Shuffle, 
  Target, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VisualizerLayout from "./Visualizer/VisualizerLayout";

const DEFAULT_ARRAY_SIZE = 15;
const MAX_VALUE = 100;
const MIN_SPEED_MS = 50;
const MAX_SPEED_MS = 1500;
const DEFAULT_SPEED_MS = 750;

const DESCRIPTION = (
  <div className="space-y-4">
    <p>
      Binary Search is an efficient algorithm for finding an item from a <strong>sorted</strong> list of items. It works by repeatedly dividing in half the portion of the list that could contain the item, until you've narrowed down the possible locations to just one.
    </p>
    <div className="space-y-2">
      <p className="font-semibold text-white">How it works:</p>
      <ul className="list-disc pl-4 space-y-1">
        <li>Set <strong>Left</strong> to 0 and <strong>Right</strong> to length - 1.</li>
        <li>Calculate <strong>Middle</strong> = floor((Left + Right) / 2).</li>
        <li>If target matches Middle, you're done!</li>
        <li>If target is less than Middle, ignore the right half.</li>
        <li>If target is greater than Middle, ignore the left half.</li>
      </ul>
    </div>
  </div>
);

const PSEUDOCODE = `function binarySearch(arr, target):
    left = 0
    right = arr.length - 1

    while left <= right:
        mid = floor((left + right) / 2)
        
        if arr[mid] == target:
            return mid // Found
        
        if arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
            
    return -1 // Not Found`;

interface BinarySearchVisualizerProps {
  onBack: () => void;
}

const BinarySearchVisualizer: React.FC<BinarySearchVisualizerProps> = ({ onBack }) => {
  const [array, setArray] = useState<number[]>([]);
  const [target, setTarget] = useState<number | string>("");
  const [targetError, setTargetError] = useState<string | null>(null);
  const [left, setLeft] = useState<number>(-1);
  const [right, setRight] = useState<number>(-1);
  const [mid, setMid] = useState<number>(-1);
  const [foundIndex, setFoundIndex] = useState<number | null>(null);
  const [searchStatus, setSearchStatus] = useState<"idle" | "running" | "found" | "not_found">("idle");
  const [speedValue, setSpeedValue] = useState(MAX_SPEED_MS + MIN_SPEED_MS - DEFAULT_SPEED_MS);
  const [customArrayInput, setCustomArrayInput] = useState<string>("");
  const [arrayError, setArrayError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const generateSortedArray = useCallback(() => {
    setIsGenerating(true);
    const newArray = Array.from({ length: DEFAULT_ARRAY_SIZE }, () =>
      Math.floor(Math.random() * MAX_VALUE)
    );
    const uniqueSortedArray = [...new Set(newArray)].sort((a, b) => a - b);
    setArray(uniqueSortedArray);
    resetSearchState();
    setTarget("");
    setTargetError(null);
    setArrayError(null);
    setTimeout(() => setIsGenerating(false), 50);
  }, []);

  useEffect(() => {
    generateSortedArray();
  }, [generateSortedArray]);

  const resetSearchState = () => {
    setLeft(-1);
    setRight(-1);
    setMid(-1);
    setFoundIndex(null);
    setSearchStatus("idle");
  };

  const calculateDelay = (sliderValue: number): number => {
     return MAX_SPEED_MS + MIN_SPEED_MS - sliderValue;
  }

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const binarySearch = useCallback(async () => {
    const currentTarget = Number(target);
    if (isNaN(currentTarget)) {
        setTargetError("Please enter a valid number to search for.");
        return;
    }
    setTargetError(null);
    setSearchStatus("running");
    setFoundIndex(null);
    let l = 0;
    let r = array.length - 1;
    setLeft(l);
    setRight(r);
    setMid(-1);

    const delay = calculateDelay(speedValue);

    await sleep(delay * 0.5);

    while (l <= r) {
      const m = Math.floor(l + (r - l) / 2);
      setMid(m);
      await sleep(delay);

      if (array[m] === currentTarget) {
        setFoundIndex(m);
        setSearchStatus("found");
        setLeft(l);
        setRight(r);
        return;
      }

      if (array[m] < currentTarget) {
        l = m + 1;
        setLeft(l);
        setRight(r);
      } else {
        r = m - 1;
        setRight(r);
        setLeft(l);
      }
       setMid(-1);
       await sleep(delay * 0.7);
    }

    setSearchStatus("not_found");
    setLeft(-1);
    setRight(-1);
    setMid(-1);
  }, [array, target, speedValue]);

  const handleCustomArrayInput = () => {
    if (searchStatus === 'running') return;
    const newArray = customArrayInput
      .split(/[\s,]+/)
      .map(Number)
      .filter((n) => !isNaN(n) && n >= 0 && n <= MAX_VALUE);

    if (newArray.length > 0 && newArray.length <= 50) {
      const uniqueSortedArray = [...new Set(newArray)].sort((a, b) => a - b);
      setArray(uniqueSortedArray);
      resetSearchState();
      setCustomArrayInput("");
      setArrayError(null);
    } else if (newArray.length > 50) {
         setArrayError("Maximum array size is 50 elements.");
    } else {
         setArrayError("Invalid input. Use comma/space-separated numbers (0-100).");
    }
  };

  const getBarClass = (index: number): string => {
    const baseClasses = "w-8 mx-0.5 relative rounded-t-lg transition-all duration-300 ease-in-out flex items-end justify-center pb-2 font-bold text-xs";
    let colorClasses = "bg-white/10 text-white/40 border border-white/5";

    if (searchStatus === 'running' || searchStatus === 'found') {
        if (index === mid) {
            colorClasses = "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(6,182,212,0.5)] scale-110 z-10 border-primary";
        } else if (index >= left && index <= right && left !== -1) {
             colorClasses = "bg-secondary/40 text-white border-secondary/50";
        } else {
             colorClasses = "bg-black/40 text-white/20 opacity-30 border-white/5";
        }
    }

    if (searchStatus === 'found' && index === foundIndex) {
         colorClasses = "bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)] scale-125 z-20 border-green-400";
    }

    return `${baseClasses} ${colorClasses}`;
  };

  const getPointerPositionClass = (pointerType: 'L' | 'R' | 'M', index: number): string => {
      const base = "absolute -top-8 text-[10px] font-bold transition-all duration-300 ease-in-out px-2 py-0.5 rounded-full";
      let color = "";

      if (pointerType === 'L' && index === left) color = "bg-blue-500/20 text-blue-400 border border-blue-500/30";
      if (pointerType === 'R' && index === right) color = "bg-red-500/20 text-red-400 border border-red-500/30";
      if (pointerType === 'M' && index === mid) color = "bg-primary/20 text-primary border border-primary/30";

       const isVisible = (searchStatus === 'running' || searchStatus === 'found') && index !== -1;
       if (!isVisible || 
           (pointerType === 'L' && index !== left) || 
           (pointerType === 'R' && index !== right) || 
           (pointerType === 'M' && index !== mid)) {
           return "hidden";
       }

       let position = "left-1/2 -translate-x-1/2";
       if (pointerType === 'L') position = "left-0";
       if (pointerType === 'R') position = "right-0";

       return `${base} ${color} ${position}`;
   };

  const controls = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
      {/* Target & Speed */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-[10px] sm:text-xs uppercase tracking-widest text-gray-500 font-bold">Target Value</Label>
          <div className="relative">
            <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            <Input
              type="number"
              value={target}
              onChange={(e) => { setTarget(e.target.value); setTargetError(null); }}
              placeholder="Enter number..."
              disabled={searchStatus === 'running'}
              className="h-10 sm:h-11 bg-white/5 border-white/10 pl-10 focus:border-primary/50 transition-all text-sm"
            />
          </div>
          {targetError && <p className="text-[10px] text-red-400">{targetError}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-[10px] sm:text-xs uppercase tracking-widest text-gray-500 font-bold">Animation Speed</Label>
            <span className="text-[10px] font-mono text-primary">{calculateDelay(speedValue)}ms</span>
          </div>
          <Slider
            value={[speedValue]}
            onValueChange={(value) => setSpeedValue(value[0])}
            min={MIN_SPEED_MS}
            max={MAX_SPEED_MS}
            step={10}
            disabled={searchStatus === 'running'}
          />
        </div>
      </div>

      {/* Main Actions */}
      <div className="flex flex-col gap-3">
        <Label className="text-[10px] sm:text-xs uppercase tracking-widest text-gray-500 font-bold">Simulation Controls</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={binarySearch}
            disabled={searchStatus === 'running' || target === "" || isGenerating}
            className="h-10 sm:h-11 bg-primary hover:bg-primary/80 text-black font-bold text-xs sm:text-sm"
          >
            {searchStatus === 'running' ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <PlayCircle className="mr-2 h-4 w-4" />}
            {searchStatus === 'running' ? "Searching" : "Start"}
          </Button>
          <Button
            onClick={resetSearchState}
            variant="outline"
            disabled={searchStatus === 'running' || searchStatus === 'idle'}
            className="h-10 sm:h-11 border-white/10 hover:bg-white/5 text-xs sm:text-sm"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
          <Button
            onClick={generateSortedArray}
            variant="outline"
            disabled={searchStatus === 'running' || isGenerating}
            className="h-10 sm:h-11 border-white/10 hover:bg-white/5 col-span-2 text-xs sm:text-sm"
          >
            <Shuffle className="mr-2 h-4 w-4" /> Generate New Array
          </Button>
        </div>
      </div>

      {/* Custom Input */}
      <div className="space-y-2 sm:col-span-2 lg:col-span-1">
        <Label className="text-[10px] sm:text-xs uppercase tracking-widest text-gray-500 font-bold">Custom Array</Label>
        <div className="flex gap-2">
          <Input
            value={customArrayInput}
            onChange={(e) => {setCustomArrayInput(e.target.value); setArrayError(null);}}
            placeholder="e.g. 10, 20, 30..."
            disabled={searchStatus === 'running' || isGenerating}
            className="h-10 sm:h-11 bg-white/5 border-white/10 text-sm"
          />
          <Button 
            onClick={handleCustomArrayInput}
            variant="secondary"
            disabled={searchStatus === 'running' || !customArrayInput.trim()}
            className="h-10 sm:h-11 px-4"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {arrayError && <p className="text-[10px] text-red-400">{arrayError}</p>}
        <p className="text-[10px] text-gray-500 italic">Sorted numbers only, max 50.</p>
      </div>
    </div>
  );

  return (
    <VisualizerLayout
      title="Binary Search"
      description={DESCRIPTION}
      controls={controls}
      onBack={onBack}
      pseudocode={PSEUDOCODE}
      complexity={{ time: "O(log n)", space: "O(1)" }}
    >
      <div className="w-full h-full max-h-[300px] sm:max-h-[400px] flex items-end justify-center gap-0.5 sm:gap-1 p-4 sm:p-8 bg-black/20 rounded-2xl sm:rounded-3xl border border-white/5 relative overflow-x-auto hide-scrollbar">
        <div className="flex items-end justify-center min-w-max h-full gap-0.5 sm:gap-1">
          {array.length > 0 ? array.map((value, index) => (
            <div
              key={index}
              className={getBarClass(index)}
              style={{ 
                height: `${Math.max((value / MAX_VALUE) * 100, 15)}%`,
                width: array.length > 25 ? '12px' : array.length > 15 ? '20px' : '32px'
              }}
            >
              <span className="text-[8px] sm:text-xs">{array.length > 20 && value > 9 ? '' : value}</span>
              <div className={getPointerPositionClass('L', index)}>L</div>
              <div className={getPointerPositionClass('R', index)}>R</div>
              <div className={getPointerPositionClass('M', index)}>M</div>
            </div>
          )) : (
            <div className="absolute inset-0 flex items-center justify-center">
               <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
            </div>
          )}
        </div>

        {/* Status Overlay */}
        <div className="absolute top-4 right-4">
           <AnimatePresence>
              {searchStatus !== "idle" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold ${
                    searchStatus === "found" ? "bg-green-500/10 border-green-500/50 text-green-400" :
                    searchStatus === "not_found" ? "bg-red-500/10 border-red-500/50 text-red-400" :
                    "bg-primary/10 border-primary/50 text-primary"
                  }`}
                >
                  {searchStatus === "found" ? <CheckCircle className="h-4 w-4" /> : 
                   searchStatus === "not_found" ? <AlertCircle className="h-4 w-4" /> : 
                   <Loader2 className="h-4 w-4 animate-spin" />}
                  {searchStatus === "found" ? `Found at index ${foundIndex}` :
                   searchStatus === "not_found" ? "Value not found" : "Searching..."}
                </motion.div>
              )}
           </AnimatePresence>
        </div>
      </div>
    </VisualizerLayout>
  );
};

export default BinarySearchVisualizer;
