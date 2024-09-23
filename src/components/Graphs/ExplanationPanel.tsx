import React from "react";
import { AlertCircle } from "lucide-react";

interface TraversalStep {
  visited: string[];
  queue?: string[];
  stack?: string[];
  currentNode: string;
}

interface ExplanationPanelProps {
  currentStep: number;
  traversalSteps: TraversalStep[];
  traversalType: "bfs" | "dfs";
}

const ExplanationPanel: React.FC<ExplanationPanelProps> = ({
  currentStep,
  traversalSteps,
  traversalType,
}) => {
  const currentStepData = traversalSteps[currentStep];

  if (!currentStepData) {
    return (
      <div className="mt-4 p-4 bg-gray-100 rounded-md flex items-center">
        <AlertCircle className="mr-2 text-yellow-500" />
        <p>No traversal in progress. Click 'Start Traversal' to begin.</p>
      </div>
    );
  }

  const { visited, queue, stack, currentNode } = currentStepData;

  const getExplanation = () => {
    if (traversalType === "bfs") {
      return `Visiting node ${currentNode}. Queue: [${queue?.join(", ")}]`;
    } else {
      return `Visiting node ${currentNode}. Stack: [${stack?.join(", ")}]`;
    }
  };

  const getPseudoCode = () => {
    if (traversalType === "bfs") {
      return [
        "function BFS(graph, start):",
        "    queue = [start]",
        "    visited = set()",
        "    while queue is not empty:",
        "        node = queue.pop(0)",
        "        if node not in visited:",
        "            visit(node)",
        "            visited.add(node)",
        "            for neighbor in graph[node]:",
        "                if neighbor not in visited:",
        "                    queue.append(neighbor)",
      ];
    } else {
      return [
        "function DFS(graph, start):",
        "    stack = [start]",
        "    visited = set()",
        "    while stack is not empty:",
        "        node = stack.pop()",
        "        if node not in visited:",
        "            visit(node)",
        "            visited.add(node)",
        "            for neighbor in graph[node]:",
        "                if neighbor not in visited:",
        "                    stack.append(neighbor)",
      ];
    }
  };

  const getActiveLineIndex = () => {
    if (traversalType === "bfs") {
      if (currentStepData.queue?.length === 0) return 3;
      if (!visited.includes(currentNode)) return 5;
      return 8;
    } else {
      if (currentStepData.stack?.length === 0) return 3;
      if (!visited.includes(currentNode)) return 5;
      return 8;
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-md">
      <h3 className="text-lg font-semibold mb-2">Step {currentStep + 1}</h3>
      <p className="mb-2">{getExplanation()}</p>
      <p className="mb-4">Visited nodes: [{visited.join(", ")}]</p>
      <div className="bg-white p-4 rounded-md">
        <h4 className="font-semibold mb-2">Pseudo-code:</h4>
        <pre className="text-sm">
          {getPseudoCode().map((line, index) => (
            <div
              key={index}
              className={index === getActiveLineIndex() ? "bg-yellow-200" : ""}
            >
              {line}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
};

export default ExplanationPanel;
