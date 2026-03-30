import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Plus, Minus, RotateCw, Trash2, Loader2 } from "lucide-react";
import VisualizerLayout from "./Visualizer/VisualizerLayout";
import { Label } from "./ui/label";

interface ListNode {
    id: string;
    value: number;
}

const ALGO_INFO = {
  singly: {
    title: "Singly Linked List",
    description: (
      <div className="space-y-4">
        <p>A linear data structure where each element is a separate object. Each node contains data and a reference (pointer) to the next node in the sequence.</p>
        <ul className="list-disc pl-4 space-y-1 text-xs">
          <li><strong>Head:</strong> The first node in the list.</li>
          <li><strong>Tail:</strong> The last node, which points to null.</li>
          <li><strong>Traversal:</strong> Can only be done in one direction.</li>
        </ul>
      </div>
    ),
    complexity: { time: "O(n)", space: "O(n)" },
    pseudocode: `class Node:
    data: int
    next: Node

# Insertion at end
temp = new Node(val)
last = head
while last.next != null:
    last = last.next
last.next = temp`
  },
  doubly: {
    title: "Doubly Linked List",
    description: "A linked list where each node contains a reference to both the next and the previous node. This allows for bidirectional traversal.",
    complexity: { time: "O(n)", space: "O(n)" },
    pseudocode: `class Node:
    data: int
    next: Node
    prev: Node

# Deletion
node.prev.next = node.next
node.next.prev = node.prev`
  },
  circular: {
    title: "Circular Linked List",
    description: "A variation of a linked list where the last node points back to the first node, forming a circle. There is no 'null' at the end.",
    complexity: { time: "O(n)", space: "O(n)" },
    pseudocode: `while current.next != head:
    current = current.next
# last node points to head`
  }
};

interface LinkedListVisualizerProps {
  onBack: () => void;
}

