import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Hash, GitMerge, FolderPlus } from "lucide-react";
import { HashMap } from "./hashMaps/hashMapLogic";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Input } from "./ui/input";

const hashFunctions = {
  simpleModulo: (key: string, capacity: number) => key.length % capacity,
  sumChars: (key: string, capacity: number) =>
    key.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % capacity,
};

const collisionMethods = {
  linearProbing: "Linear Probing",
  chainingWithLinkedLists: "Chaining with Linked Lists",
};

const HashMapVisualizer: React.FC = () => {
  const [hashMap, setHashMap] = useState<HashMap>(new HashMap());
  const [inputKey, setInputKey] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");
  const [animation, setAnimation] = useState<any>(null);
  const [selectedHashFunction, setSelectedHashFunction] =
    useState<keyof typeof hashFunctions>("simpleModulo");
  const [selectedCollisionMethod, setSelectedCollisionMethod] = useState<
    keyof typeof collisionMethods
  >("chainingWithLinkedLists");
  const [pseudocode, setPseudocode] = useState<string[]>([]);
  const [explanation, setExplanation] = useState<string>("");
  const [isAutoFilling, setIsAutoFilling] = useState<boolean>(false);
  const [currentAutoFillStep, setCurrentAutoFillStep] = useState<number>(0);

  useEffect(() => {
    if (animation) {
      const timer = setTimeout(() => setAnimation(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [animation]);

  const updatePseudocode = (operation: string, key: string, value?: string) => {
    let code: string[];
    switch (operation) {
      case "insert":
        code = [
          `index = hash(${key})`,
          `if bucket[index] is empty:`,
          `  bucket[index] = [(${key}, ${value})]`,
          `else:`,
          `  bucket[index].append((${key}, ${value}))`,
        ];
        break;
      case "delete":
        code = [
          `index = hash(${key})`,
          `for item in bucket[index]:`,
          `  if item.key == ${key}:`,
          `    remove item from bucket[index]`,
          `    return true`,
          `return false`,
        ];
        break;
      default:
        code = [];
    }
    setPseudocode(code);
  };

  const handleInsert = (key: string, value: string) => {
    const newHashMap = new HashMap();
    Object.assign(newHashMap, hashMap);
    newHashMap.set(key, value);
    setHashMap(newHashMap);
    setAnimation({
      key: key,
      type: "insert",
      index: newHashMap.hash(key),
    });
    updatePseudocode("insert", key, value);
    setExplanation(
      `Inserting key "${key}" with value "${value}". Hash function calculated index ${newHashMap.hash(
        key
      )}.`
    );
    setInputKey("");
    setInputValue("");
  };

  const handleDelete = (key: string) => {
    const newHashMap = new HashMap();
    Object.assign(newHashMap, hashMap);
    newHashMap.delete(key);
    setHashMap(newHashMap);
    setAnimation({
      key,
      type: "delete",
      index: newHashMap.hash(key),
    });
    updatePseudocode("delete", key);
    setExplanation(
      `Deleting key "${key}". Hash function calculated index ${newHashMap.hash(
        key
      )}.`
    );
  };

  const handleAutoFill = async () => {
    setIsAutoFilling(true);
    setCurrentAutoFillStep(0);
    const items = [
      ["apple", "red"],
      ["banana", "yellow"],
      ["cherry", "red"],
      ["date", "brown"],
      ["elderberry", "purple"],
      ["fig", "purple"],
      ["grape", "purple"],
      ["honeydew", "green"],
      ["kiwi", "brown"],
      ["lemon", "yellow"],
    ];

    for (let i = 0; i < items.length; i++) {
      const [key, value] = items[i];
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          handleInsert(key, value);
          setCurrentAutoFillStep(i + 1);
          resolve();
        }, 1000);
      });
    }

    setIsAutoFilling(false);
    setExplanation(
      "Auto-fill complete. All 10 fruit items have been inserted."
    );
  };

  return (
    <div className="container mx-auto p-4 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-center text-blue-600">
        Interactive HashMap Visualizer
      </h1>

      <div className="mb-6 flex flex-wrap justify-center items-center gap-4">
        <Input
          type="text"
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          placeholder="Key"
          className="p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
        />
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Value"
          className="p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
        />
        <Button
          onClick={() => handleInsert(inputKey, inputValue)}
          className="flex items-center"
        >
          <Plus size={18} className="mr-1" /> Insert
        </Button>
        <Button
          onClick={handleAutoFill}
          disabled={isAutoFilling}
          className="flex items-center"
        >
          <FolderPlus size={18} className="mr-1" />
          {isAutoFilling
            ? `Auto-Filling (${currentAutoFillStep}/10)`
            : "Auto Fill"}
        </Button>
        <Select
          value={selectedHashFunction}
          onValueChange={(value) =>
            setSelectedHashFunction(value as keyof typeof hashFunctions)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select hash function" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(hashFunctions).map(([key, value]) => (
              <SelectItem key={key} value={key}>
                {key}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={selectedCollisionMethod}
          onValueChange={(value) =>
            setSelectedCollisionMethod(value as keyof typeof collisionMethods)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select collision method" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(collisionMethods).map(([key, value]) => (
              <SelectItem key={key} value={key}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {hashMap.buckets.map((bucket: any, index: number) => (
              <motion.div
                key={index}
                className="border p-4 rounded-lg shadow-md bg-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <h3 className="font-bold text-lg mb-2 text-gray-700">
                  Bucket {index}
                </h3>
                <AnimatePresence>
                  {bucket.map(([key, value]: [string, string]) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex justify-between items-center mb-2 bg-gray-50 p-2 rounded"
                    >
                      <span className="text-gray-800">
                        {key}: {value}
                      </span>
                      <button
                        onClick={() => handleDelete(key)}
                        className="text-red-500 hover:text-red-700 transition-colors duration-200"
                      >
                        <Trash2 size={18} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {bucket.length === 0 && (
                  <p className="text-gray-400 italic">Empty bucket</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="font-bold text-lg mb-2 text-gray-700">Pseudocode</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {pseudocode.map((line, index) => (
              <div key={index} className="mb-1">
                {line}
              </div>
            ))}
          </pre>
          <h3 className="font-bold text-lg mt-4 mb-2 text-gray-700">
            Explanation
          </h3>
          <p className="text-gray-600">{explanation}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="font-bold text-lg mb-2 text-gray-700">
          Current Configuration
        </h3>
        <p className="mb-2">
          <Hash className="inline mr-2" size={18} />
          Hash Function: {selectedHashFunction}
        </p>
        <p>
          <GitMerge className="inline mr-2" size={18} />
          Collision Resolution: {collisionMethods[selectedCollisionMethod]}
        </p>
      </div>
    </div>
  );
};

export default HashMapVisualizer;
