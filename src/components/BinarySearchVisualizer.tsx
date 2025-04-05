import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"; // Adjust path
import { Button } from "./ui/button"; // Adjust path
import { Input } from "./ui/input"; // Adjust path
import { Slider } from "./ui/slider"; // Adjust path
import { Label } from "./ui/label"; // Adjust path
import { PlayCircle, RotateCcw, Shuffle, Target, Loader2, AlertCircle, CheckCircle } from "lucide-react"; // Added icons

const DEFAULT_ARRAY_SIZE = 15;
const MAX_VALUE = 100;
const MIN_SPEED_MS = 50;
const MAX_SPEED_MS = 1500;
const DEFAULT_SPEED_MS = 750;

const BinarySearchVisualizer: React.FC = () => {
  const [array, setArray] = useState<number[]>([]);
  const [target, setTarget] = useState<number | string>(""); // Allow empty string initially
  const [targetError, setTargetError] = useState<string | null>(null);
  const [left, setLeft] = useState<number>(-1); // Use -1 to indicate not started/finished
  const [right, setRight] = useState<number>(-1);
  const [mid, setMid] = useState<number>(-1);
  const [foundIndex, setFoundIndex] = useState<number | null>(null); // Store index if found
  const [searchStatus, setSearchStatus] = useState<"idle" | "running" | "found" | "not_found">("idle");
  const [speedValue, setSpeedValue] = useState(MAX_SPEED_MS + MIN_SPEED_MS - DEFAULT_SPEED_MS); // Slider maps inversely
  const [customArrayInput, setCustomArrayInput] = useState<string>("");
  const [arrayError, setArrayError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const generateSortedArray = useCallback(() => {
    setIsGenerating(true);
    const newArray = Array.from({ length: DEFAULT_ARRAY_SIZE }, () =>
      Math.floor(Math.random() * MAX_VALUE)
    );
    // Ensure uniqueness for better visualization, then sort
    const uniqueSortedArray = [...new Set(newArray)].sort((a, b) => a - b);
    setArray(uniqueSortedArray);
    resetSearchState();
    setTarget(""); // Clear target when generating new array
    setTargetError(null);
    setArrayError(null);
    setTimeout(() => setIsGenerating(false), 50); // Short delay for feedback
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
    setMid(-1); // Reset mid initially

    const delay = calculateDelay(speedValue);

    await sleep(delay * 0.5); // Initial pause to show L and R

    while (l <= r) {
      const m = Math.floor(l + (r - l) / 2); // More robust mid calculation
      setMid(m);
      await sleep(delay);

      if (array[m] === currentTarget) {
        setFoundIndex(m);
        setSearchStatus("found");
        setLeft(l); // Keep L/R for context
        setRight(r);
        return;
      }

      if (array[m] < currentTarget) {
        l = m + 1;
        setLeft(l); // Update left pointer immediately
        setRight(r); // Keep right pointer
      } else {
        r = m - 1;
        setRight(r); // Update right pointer immediately
        setLeft(l); // Keep left pointer
      }
       setMid(-1); // Clear mid highlight before next iteration's sleep
       await sleep(delay * 0.7); // Pause after pointer adjustment
    }

    // Target not found
    setSearchStatus("not_found");
    setLeft(-1); // Clear pointers
    setRight(-1);
    setMid(-1);

  }, [array, target, speedValue]);

  const handleCustomArrayInput = () => {
    if (searchStatus === 'running') return;
    const newArray = customArrayInput
      .split(/[\s,]+/)
      .map(Number)
      .filter((n) => !isNaN(n) && n >= 0 && n <= MAX_VALUE); // Validate numbers

    if (newArray.length > 0 && newArray.length <= 50) { // Add size limit
      const uniqueSortedArray = [...new Set(newArray)].sort((a, b) => a - b);
      setArray(uniqueSortedArray);
      resetSearchState();
      setCustomArrayInput(""); // Clear input
      setArrayError(null);
    } else if (newArray.length > 50) {
         setArrayError("Maximum array size is 50 elements.");
    } else {
         setArrayError("Invalid input. Use comma/space-separated numbers (0-100).");
    }
  };

   const getBarClass = (index: number): string => {
    let baseClasses = "w-6 sm:w-7 md:w-8 mx-px sm:mx-0.5 relative rounded-t transition-all duration-200 ease-in-out flex items-end justify-center pb-1";
    let colorClasses = "bg-gradient-to-t from-gray-600 to-gray-500 text-gray-900"; // Default

    if (searchStatus === 'running' || searchStatus === 'found') {
        if (index === mid) {
            colorClasses = "bg-teal-500 text-white shadow-lg scale-105 z-10"; // Middle element
        } else if (index >= left && index <= right && left !== -1) {
             colorClasses = "bg-gray-500 text-gray-900"; // Active search range
        } else {
             colorClasses = "bg-gray-800 text-gray-500 opacity-60"; // Outside search range
        }
    }

    if (searchStatus === 'found' && index === foundIndex) {
         colorClasses = "bg-green-500 text-white shadow-lg scale-110 z-20 ring-2 ring-green-300"; // Found element
    }

    return `${baseClasses} ${colorClasses}`;
  };

   const getPointerPositionClass = (pointerType: 'L' | 'R' | 'M', index: number): string => {
      let base = "absolute -top-5 text-xs font-bold transition-all duration-300 ease-in-out";
      let color = "text-gray-400"; // Default pointer color

      if (pointerType === 'L' && index === left) color = "text-blue-400";
      if (pointerType === 'R' && index === right) color = "text-red-400";
      if (pointerType === 'M' && index === mid) color = "text-teal-300";

      // Position adjustments
      if (pointerType === 'L') base += " left-0";
      if (pointerType === 'R') base += " right-0";
      if (pointerType === 'M') base += " left-1/2 -translate-x-1/2";

       // Hide if index is -1 or status is idle/not_found
       const isVisible = searchStatus === 'running' || searchStatus === 'found';
       if (!isVisible || index === -1) {
           return `${base} ${color} opacity-0`;
       }

       return `${base} ${color} opacity-100`;
   };


  return (
    // Dark background for the page
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-black p-4 text-gray-300">
      {/* Dark Card */}
      <Card className="w-full max-w-4xl mx-auto bg-gray-900 border border-gray-700/50 shadow-xl rounded-lg overflow-hidden">
        {/* Dark Header */}
        <CardHeader className="bg-gray-800 border-b border-gray-700/50 text-gray-100 p-4 sm:p-5">
          <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-center">
            Binary Search Visualizer
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-5">
          {/* Controls Row 1: Target Input and Main Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
             {/* Target Input */}
             <div className="w-full sm:w-auto space-y-1">
                 <Label htmlFor="targetInput" className="text-sm font-medium text-gray-400">Target Value:</Label>
                 <div className="relative w-full sm:w-40">
                     <Target className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                     <Input
                        id="targetInput"
                        type="number"
                        value={target}
                        onChange={(e) => { setTarget(e.target.value); setTargetError(null); }}
                        placeholder="Number"
                        disabled={searchStatus === 'running'}
                        className="h-10 pl-9 bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500 disabled:opacity-70"
                      />
                 </div>
                  {targetError && <p className="text-xs text-red-400 mt-1">{targetError}</p>}
             </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                onClick={binarySearch}
                disabled={searchStatus === 'running' || target === "" || isGenerating}
                 className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 disabled:opacity-60"
              >
                {searchStatus === 'running' ? <Loader2 size={18} className="animate-spin" /> : <PlayCircle size={18} />}
                <span>{searchStatus === 'running' ? "Searching..." : "Start Search"}</span>
              </Button>
              <Button
                onClick={() => resetSearchState()}
                disabled={searchStatus === 'running' || searchStatus === 'idle'}
                 className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-gray-200 font-medium px-4 py-2 disabled:opacity-60"
              >
                <RotateCcw size={18} />
                <span>Reset</span>
              </Button>
              <Button
                onClick={generateSortedArray}
                disabled={searchStatus === 'running' || isGenerating}
                 className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-gray-200 font-medium px-4 py-2 disabled:opacity-60"
              >
                 {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Shuffle size={18} />}
                <span>New Array</span>
              </Button>
            </div>
          </div>

          {/* Controls Row 2: Speed Slider */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pt-3">
            <span className="text-sm font-medium text-gray-400 shrink-0">
              Animation Speed:
            </span>
            <Slider
              value={[speedValue]}
              onValueChange={(value) => setSpeedValue(value[0])}
              min={MIN_SPEED_MS}
              max={MAX_SPEED_MS}
              step={10}
              className="flex-grow [&>span:first-child]:h-2 [&>span>span]:bg-teal-500 [&>span:first-child]:bg-gray-700"
              disabled={searchStatus === 'running'}
              aria-label="Animation Speed Control"
            />
            <span className="text-xs font-mono text-gray-500 w-16 text-right">
              {`${calculateDelay(speedValue)} ms`}
            </span>
          </div>

           {/* Controls Row 3: Custom Array */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-gray-700/50">
            <div className="w-full space-y-1">
                 <Input
                    value={customArrayInput}
                    onChange={(e) => {setCustomArrayInput(e.target.value); setArrayError(null);}}
                    placeholder="Custom sorted array (e.g., 10, 25, 40, 55)"
                     disabled={searchStatus === 'running' || isGenerating}
                    className="h-10 bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500 disabled:opacity-70"
                />
                 {arrayError && <p className="text-xs text-red-400 mt-1">{arrayError}</p>}
            </div>
            <Button
              onClick={handleCustomArrayInput}
              disabled={searchStatus === 'running' || isGenerating || !customArrayInput.trim()}
              className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm px-4 h-10 disabled:opacity-60 shrink-0"
            >
              Set Custom Array
            </Button>
          </div>

           {/* Visualization Area */}
          <div className="h-48 sm:h-56 md:h-64 flex items-end justify-center gap-px sm:gap-0.5 p-2 bg-black/20 rounded border border-gray-700/50 overflow-hidden relative mt-4">
             {array.length > 0 ? array.map((value, index) => (
                <div
                    key={index}
                    className={getBarClass(index)}
                     // Calculate height relative to the MAX_VALUE for consistency
                    style={{ height: `${Math.max((value / MAX_VALUE) * 100, 5)}%` }} // Ensure min height
                    title={`Value: ${value} Index: ${index}`}
                >
                    <span className="text-xs font-semibold writing-mode-vertical-rl rotate-180 sm:writing-mode-horizontal sm:rotate-0 sm:mt-1">
                         {/* Show value only if bar is tall enough */}
                         {(value / MAX_VALUE) * 100 > 15 ? value : ''}
                    </span>
                     {/* Pointers */}
                     <div className={getPointerPositionClass('L', index)}>L</div>
                     <div className={getPointerPositionClass('R', index)}>R</div>
                     <div className={getPointerPositionClass('M', index)}>M</div>
                </div>
                )) : (
                     <p className="absolute inset-0 flex items-center justify-center text-gray-500">Array is empty or not loaded.</p>
                )}
            </div>

          {/* Result Display */}
          <div className="text-center font-medium text-sm min-h-[24px] pt-2">
            {searchStatus === 'found' && foundIndex !== null && (
              <span className="flex items-center justify-center gap-2 text-green-400">
                 <CheckCircle size={16}/> Target {target} found at index {foundIndex}!
              </span>
            )}
            {searchStatus === 'not_found' && (
              <span className="flex items-center justify-center gap-2 text-red-400">
                <AlertCircle size={16}/> Target {target} not found in the array.
              </span>
            )}
             {searchStatus === 'running' && (
                 <span className="flex items-center justify-center gap-2 text-yellow-400">
                     <Loader2 size={16} className="animate-spin"/> Searching...
                 </span>
             )}
             {searchStatus === 'idle' && targetError && (
                 <span className="flex items-center justify-center gap-2 text-red-400">
                    <AlertCircle size={16}/> {targetError}
                 </span>
             )}
             {searchStatus === 'idle' && !targetError && (
                  <span className="text-gray-500">Enter a target value and click 'Start Search'.</span>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BinarySearchVisualizer;