const LinkedListVisualizer: React.FC<LinkedListVisualizerProps> = ({ onBack }) => {
  const [listType, setListType] = useState<"singly" | "doubly" | "circular">("singly");
  const [nodes, setNodes] = useState<ListNode[]>([]);
  const [operationStatus, setOperationStatus] = useState<"idle" | "running" | "finished">("idle");
  const [inputValue, setInputValue] = useState<string>("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string>("Ready to explore Linked Lists.");
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [prevPointerIndex, setPrevPointerIndex] = useState<number | null>(null);
  const [currentPointerIndex, setCurrentPointerIndex] = useState<number | null>(null);

  const generateId = () => Math.random().toString(36).substring(7);

  useEffect(() => {
      setNodes([
          { id: generateId(), value: 10 },
          { id: generateId(), value: 25 },
          { id: generateId(), value: 5 },
          { id: generateId(), value: 40 },
      ]);
      resetOperationState();
  }, [listType]);

  const resetOperationState = () => {
      setOperationStatus("idle");
      setHighlightedIndex(null);
      setPrevPointerIndex(null);
      setCurrentPointerIndex(null);
      setExplanation("Select an operation or modify the list.");
      setInputError(null);
  }

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleAddNode = () => {
      if (operationStatus === 'running') return;
      const value = parseInt(inputValue);
      if (isNaN(value)) {
          setInputError("Enter a valid number.");
          return;
      }
      setInputError(null);
      setNodes(prev => [...prev, { id: generateId(), value }]);
      setInputValue("");
      setExplanation(`Added ${value} to the end.`);
  }

  const handleRemoveLastNode = () => {
      if (operationStatus === 'running' || nodes.length === 0) return;
      setNodes(prev => prev.slice(0, -1));
      setExplanation("Popped last node.");
  }

  const handleDeleteNodeByIndex = async () => {
      if (operationStatus === 'running') return;
      const index = parseInt(inputValue);
      if (isNaN(index) || index < 0 || index >= nodes.length) {
          setInputError(`Index must be 0-${nodes.length - 1}`);
          return;
      }
      setInputError(null);
      setOperationStatus("running");
      setHighlightedIndex(index);
      setExplanation(`Locating node at index ${index}...`);
      await sleep(800);
      setNodes(prev => prev.filter((_, i) => i !== index));
      setExplanation(`Deleted node at index ${index}.`);
      await sleep(500);
      resetOperationState();
      setInputValue("");
  }

  const handleReverseList = async () => {
       if (operationStatus === 'running' || nodes.length < 2) return;
       setOperationStatus("running");
       setExplanation("Starting iterative reversal...");
       await sleep(800);

       for(let i = 0; i < nodes.length; i++) {
           setPrevPointerIndex(i === 0 ? null : i - 1);
           setCurrentPointerIndex(i);
           setHighlightedIndex(i);
           setExplanation(`Reversing pointer at node ${nodes[i].value}...`);
           await sleep(1000);
       }

       setNodes(prev => [...prev].reverse());
       setExplanation("List reversed!");
       await sleep(1000);
       resetOperationState();
  }

  const controls = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
      {/* Configuration */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-gray-500 font-bold">List Type</Label>
          <Select onValueChange={(value: "singly" | "doubly" | "circular") => setListType(value)} value={listType} disabled={operationStatus === 'running'}>
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-950 border-white/10">
              <SelectItem value="singly">Singly Linked</SelectItem>
              <SelectItem value="doubly">Doubly Linked</SelectItem>
              <SelectItem value="circular">Circular Linked</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-gray-500 font-bold">New Node Value</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); setInputError(null); }}
              placeholder="Value..."
              className="bg-white/5 border-white/10"
              disabled={operationStatus === 'running'}
            />
            <Button onClick={handleAddNode} disabled={operationStatus === 'running' || !inputValue} className="bg-primary text-black font-bold">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {inputError && <p className="text-[10px] text-red-400">{inputError}</p>}
        </div>
      </div>

      {/* Main Operations */}
      <div className="flex flex-col gap-3">
        <Label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Operations</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={handleReverseList} disabled={operationStatus === 'running' || nodes.length < 2} className="bg-secondary hover:bg-secondary/80 text-white font-bold col-span-2">
            <RotateCw className="mr-2 h-4 w-4" /> Reverse List
          </Button>
          <Button onClick={handleRemoveLastNode} variant="outline" disabled={operationStatus === 'running' || nodes.length === 0} className="border-white/10 hover:bg-white/5">
            <Minus className="mr-2 h-4 w-4" /> Pop Last
          </Button>
          <Button onClick={handleDeleteNodeByIndex} variant="outline" disabled={operationStatus === 'running' || !inputValue || nodes.length === 0} className="border-white/10 hover:bg-red-500/10 hover:text-red-400">
            <Trash2 className="mr-2 h-4 w-4" /> Delete Index
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3">
         <Label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Legend</Label>
         <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
               <div className="w-3 h-3 rounded-full bg-primary" /> Active
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
               <div className="w-3 h-3 rounded-full bg-secondary" /> Current (C)
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
               <div className="w-3 h-3 rounded-full bg-blue-500" /> Previous (P)
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
               <div className="w-3 h-3 rounded-full bg-red-500" /> Deleting
            </div>
         </div>
      </div>
    </div>
  );

  const currentInfo = ALGO_INFO[listType];

  return (
    <VisualizerLayout
      title={currentInfo.title}
      description={currentInfo.description}
      controls={controls}
      onBack={onBack}
      pseudocode={currentInfo.pseudocode}
      complexity={currentInfo.complexity}
    >
      <div className="w-full max-w-5xl h-80 glass-panel rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="flex items-center justify-center gap-12 flex-wrap">
           <AnimatePresence mode="popLayout">
              {nodes.map((node, index) => {
                const isHighlighted = index === highlightedIndex;
                const isPrev = index === prevPointerIndex;
                const isCurrent = index === currentPointerIndex;

                return (
                  <motion.div
                    key={node.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                    className="relative flex items-center"
                  >
                    {/* The Node */}
                    <div className={`
                      w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-lg transition-all duration-300 border-2
                      ${isHighlighted ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' :
                        isCurrent ? 'bg-secondary/20 border-secondary text-secondary shadow-[0_0_20px_rgba(139,92,246,0.3)]' :
                        isPrev ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]' :
                        'bg-white/5 border-white/10 text-white'}
                    `}>
                      {node.value}
                      
                      {/* Pointers Labels */}
                      <AnimatePresence>
                        {isCurrent && (
                          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute -top-8 text-[10px] text-secondary font-black">CURRENT</motion.div>
                        )}
                        {isPrev && (
                          <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute -bottom-8 text-[10px] text-blue-400 font-black">PREV</motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Arrow to Next */}
                    {index < nodes.length - 1 && (
                      <div className="w-12 h-0.5 bg-gradient-to-r from-white/20 to-transparent relative mx-2">
                         <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-white/20 rotate-45" />
                         {listType === 'doubly' && (
                           <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 border-b-2 border-l-2 border-white/20 rotate-45" />
                         )}
                      </div>
                    )}

                    {/* Circular Pointer */}
                    {listType === 'circular' && index === nodes.length - 1 && nodes.length > 0 && (
                      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[calc(100%*3)] h-10 border-b-2 border-x-2 border-dashed border-white/10 rounded-b-3xl flex items-center justify-center">
                         <span className="text-[8px] text-gray-600 uppercase tracking-widest font-bold">Circular Link</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
           </AnimatePresence>
        </div>

        {/* Status Overlay */}
        <div className="absolute bottom-6 px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
           <p className="text-xs font-mono text-primary flex items-center gap-2">
              {operationStatus === 'running' && <Loader2 className="h-3 w-3 animate-spin" />}
              {explanation}
           </p>
        </div>
      </div>
    </VisualizerLayout>
  );
};

export default LinkedListVisualizer;
