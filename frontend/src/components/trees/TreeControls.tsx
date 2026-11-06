// TreeControls.tsx
// **MODIFIED**: Adjusted colors for dark theme
import React, { useState } from "react";
import { TreeType } from "./treeTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"; // Assuming path is correct

interface TreeControlsProps {
  treeType: TreeType;
  setTreeType: (type: TreeType) => void;
  handleOperation: (op: "insert" | "delete" | "search", val: number) => void;
}

const TreeControls: React.FC<TreeControlsProps> = ({
  treeType,
  setTreeType,
  handleOperation,
}) => {
  const [inputValue, setInputValue] = useState<string>("");

  const handleSubmit = (op: "insert" | "delete" | "search") => {
    const val = parseInt(inputValue);
    if (!isNaN(val)) {
      handleOperation(op, val);
      setInputValue("");
    }
  };

  return (
    // Container: Dark background, lighter border
    <div className="flex flex-col items-center justify-center space-y-4 w-full max-w-md mx-auto p-4 border border-border rounded-lg bg-muted text-foreground">
      <Select
        value={treeType}
        onValueChange={(value) => setTreeType(value as TreeType)}
      >
        {/* Select Trigger: Darker bg, light text, lighter border */}
        <SelectTrigger className="w-full bg-muted text-white rounded-md border border-border hover:bg-muted/70 transition-colors focus:ring-blue-500 focus:border-viz-pointer">
          <SelectValue placeholder="Select a tree type" />
        </SelectTrigger>
        {/* Select Content: Darker bg, light text, lighter border */}
        <SelectContent className="bg-muted text-white border border-border rounded-md">
          <SelectItem value="binary">Binary Tree</SelectItem>
          <SelectItem value="bst">Binary Search Tree</SelectItem>
          <SelectItem value="avl">AVL Tree</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex w-full space-x-2 items-center">
        {/* Input: Dark bg, light text, lighter border, adjusted focus */}
        <input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-grow p-2 border border-border rounded-md focus:border-primary/60 focus:ring-2 focus:ring-primary/25 focus:outline-none transition-colors bg-muted text-foreground placeholder:text-muted-foreground"
          placeholder="Enter a number"
        />
        {/* Buttons: Distinct action color (e.g., blue) */}
        <button
          onClick={() => handleSubmit("insert")}
          className="min-h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Insert
        </button>
        <button
          onClick={() => handleSubmit("delete")}
          className="glass-pill glass-hover min-h-10 !rounded-md px-4 text-sm font-medium text-destructive-bright"
        >
          Delete
        </button>
        <button
          onClick={() => handleSubmit("search")}
          className="glass-pill glass-hover min-h-10 !rounded-md px-4 text-sm font-medium text-foreground"
        >
          Search
        </button>
      </div>
    </div>
  );
};

export default TreeControls;