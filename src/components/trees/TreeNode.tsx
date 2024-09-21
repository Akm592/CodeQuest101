import React from "react";
import { motion } from "framer-motion";
import { TreeNodeType } from "./treeTypes";

interface TreeNodeProps {
  node: TreeNodeType;
  x: number;
  y: number;
  variants: import("framer-motion").Variants;
  isHighlighted: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  x,
  y,
  variants,
  isHighlighted,
}) => {
  return (
    <motion.g
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.circle
        cx={x}
        cy={y}
        r="20"
        fill={isHighlighted ? "#FF6B6B" : "#4CAF50"}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />
      <motion.text
        x={x}
        y={y}
        textAnchor="middle"
        dy=".3em"
        fill="white"
        fontSize="12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {node.value}
      </motion.text>
    </motion.g>
  );
};

export default TreeNode;
