// Trees: the seventh category of the NeetCode 150, in NeetCode's order.

import type { AnyProblem } from "../types";
import { balancedTree } from "./balancedTree";
import { buildTree } from "./buildTree";
import { diameterTree } from "./diameterTree";
import { goodNodes } from "./goodNodes";
import { invertTree } from "./invertTree";
import { kthSmallest } from "./kthSmallest";
import { lcaBST } from "./lcaBST";
import { levelOrder } from "./levelOrder";
import { maxDepth } from "./maxDepth";
import { maxPathSum } from "./maxPathSum";
import { rightSideView } from "./rightSideView";
import { sameTree } from "./sameTree";
import { serializeTree } from "./serializeTree";
import { subtree } from "./subtree";
import { validateBST } from "./validateBST";

export const TREES: AnyProblem[] = [invertTree, maxDepth, diameterTree, balancedTree, sameTree, subtree, lcaBST, levelOrder, rightSideView, goodNodes, validateBST, kthSmallest, buildTree, maxPathSum, serializeTree];
