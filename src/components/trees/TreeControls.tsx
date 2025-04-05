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
    <div className="flex flex-col items-center justify-center space-y-4 w-full max-w-md mx-auto p-4 border border-gray-700 rounded-lg bg-gray-800">
      <Select
        value={treeType}
        onValueChange={(value) => setTreeType(value as TreeType)}
      >
        {/* Select Trigger: Darker bg, light text, lighter border */}
        <SelectTrigger className="w-full bg-gray-700 text-white rounded-md border border-gray-600 hover:bg-gray-600 transition-colors focus:ring-blue-500 focus:border-blue-500">
          <SelectValue placeholder="Select a tree type" />
        </SelectTrigger>
        {/* Select Content: Darker bg, light text, lighter border */}
        <SelectContent className="bg-gray-700 text-white border border-gray-600 rounded-md">
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
          className="flex-grow p-2 border border-gray-600 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors bg-gray-700 text-white placeholder-gray-400"
          placeholder="Enter a number"
        />
        {/* Buttons: Distinct action color (e.g., blue) */}
        <button
          onClick={() => handleSubmit("insert")}
          className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
        >
          Insert
        </button>
        <button
          onClick={() => handleSubmit("delete")}
          className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
        >
          Delete
        </button>
        <button
          onClick={() => handleSubmit("search")}
          className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
        >
          Search
        </button>
      </div>
    </div>
  );
};

export default TreeControls;