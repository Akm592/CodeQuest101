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
        // Inserting a node in a Binary Tree (not necessarily a BST)
        function insert(root, value) {
          if (root is null) {
            return new Node(value)
          }
          // Traverse the tree to find the correct position
          if (root.left is null) {
            root.left = insert(root.left, value)
          } else {
            root.right = insert(root.right, value)
          }
          return root
        }
      `,
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
        // Searching for a value in a Binary Search Tree
        function search(root, value) {
          if (root is null or root.value === value) {
            return root
          }
          if (value < root.value) {
            return search(root.left, value)
          } else {
            return search(root.right, value)
          }
        }
      `,
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
        // Left Rotation in AVL Tree
        function leftRotate(node) {
          let rightNode = node.right
          node.right = rightNode.left
          rightNode.left = node
          // Update heights
          node.height = max(height(node.left), height(node.right)) + 1
          rightNode.height = max(height(rightNode.left), height(rightNode.right)) + 1
          return rightNode
        }
        
        // Insertion in AVL Tree
        function insert(root, value) {
          if (root is null) {
            return new Node(value)
          }
          if (value < root.value) {
            root.left = insert(root.left, value)
          } else if (value > root.value) {
            root.right = insert(root.right, value)
          } else {
            return root
          }
          
          // Update height and balance the tree
          root.height = max(height(root.left), height(root.right)) + 1
          let balance = getBalance(root)
          
          // Rotate to balance the tree
          if (balance > 1 && value < root.left.value) {
            return rightRotate(root)
          }
          if (balance < -1 && value > root.right.value) {
            return leftRotate(root)
          }
          if (balance > 1 && value > root.left.value) {
            root.left = leftRotate(root.left)
            return rightRotate(root)
          }
          if (balance < -1 && value < root.right.value) {
            root.right = rightRotate(root.right)
            return leftRotate(root)
          }
          return root
        }
      `,
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
    <div className="mt-8 p-4 bg-gray-100 rounded max-w-7xl">
      <h2 className="text-2xl font-bold mb-4">{treeType.toUpperCase()} Tree</h2>
      <p className="mb-4">{treeInfo.description}</p>
      <h3 className="font-semibold mb-2">Properties:</h3>
      <ul className="list-disc pl-5 mb-4">
        {treeInfo.properties.map((prop, index) => (
          <li key={index}>{prop}</li>
        ))}
      </ul>
      <h3 className="text-xl font-semibold mb-2">Time Complexities:</h3>
      <ul className="list-none pl-5 mb-4">
        <li>Insertion: {treeInfo.timeComplexity.insertion}</li>
        <li>Deletion: {treeInfo.timeComplexity.deletion}</li>
        <li>Search: {treeInfo.timeComplexity.search}</li>
      </ul>
      <h3 className="text-xl font-semibold mb-2">Pseudocode:</h3>
      <pre className="bg-gray-200 p-3 rounded mb-4">{treeInfo.pseudocode}</pre>
      <h3 className="text-xl font-semibold mb-2">References:</h3>
      <ul className="list-disc pl-5">
        {treeInfo.references.map((ref, index) => (
          <li key={index}>
            <a
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600"
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
