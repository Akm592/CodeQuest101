// TreesExplanation.tsx
// **MODIFIED**: Adjusted colors for dark theme and added pseudocode for each tree type
import React from "react";
import { TreeType } from "./treeTypes";

interface TreeExplanationProps {
  treeType: TreeType;
}

const TreeExplanation: React.FC<TreeExplanationProps> = ({ treeType }) => {
  const explanations = {
    binary: {
      description:
        "A Binary Tree is a hierarchical data structure in which each node has at most two children, commonly referred to as the left and right children. It is the foundation for more advanced tree structures like Binary Search Trees and AVL Trees.",
      properties: [
        "Each node can have at most two children: left and right.",
        "There is no inherent order in the nodes.",
        "Used in scenarios like expression trees, heaps, and syntax trees.",
      ],
      timeComplexity: {
        insertion: "O(h), where h is the height of the tree",
        deletion: "O(h), where h is the height of the tree",
        search: "O(h), where h is the height of the tree",
      },
      pseudocode: `
function traverseBinaryTree(node):
    if node is not null:
        traverseBinaryTree(node.left)
        print(node.value)
        traverseBinaryTree(node.right)
      `.trim(),
      references: [
        {
          text: "Binary Tree Basics",
          url: "https://www.geeksforgeeks.org/binary-tree-data-structure/",
        },
        {
          text: "Binary Tree Operations",
          url: "https://www.tutorialspoint.com/data_structures_algorithms/tree_data_structure.htm",
        },
      ],
    },
    bst: {
      description:
        "A Binary Search Tree (BST) is a binary tree where each node has a value greater than all values in its left subtree and less than all values in its right subtree. This property makes BSTs efficient for searching, insertion, and deletion operations.",
      properties: [
        "Left subtree contains nodes with values less than the parent node's value.",
        "Right subtree contains nodes with values greater than the parent node's value.",
        "Efficient for operations like searching and sorting.",
      ],
      timeComplexity: {
        insertion: "O(log n) on average, O(n) in the worst case",
        deletion: "O(log n) on average, O(n) in the worst case",
        search: "O(log n) on average, O(n) in the worst case",
      },
      pseudocode: `
function insertIntoBST(root, value):
    if root is null:
        return new Node(value)
    if value < root.value:
        root.left = insertIntoBST(root.left, value)
    else:
        root.right = insertIntoBST(root.right, value)
    return root
      `.trim(),
      references: [
        {
          text: "Binary Search Tree Overview",
          url: "https://www.geeksforgeeks.org/binary-search-tree-data-structure/",
        },
        {
          text: "BST Operations",
          url: "https://www.coursera.org/lecture/data-structures/binary-search-tree-operations-zObSq",
        },
      ],
    },
    avl: {
      description:
        "An AVL Tree is a self-balancing binary search tree where the height difference between left and right subtrees of any node is at most 1. This ensures that the tree remains balanced, providing O(log n) time complexity for insertions, deletions, and searches.",
      properties: [
        "It is a height-balanced binary search tree.",
        "For any node, the height difference between left and right subtrees is at most 1.",
        "Balances itself with rotations after insertions and deletions to maintain O(log n) operations.",
      ],
      timeComplexity: {
        insertion: "O(log n)",
        deletion: "O(log n)",
        search: "O(log n)",
      },
      pseudocode: `
function insertIntoAVL(root, value):
    root = insert(root, value)
    balanceFactor = height(root.left) - height(root.right)
    if balanceFactor > 1:
        if value < root.left.value:
            return rotateRight(root)
        else:
            root.left = rotateLeft(root.left)
            return rotateRight(root)
    if balanceFactor < -1:
        if value > root.right.value:
            return rotateLeft(root)
        else:
            root.right = rotateRight(root.right)
            return rotateLeft(root)
    return root
      `.trim(),
      references: [
        {
          text: "AVL Tree Explanation",
          url: "https://www.geeksforgeeks.org/avl-tree-set-1-insertion/",
        },
        {
          text: "AVL Tree Rotations",
          url: "https://www.programiz.com/dsa/avl-tree",
        },
      ],
    },
  };

  const treeInfo = explanations[treeType];

  return (
    // Container: Dark background, light text
    <div className="mt-8 p-6 bg-gray-800 text-gray-200 rounded-lg shadow-md max-w-7xl">
      {/* Heading: Light text */}
      <h2 className="text-2xl font-bold mb-4 text-white">{treeType.toUpperCase()} Tree</h2>
      <p className="mb-4">{treeInfo.description}</p>
      {/* Sub-heading: Light text */}
      <h3 className="text-xl font-semibold mb-2 text-gray-100">Properties:</h3>
      <ul className="list-disc pl-5 mb-4 space-y-1">
        {treeInfo.properties.map((prop, index) => (
          <li key={index}>{prop}</li>
        ))}
      </ul>
      {/* Sub-heading: Light text */}
      <h3 className="text-xl font-semibold mb-2 text-gray-100">Time Complexities:</h3>
      <ul className="list-none pl-5 mb-4 space-y-1">
        <li>
          Insertion:{" "}
          <code className="bg-gray-700 px-1 rounded text-sm">
            {treeInfo.timeComplexity.insertion}
          </code>
        </li>
        <li>
          Deletion:{" "}
          <code className="bg-gray-700 px-1 rounded text-sm">
            {treeInfo.timeComplexity.deletion}
          </code>
        </li>
        <li>
          Search:{" "}
          <code className="bg-gray-700 px-1 rounded text-sm">
            {treeInfo.timeComplexity.search}
          </code>
        </li>
      </ul>
      {/* Sub-heading: Light text */}
      <h3 className="text-xl font-semibold mb-2 text-gray-100">Pseudocode:</h3>
      {/* Code Block: Darker background, appropriate text color */}
      <pre className="bg-gray-900 p-4 rounded mb-4 text-sm text-green-400 overflow-x-auto">
        <code>{treeInfo.pseudocode}</code>
      </pre>
      {/* Sub-heading: Light text */}
      <h3 className="text-xl font-semibold mb-2 text-gray-100">References:</h3>
      <ul className="list-disc pl-5 space-y-1">
        {treeInfo.references.map((ref, index) => (
          <li key={index}>
            {/* Links: Lighter blue for dark background */}
            <a
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 hover:underline"
            >
              {ref.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TreeExplanation;
