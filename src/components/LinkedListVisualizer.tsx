import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import { Input } from "./ui/input";

const LinkedListVisualizer: React.FC = () => {
  const [listType, setListType] = useState<string>("singly");
  const [nodes, setNodes] = useState<number[]>([1, 2, 3, 4]);
  const [isReversing, setIsReversing] = useState<boolean>(false);
  const [deletionIndex, setDeletionIndex] = useState<number>(-1);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [reversalStep, setReversalStep] = useState<number>(-1);
  const [reversedNodes, setReversedNodes] = useState<number[]>([]);
  const [explanation, setExplanation] = useState<string>("");

  const reversalExplanations = {
    singly: [
      "Initialize three pointers: prev = null, current = head, next = null",
      "Store next node: next = current.next",
      "Reverse current node's pointer: current.next = prev",
      "Move prev and current one step forward: prev = current, current = next",
      "Repeat steps 2-4 until current becomes null",
      "Set head to prev (last node of original list)",
    ],
    doubly: [
      "Initialize two pointers: current = head, temp = null",
      "Swap current.next and current.prev for the current node",
      "Move to the next node: current = current.prev (original next)",
      "Repeat steps 2-3 until current becomes null",
      "Set head to the last node of the original list",
    ],
    circular: [
      "Find the last node of the list",
      "Initialize three pointers: prev = last, current = head, next = null",
      "Store next node: next = current.next",
      "Reverse current node's pointer: current.next = prev",
      "Move prev and current one step forward: prev = current, current = next",
      "Repeat steps 3-5 until current reaches the original head",
      "Update head: head = prev",
    ],
  };

  useEffect(() => {
    if (isReversing) {
      const reverseAnimation = async () => {
        const reversedArray = [...nodes].reverse();
        setReversedNodes(reversedArray);

        const steps =
          reversalExplanations[listType as keyof typeof reversalExplanations];

        for (let i = 0; i < steps.length; i++) {
          setReversalStep(i);
          setExplanation(steps[i]);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        setNodes(reversedArray);
        setIsReversing(false);
        setReversalStep(-1);
        setReversedNodes([]);
        setExplanation("");
      };
      reverseAnimation();
    }
  }, [isReversing, nodes, listType]);

  const renderVisualization = () => {
    const nodeRadius = 20;
    const nodeDistance = 100;
    const startX = 50;
    const startY = 50;

    return (
      <div className="border p-4 h-64 overflow-auto">
        <svg width={nodes.length * nodeDistance + 100} height="100">
          <AnimatePresence>
            {nodes.map((value, index) => {
              const x = startX + index * nodeDistance;
              const isReversed =
                reversalStep >=
                reversalExplanations[
                  listType as keyof typeof reversalExplanations
                ].length -
                  1;
              const isCurrentlyReversing = reversalStep === index + 1;

              return (
                <motion.g
                  key={`node-${value}`}
                  initial={{ opacity: 1, y: 0 }}
                  animate={{
                    opacity: 1,
                    y: isCurrentlyReversing ? [-20, 0] : 0,
                    transition: { duration: 0.5 },
                  }}
                  exit={{ opacity: 0, scale: 0 }}
                >
                  {/* Node circle */}
                  <motion.circle
                    cx={x}
                    cy={startY}
                    r={nodeRadius}
                    fill={
                      isDeleting && index === deletionIndex
                        ? "red"
                        : isReversed
                        ? "lightgreen"
                        : isCurrentlyReversing
                        ? "yellow"
                        : "white"
                    }
                    stroke="black"
                    strokeWidth="2"
                    animate={{
                      scale: isCurrentlyReversing ? [1, 1.2, 1] : 1,
                      transition: { duration: 0.5 },
                    }}
                  />
                  {/* Node value */}
                  <motion.text
                    x={x}
                    y={startY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="12"
                    animate={{
                      scale: isCurrentlyReversing ? [1, 1.2, 1] : 1,
                      transition: { duration: 0.5 },
                    }}
                  >
                    {isReversed ? reversedNodes[index] : value}
                  </motion.text>
                  {/* Forward arrow */}
                  {index < nodes.length - 1 && (
                    <motion.path
                      d={`M${x + nodeRadius + 5},${startY} L${
                        x + nodeDistance - nodeRadius - 5
                      },${startY}`}
                      stroke="black"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                      initial={{ pathLength: 0 }}
                      animate={{
                        pathLength: 1,
                        opacity: isReversed ? 0 : 1,
                      }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    />
                  )}
                  {/* Reversed arrow */}
                  {index > 0 && (
                    <motion.path
                      d={`M${x - nodeRadius - 5},${startY} L${
                        x - nodeDistance + nodeRadius + 5
                      },${startY}`}
                      stroke="blue"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead-blue)"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{
                        pathLength: isReversed ? 1 : 0,
                        opacity: isReversed ? 1 : 0,
                      }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    />
                  )}
                  {/* Circular list arrow */}
                  {listType === "circular" && index === nodes.length - 1 && (
                    <motion.path
                      d={`M${x + nodeRadius},${startY} 
                         C${x + nodeRadius + 50},${startY + 50} 
                           ${startX - nodeRadius - 50},${startY + 50} 
                           ${startX - nodeRadius},${startY}`}
                      fill="none"
                      stroke={isReversed ? "blue" : "black"}
                      strokeWidth="2"
                      markerEnd={
                        isReversed ? "url(#arrowhead-blue)" : "url(#arrowhead)"
                      }
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: nodes.length * 0.1 }}
                    />
                  )}
                  {/* Doubly linked list backward arrow */}
                  {listType === "doubly" && index > 0 && (
                    <motion.path
                      d={`M${x - nodeRadius - 5},${startY - 10} L${
                        x - nodeDistance + nodeRadius + 5
                      },${startY - 10}`}
                      stroke={isReversed ? "blue" : "black"}
                      strokeWidth="2"
                      markerEnd={
                        isReversed ? "url(#arrowhead-blue)" : "url(#arrowhead)"
                      }
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    />
                  )}
                </motion.g>
              );
            })}
          </AnimatePresence>
          {/* Define arrowhead markers */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="0"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="black" />
            </marker>
            <marker
              id="arrowhead-blue"
              markerWidth="10"
              markerHeight="7"
              refX="0"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="blue" />
            </marker>
          </defs>
        </svg>
        {isReversing && (
          <motion.div
            className="mt-4 p-2 bg-gray-100 rounded"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <h3 className="font-bold">Step {reversalStep + 1}:</h3>
            <p>{explanation}</p>
          </motion.div>
        )}
      </div>
    );
  };

  const renderExplanation = () => {
    const explanations = {
      singly: {
        description:
          "A singly linked list is a linear data structure where each element is a separate object called a node. Each node contains a data field and a reference (or link) to the next node in the sequence.",
        timeComplexity: {
          access: "O(n)",
          search: "O(n)",
          insertion: "O(1) at the beginning, O(n) at the end or middle",
          deletion: "O(1) at the beginning, O(n) at the end or middle",
        },
        spaceComplexity: "O(n)",
        algorithms: {
          insert:
            "To insert a new node:\n1. Create a new node\n2. Set the new node's next pointer to the current node\n3. Update the previous node's next pointer to the new node",
          delete:
            "To delete a node:\n1. Find the node to be deleted\n2. Update the previous node's next pointer to skip the node to be deleted\n3. Free the memory of the deleted node",
          reverse:
            "To reverse a singly linked list:\n1. Initialize three pointers: prev as NULL, current as head, and next as NULL\n2. Iterate through the list:\n   a. Store the next node\n   b. Change of current to prev\n   c. Move prev and current one step forward\n3. Change the head to point to the last node",
        },
      },
      doubly: {
        description:
          "A doubly linked list is similar to a singly linked list, but each node has two links: one to the next node and another to the previous node. This allows for traversal in both directions.",
        timeComplexity: {
          access: "O(n)",
          search: "O(n)",
          insertion: "O(1) at the beginning or end, O(n) in the middle",
          deletion: "O(1) at the beginning or end, O(n) in the middle",
        },
        spaceComplexity: "O(n)",
        algorithms: {
          insert:
            "To insert a new node:\n1. Create a new node\n2. Update the new node's next and previous pointers\n3. Update the next and previous nodes' pointers to include the new node",
          delete:
            "To delete a node:\n1. Find the node to be deleted\n2. Update the previous node's next pointer and the next node's previous pointer\n3. Free the memory of the deleted node",
          reverse:
            "To reverse a doubly linked list:\n1. Swap the prev and next pointers for all nodes\n2. Change the head to point to the last node",
        },
      },
      circular: {
        description:
          "A circular linked list is a variation of a linked list where the last node points back to the first node, creating a circle. It can be either singly or doubly linked.",
        timeComplexity: {
          access: "O(n)",
          search: "O(n)",
          insertion:
            "O(1) if inserting at the end (with tail pointer), O(n) otherwise",
          deletion: "O(1) if deleting the first node, O(n) otherwise",
        },
        spaceComplexity: "O(n)",
        algorithms: {
          insert:
            "To insert a new node at the end:\n1. Create a new node\n2. Set the last node's next pointer to the new node\n3. Set the new node's next pointer to the first node\n4. Update the tail pointer (if maintained)",
          delete:
            "To delete a node:\n1. Find the node to be deleted and its previous node\n2. Update the previous node's next pointer to skip the node to be deleted\n3. If deleting the last node, update its next pointer to the first node\n4. Free the memory of the deleted node",
          reverse:
            "To reverse a circular linked list:\n1. Reverse the list as if it were a singly linked list\n2. Update the last node's next pointer to point to the new first node",
        },
      },
    };

    const currentExplanation =
      explanations[listType as keyof typeof explanations];

    return (
      <div className="mt-4 space-y-4">
        <h3 className="text-xl font-bold">
          {listType.charAt(0).toUpperCase() + listType.slice(1)} Linked List
        </h3>
        <p className="text-sm md:text-base">{currentExplanation.description}</p>
        <div>
          <h4 className="text-lg font-semibold mb-2">Time Complexity:</h4>
          <ul className="list-disc list-inside text-sm md:text-base space-y-1">
            {Object.entries(currentExplanation.timeComplexity).map(
              ([operation, complexity]) => (
                <li key={operation}>
                  <span className="font-medium">
                    {operation.charAt(0).toUpperCase() + operation.slice(1)}:
                  </span>{" "}
                  {complexity}
                </li>
              )
            )}
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-2">Space Complexity:</h4>
          <p className="text-sm md:text-base">
            {currentExplanation.spaceComplexity}
          </p>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-2">Algorithms:</h4>
          <div className="space-y-2">
            <div>
              <h5 className="font-semibold">Insertion:</h5>
              <pre className="bg-gray-100 p-2 rounded text-xs md:text-sm overflow-x-auto">
                {currentExplanation.algorithms.insert}
              </pre>
            </div>
            <div>
              <h5 className="font-semibold">Deletion:</h5>
              <pre className="bg-gray-100 p-2 rounded text-xs md:text-sm overflow-x-auto">
                {currentExplanation.algorithms.delete}
              </pre>
            </div>
            <div>
              <h5 className="font-semibold">Reversal:</h5>
              <pre className="bg-gray-100 p-2 rounded text-xs md:text-sm overflow-x-auto">
                {currentExplanation.algorithms.reverse}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Linked List Visualizer</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Select onValueChange={setListType} value={listType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select list type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="singly">Singly Linked List</SelectItem>
                  <SelectItem value="doubly">Doubly Linked List</SelectItem>
                  <SelectItem value="circular">Circular Linked List</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {renderVisualization()}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => setNodes([...nodes, nodes.length + 1])}>
                Add Node
              </Button>
              <Button onClick={() => setNodes(nodes.slice(0, -1))}>
                Remove Node
              </Button>
              <Button
                onClick={() => setIsReversing(true)}
                disabled={isReversing || reversalStep !== -1}
              >
                Reverse List
              </Button>
              <Input
                type="number"
                placeholder="Node index to delete"
                onChange={(e) => setDeletionIndex(parseInt(e.target.value))}
                className="w-32"
              />
              <Button
                onClick={() => setIsDeleting(true)}
                disabled={
                  isDeleting ||
                  deletionIndex < 0 ||
                  deletionIndex >= nodes.length
                }
              >
                Delete Node
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Explanation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[calc(100vh-16rem)] overflow-y-auto">
              {renderExplanation()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LinkedListVisualizer;
