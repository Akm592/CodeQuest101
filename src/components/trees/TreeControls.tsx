import React, { useState } from "react";
import { TreeType } from "./treeTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

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
    <div className="flex flex-col items-center space-y-4 w-full max-w-md">
      <Select
        value={treeType}
        onValueChange={(value) => setTreeType(value as TreeType)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a tree type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="binary">Binary Tree</SelectItem>
          <SelectItem value="bst">Binary Search Tree</SelectItem>
          <SelectItem value="avl">AVL Tree</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex w-full space-x-2">
        <input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-grow p-2 border-2 border-gray-300 rounded-md focus:border-black focus:outline-none transition-colors"
          placeholder="Enter a number"
        />
        <button
          onClick={() => handleSubmit("insert")}
          className="p-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Insert
        </button>
        <button
          onClick={() => handleSubmit("delete")}
          className="p-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Delete
        </button>
        <button
          onClick={() => handleSubmit("search")}
          className="p-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Search
        </button>
      </div>
    </div>
  );
};

export default TreeControls;
