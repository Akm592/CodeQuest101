import React from "react";
import { TreeType } from "./treeTypes";

interface TreeExplanationProps {
  treeType: TreeType;
}

const TreeExplanation: React.FC<TreeExplanationProps> = ({ treeType }) => {
  const explanations = {
    binary: {
      description:
        "A binary tree is a tree data structure in which each node has at most two children, referred to as the left child and the right child.",
      properties: [
        "Each node has at most two children.",
        "There is no specific ordering between elements.",
        "It can be used to represent hierarchical data.",
      ],
      timeComplexity: {
        insertion: "O(h) where h is the height of the tree",
        deletion: "O(h) where h is the height of the tree",
        search: "O(h) where h is the height of the tree",
      },
    },
    bst: {
      description:
        "A binary search tree is a binary tree with the property that the key in each node is greater than all keys stored in the left sub-tree, and less than all keys in the right sub-tree.",
      properties: [
        "Left subtree of a node contains only nodes with keys lesser than the node's key.",
        "Right subtree of a node contains only nodes with keys greater than the node's key.",
        "The left and right subtree each must also be a binary search tree.",
      ],
      timeComplexity: {
        insertion: "O(log n) on average, O(n) worst case",
        deletion: "O(log n) on average, O(n) worst case",
        search: "O(log n) on average, O(n) worst case",
      },
    },
    avl: {
      description:
        "An AVL tree is a self-balancing binary search tree where the difference between heights of left and right subtrees cannot be more than one for all nodes.",
      properties: [
        "It's a BST with an additional balance condition.",
        "For each node, the heights of its left and right subtrees differ by at most 1.",
        "Ensures O(log n) time complexity for insertion, deletion, and search operations.",
      ],
      timeComplexity: {
        insertion: "O(log n)",
        deletion: "O(log n)",
        search: "O(log n)",
      },
    },
  };

  const treeInfo = explanations[treeType];

  return (
    <div className="mt-8 p-4 bg-gray-100 rounded max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">{treeType.toUpperCase()} Tree</h2>
      <p className="mb-4">{treeInfo.description}</p>
      <h3 className="-semibold mb-2">Properties:</h3>
      <ul className="list-disc pl-5 mb-4">
        {treeInfo.properties.map((prop, index) => (
          <li key={index}>{prop}</li>
        ))}
      </ul>
      <h3 className="text-xl font-semibold mb-2">Time Complexities:</h3>
      <ul className="list-none pl-5">
        <li>Insertion: {treeInfo.timeComplexity.insertion}</li>
        <li>Deletion: {treeInfo.timeComplexity.deletion}</li>
        <li>Search: {treeInfo.timeComplexity.search}</li>
      </ul>
    </div>
  );
};

export default TreeExplanation;
