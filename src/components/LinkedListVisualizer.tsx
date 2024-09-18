import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";

const LinkedListVisualizer: React.FC = () => {
  const [listType, setListType] = useState<string>("singly");
  const [nodes, setNodes] = useState<number[]>([1, 2, 3, 4]);

  const renderVisualization = () => {
    const nodeRadius = 20;
    const nodeDistance = 100;
    const startX = 50;
    const startY = 50;

    return (
      <div className="border p-4 h-64 overflow-auto">
        <svg width={nodes.length * nodeDistance + 100} height="100">
          {nodes.map((value, index) => {
            const x = startX + index * nodeDistance;
            return (
              <g key={index}>
                {/* Node circle */}
                <circle
                  cx={x}
                  cy={startY}
                  r={nodeRadius}
                  fill="white"
                  stroke="black"
                  strokeWidth="2"
                />
                {/* Node value */}
                <text
                  x={x}
                  y={startY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="12"
                >
                  {value}
                </text>
                {/* Arrow to next node */}
                {index < nodes.length - 1 && (
                  <path
                    d={`M${x + nodeRadius + 5},${startY} L${
                      x + nodeDistance - nodeRadius - 5
                    },${startY}`}
                    stroke="black"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                )}
                {/* For circular list, add an arrow from last to first node */}
                {listType === "circular" && index === nodes.length - 1 && (
                  <path
                    d={`M${x + nodeRadius},${startY} 
                       C${x + nodeRadius + 50},${startY + 50} 
                         ${startX - nodeRadius - 50},${startY + 50} 
                         ${startX - nodeRadius},${startY}`}
                    fill="none"
                    stroke="black"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                )}
                {/* For doubly linked list, add backward arrows */}
                {listType === "doubly" && index > 0 && (
                  <path
                    d={`M${x - nodeRadius - 5},${startY - 10} L${
                      x - nodeDistance + nodeRadius + 5
                    },${startY - 10}`}
                    stroke="black"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                )}
              </g>
            );
          })}
          {/* Define arrowhead marker */}
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
          </defs>
        </svg>
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
                <span className="font-medium">{operation.charAt(0).toUpperCase() + operation.slice(1)}:</span> {complexity}
              </li>
            )
          )}
        </ul>
      </div>
      <div>
        <h4 className="text-lg font-semibold mb-2">Space Complexity:</h4>
        <p className="text-sm md:text-base">{currentExplanation.spaceComplexity}</p>
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
            <Button onClick={() => setNodes([...nodes, nodes.length + 1])}>Add Node</Button>
            <Button onClick={() => setNodes(nodes.slice(0, -1))}>Remove Node</Button>
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
