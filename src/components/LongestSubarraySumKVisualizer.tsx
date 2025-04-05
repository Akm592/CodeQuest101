import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"; // Adjust path
import { Button } from "./ui/button"; // Adjust path
import { Input } from "./ui/input"; // Adjust path
import { Slider } from "./ui/slider"; // Adjust path
import { PlayCircle, PauseCircle, RotateCcw, Loader2, CheckCircle, XCircle, Target } from "lucide-react"; // Added icons

const MIN_SPEED_MS = 100;
const MAX_SPEED_MS = 2000;
const DEFAULT_SPEED_MS = 1000;

const LongestSubarraySumKVisualizer = () => {
  const [arr, setArr] = useState<number[]>([10, 5, 2, 7, 1, 9]);
  const [arrInput, setArrInput] = useState<string>("10, 5, 2, 7, 1, 9"); // Separate state for input
  const [k, setK] = useState<number | string>(15);
  const [kInput, setKInput] = useState<string>("15"); // Separate state for input
  const [left, setLeft] = useState<number>(-1); // Start at -1 to indicate not started
  const [right, setRight] = useState<number>(-1);
  const [currentSum, setCurrentSum] = useState<number>(0);
  const [maxLength, setMaxLength] = useState<number>(0);
  const [resultIndices, setResultIndices] = useState<{ start: number; end: number } | null>(null); // Store best range {start, end} inclusive
  const [status, setStatus] = useState<"idle" | "running" | "paused" | "finished">("idle");
  const [speedValue, setSpeedValue] = useState(MAX_SPEED_MS + MIN_SPEED_MS - DEFAULT_SPEED_MS);
  const [inputError, setInputError] = useState<string | null>(null);
  const [operationLog, setOperationLog] = useState<string>("Enter array and target sum K.");

  const calculateDelay = (sliderValue: number): number => {
    return MAX_SPEED_MS + MIN_SPEED_MS - sliderValue;
  }

  const reset = useCallback(() => {
    setLeft(-1);
    setRight(-1);
    setCurrentSum(0);
    setMaxLength(0);
    setResultIndices(null);
    setStatus("idle");
    setInputError(null);
    setOperationLog("Ready. Click 'Start' to find the longest subarray.");
  }, []);

  // Reset when array or k changes via input
  useEffect(() => {
     reset();
  }, [arr, k, reset]);

  // The core algorithm step logic
  const performStep = useCallback(() => {
      let l = left === -1 ? 0 : left; // Initialize if first step
      let r = right === -1 ? 0 : right;
      let sum = currentSum;
      let maxLen = maxLength;
      let bestStart = resultIndices?.start ?? -1;
      let bestEnd = resultIndices?.end ?? -1;
      let log = "";

      if (r < arr.length) {
          // Expand window by moving right pointer
          sum += arr[r];
          log = `Window expands right: [${l}...${r}]. Added ${arr[r]}. New Sum: ${sum}.`;
          r++; // Increment right pointer for the next state

          // Shrink window if sum exceeds k
          while (sum > Number(k) && l < r) {
              sum -= arr[l];
              log += ` Sum > K. Shrink left: Remove ${arr[l]}. New Sum: ${sum}.`;
              l++; // Increment left pointer
          }

          // Check if current window sum equals k
          if (sum === Number(k)) {
              const currentLength = r - l;
              log += ` Sum === K. Current length: ${currentLength}.`;
              if (currentLength > maxLen) {
                  maxLen = currentLength;
                  bestStart = l;
                  bestEnd = r - 1; // r is exclusive (points to next element)
                  log += ` New Max Length found: ${maxLen}.`;
                  setResultIndices({ start: bestStart, end: bestEnd });
              }
          }

          // Update state for next iteration
          setCurrentSum(sum);
          setLeft(l);
          setRight(r);
          setMaxLength(maxLen);
          setOperationLog(log);

      } else {
          // Right pointer reached the end
          setStatus("finished");
          if (resultIndices) {
               setOperationLog(`Finished. Longest subarray found with length ${maxLen} from index ${resultIndices.start} to ${resultIndices.end}.`);
          } else {
               setOperationLog(`Finished. No subarray found with sum ${k}. Max Length: 0.`);
          }
      }

  }, [left, right, currentSum, maxLength, resultIndices, arr, k]);


  // Animation control using useEffect
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (status === "running") {
      const delay = calculateDelay(speedValue);
      timer = setTimeout(() => {
        performStep();
      }, delay);
    }
    return () => clearTimeout(timer);
  }, [status, speedValue, performStep]);

  const handleStartPause = () => {
      if (status === "idle" || status === "finished") {
           // Validate inputs before starting
           const kNum = Number(k);
           if (isNaN(kNum)) {
                setInputError("Target sum K must be a valid number.");
                return;
           }
           if (arr.length === 0) {
                setInputError("Array cannot be empty.");
                return;
           }
            setInputError(null);
            reset(); // Reset state before starting/restarting
            setStatus("running");
            // Initialize pointers for the first step
            setLeft(0);
            setRight(0);
            setCurrentSum(0);
            setOperationLog("Algorithm started. Expanding window...");
      } else if (status === "running") {
        setStatus("paused");
        setOperationLog("Paused.");
      } else if (status === "paused") {
        setStatus("running");
         setOperationLog("Resumed.");
      }
  };

  const handleArrInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setArrInput(e.target.value);
       // Basic validation while typing (optional)
      const nums = e.target.value.split(/[\s,]+/).filter(Boolean).map(Number);
      if (nums.some(isNaN)) {
          setInputError("Array contains non-numeric values.");
      } else {
          setInputError(null);
          // Update the actual array state used by the algorithm
          setArr(nums);
          // Resetting happens via useEffect on `arr` change
      }
  }

   const handleKInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       setKInput(e.target.value);
       const num = Number(e.target.value);
        if (e.target.value === "" || isNaN(num)) {
            setInputError("Target K must be a number.");
        } else {
             setInputError(null);
             setK(num);
              // Resetting happens via useEffect on `k` change
        }
   }

   // --- Rendering ---
   const getCellClass = (index: number): string => {
       let baseClass = "w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border rounded text-xs sm:text-sm font-medium transition-all duration-200 ease-in-out";
       let colorClass = "bg-gray-800 border-gray-600 text-gray-400"; // Default

       // Current window highlight
       if (status !== "idle" && status !== "finished" && index >= left && index < right && left !== -1 && right !== -1) {
           colorClass = "bg-gray-700 border-teal-500 text-gray-100 ring-1 ring-teal-500/50";
       }

        // Highlight the best found subarray when finished
        if (status === "finished" && resultIndices && index >= resultIndices.start && index <= resultIndices.end) {
             colorClass = "bg-green-800/50 border-green-500 text-green-300 ring-1 ring-green-500/50";
        }

        // Pointer indicators (can use borders or pseudo-elements)
        if (index === left && left !== -1) baseClass += " border-l-blue-400 border-l-2";
        if (index === right - 1 && right > left && right !== -1) baseClass += " border-r-red-400 border-r-2"; // Right pointer is exclusive

       return `${baseClass} ${colorClass}`;
   }


  return (
    // Dark theme page container
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-black p-4 text-gray-300">
      {/* Dark Card */}
      <Card className="w-full max-w-4xl mx-auto bg-gray-900 border border-gray-700/50 shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="bg-gray-800 border-b border-gray-700/50 text-gray-100 p-4 sm:p-5">
          <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-center">
            Longest Subarray with Sum K
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-5">
          {/* Input Section */}
          <div className="space-y-3">
             <div className="space-y-1">
                 <label htmlFor="arrayInput" className="text-sm font-medium text-gray-400">Array (comma/space-separated numbers):</label>
                 <Input
                    id="arrayInput"
                    type="text"
                    value={arrInput}
                    onChange={handleArrInputChange}
                    placeholder="e.g., 10, 5, 2, 7, 1, 9"
                    disabled={status === 'running' || status === 'paused'}
                    className="h-10 bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500 disabled:opacity-70 font-mono text-sm"
                  />
             </div>
            <div className="flex flex-col sm:flex-row gap-4">
               <div className="w-full sm:w-1/2 space-y-1">
                    <label htmlFor="kInput" className="text-sm font-medium text-gray-400">Target Sum (K):</label>
                    <div className="relative">
                         <Target className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                         <Input
                             id="kInput"
                            type="number" // Keep type number for better mobile input
                            value={kInput}
                            onChange={handleKInputChange}
                            placeholder="Enter K"
                             disabled={status === 'running' || status === 'paused'}
                            className="h-10 pl-9 bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500 disabled:opacity-70"
                          />
                    </div>
               </div>
               {/* Speed Control */}
               <div className="w-full sm:w-1/2 flex flex-col justify-center space-y-1 pt-2 sm:pt-0">
                   <label className="text-sm font-medium text-gray-400 text-center sm:text-left">Animation Speed:</label>
                    <div className="flex items-center gap-3">
                         <Slider
                            value={[speedValue]}
                            onValueChange={(value) => setSpeedValue(value[0])}
                            min={MIN_SPEED_MS}
                            max={MAX_SPEED_MS}
                            step={50}
                             className="flex-grow [&>span:first-child]:h-2 [&>span>span]:bg-teal-500 [&>span:first-child]:bg-gray-700"
                            disabled={status === 'running' || status === 'paused'}
                            aria-label="Animation Speed Control"
                        />
                        <span className="text-xs font-mono text-gray-500 w-14 text-right">
                          {`${calculateDelay(speedValue)} ms`}
                        </span>
                    </div>
               </div>
            </div>
            {inputError && <p className="text-xs text-red-400 mt-1">{inputError}</p>}
          </div>

           {/* Control Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4 border-t border-gray-700/50">
            <Button
              onClick={handleStartPause}
              disabled={arr.length === 0 || k === "" || inputError !== null} // Disable if inputs are invalid
               className={`flex items-center justify-center gap-2 font-semibold w-full sm:w-auto px-6 py-2.5 disabled:opacity-60 ${
                    status === 'running' ? 'bg-yellow-600 hover:bg-yellow-700'
                    : status === 'paused' ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-teal-600 hover:bg-teal-700'
               } text-white`}
            >
              {status === 'running' ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
              <span>{status === 'running' ? "Pause" : status === 'paused' ? "Resume" : status === 'finished' ? "Restart" : "Start"}</span>
            </Button>
            <Button
              onClick={reset}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold w-full sm:w-auto px-6 py-2.5 disabled:opacity-60"
              disabled={status === 'idle' && left === -1} // Disable if already reset
            >
              <RotateCcw size={18} />
              <span>Reset</span>
            </Button>
          </div>

           {/* Visualization Area */}
          <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 p-2 bg-black/20 rounded border border-gray-700/50 min-h-[60px]">
            {arr.length > 0 ? arr.map((num, index) => (
              <div key={index} className={getCellClass(index)}>
                {num}
              </div>
            )) : <p className="text-gray-500 text-sm">Enter array data above.</p>}
          </div>

           {/* Status/Result Display */}
          <div className="text-center space-y-1 pt-3">
             <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
                <span>Current Sum: <span className="font-bold text-teal-400 font-mono">{currentSum}</span></span>
                <span>Max Length: <span className="font-bold text-yellow-400 font-mono">{maxLength}</span></span>
                <span>Target (K): <span className="font-bold text-gray-200 font-mono">{k}</span></span>
                <span>L Index: <span className={`font-bold font-mono ${left !== -1 ? 'text-blue-400' : 'text-gray-500'}`}>{left !== -1 ? left : '-'}</span></span>
                <span>R Index: <span className={`font-bold font-mono ${right !== -1 ? 'text-red-400' : 'text-gray-500'}`}>{right !== -1 ? right : '-'}</span></span>
            </div>
             {/* Final Result */}
            {status === 'finished' && (
              <div className={`font-semibold mt-3 text-base flex items-center justify-center gap-2 ${resultIndices ? 'text-green-400' : 'text-red-400'}`}>
                {resultIndices ? (
                     <>
                        <CheckCircle size={18}/>
                        Longest subarray found: [{arr.slice(resultIndices.start, resultIndices.end + 1).join(", ")}] (Length: {maxLength})
                     </>
                 ) : (
                     <>
                         <XCircle size={18} />
                        No subarray found with sum {k}.
                     </>
                 )}
              </div>
            )}
             {/* Operation Log */}
             <div className="mt-2 pt-2 border-t border-gray-700/50">
                 <p className="text-xs text-gray-400 font-mono break-words min-h-[18px]">{operationLog}</p>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LongestSubarraySumKVisualizer;