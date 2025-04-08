// treeOperations.ts - No UI changes needed.
// (Code remains the same as provided)
import { TreeNodeType, TreeType } from "./treeTypes";

export function insertNode(
  root: TreeNodeType | null,
  value: number,
  treeType: TreeType
): { newRoot: TreeNodeType; steps: string[] } {
  // ... (implementation unchanged)
  const steps: string[] = [];

  if (!root) {
    steps.push(`Creating new root node with value ${value}`);
    return { newRoot: { value, left: null, right: null }, steps };
  }

  let current = root;
  const path: TreeNodeType[] = [];

  while (current) {
    path.push(current);
    if (
      (treeType === "binary" && Math.random() < 0.5) ||
      value < current.value
    ) {
      if (!current.left) {
        steps.push(`Inserting ${value} as left child of ${current.value}`);
        current.left = { value, left: null, right: null };
        break;
      }
      steps.push(`Moving to left child of node ${current.value}`);
      current = current.left;
    } else {
      if (!current.right) {
        steps.push(`Inserting ${value} as right child of ${current.value}`);
        current.right = { value, left: null, right: null };
        break;
      }
      steps.push(`Moving to right child of node ${current.value}`);
      current = current.right;
    }
  }

  if (treeType === "avl") {
    for (let i = path.length - 1; i >= 0; i--) {
      path[i] = balance(path[i], steps);
    }
    root = path[0];
  }

  return { newRoot: root, steps };
}

export function deleteNode(
  root: TreeNodeType | null,
  value: number,
  treeType: TreeType
): { newRoot: TreeNodeType | null; steps: string[] } {
  // ... (implementation unchanged)
  const steps: string[] = [];
  if (!root) {
    steps.push(`Tree is empty, nothing to delete`);
    return { newRoot: null, steps };
  }

  if (value < root.value) {
    steps.push(`${value} is less than ${root.value}, moving to left subtree`);
    const { newRoot: newLeft, steps: leftSteps } = deleteNode(
      root.left,
      value,
      treeType
    );
    root.left = newLeft;
    steps.push(...leftSteps);
  } else if (value > root.value) {
    steps.push(
      `${value} is greater than ${root.value}, moving to right subtree`
    );
    const { newRoot: newRight, steps: rightSteps } = deleteNode(
      root.right,
      value,
      treeType
    );
    root.right = newRight;
    steps.push(...rightSteps);
  } else {
    steps.push(`Found node to delete: ${value}`);
    if (!root.left)
      return {
        newRoot: root.right,
        steps: [...steps, `Node has no left child, replacing with right child`],
      };
    if (!root.right)
      return {
        newRoot: root.left,
        steps: [...steps, `Node has no right child, replacing with left child`],
      };

    steps.push(`Node has two children, finding inorder successor`);
    const { minNode, minSteps } = findMin(root.right);
    steps.push(...minSteps);
    root.value = minNode.value;
    steps.push(`Replaced ${value} with inorder successor ${minNode.value}`);
    const { newRoot: newRight, steps: deleteSteps } = deleteNode(
      root.right,
      minNode.value,
      treeType
    );
    root.right = newRight;
    steps.push(...deleteSteps);
  }

  return { newRoot: treeType === "avl" ? balance(root, steps) : root, steps };
}

export function searchNode(
  root: TreeNodeType | null,
  value: number
): { found: boolean; steps: string[] } {
  // ... (implementation unchanged)
  const steps: string[] = [];
  let current = root;

  while (current) {
    steps.push(`Checking node ${current.value}`);
    if (current.value === value)
      return { found: true, steps: [...steps, `Found ${value}`] };
    current = value < current.value ? current.left : current.right;
    if (current) {
      steps.push(
        `${value} is ${value < current.value ? "less" : "greater"} than ${
          current.value // This comparison was potentially checking the wrong node value
        }, moving to ${value < current.value ? "left" : "right"} child`
      );
    }
  }

  return { found: false, steps: [...steps, `${value} not found in the tree`] };
}

function findMin(node: TreeNodeType): {
  minNode: TreeNodeType;
  minSteps: string[];
} {
  // ... (implementation unchanged)
  const minSteps: string[] = [];
  let currentNode = node; // Use a temporary variable to avoid modifying the input node directly
  minSteps.push(`Starting search for minimum in subtree rooted at ${currentNode.value}`);
  while (currentNode.left) {
    minSteps.push(`Moving to left child ${currentNode.left.value}`);
    currentNode = currentNode.left;
  }
  return {
    minNode: currentNode,
    minSteps: [...minSteps, `Found minimum value ${currentNode.value}`],
  };
}

function getHeight(node: TreeNodeType | null): number {
  // ... (implementation unchanged)
  return node ? 1 + Math.max(getHeight(node.left), getHeight(node.right)) : 0;
}

function getBalance(node: TreeNodeType | null): number {
  // ... (implementation unchanged)
  return node ? getHeight(node.left) - getHeight(node.right) : 0;
}

function rotateRight(y: TreeNodeType, steps: string[]): TreeNodeType {
  // ... (implementation unchanged)
  steps.push(`Performing right rotation on node ${y.value}`);
  const x = y.left!;
  y.left = x.right;
  x.right = y;
  steps.push(`Rotation complete: ${x.value} is now the parent of ${y.value}`);
  return x;
}

function rotateLeft(x: TreeNodeType, steps: string[]): TreeNodeType {
  // ... (implementation unchanged)
  steps.push(`Performing left rotation on node ${x.value}`);
  const y = x.right!;
  x.right = y.left;
  y.left = x;
  steps.push(`Rotation complete: ${y.value} is now the parent of ${x.value}`);
  return y;
}

function balance(node: TreeNodeType, steps: string[]): TreeNodeType {
  // ... (implementation unchanged)
  // Note: AVL height updates are missing here, but that's beyond the scope of theme change
  const balanceFactor = getBalance(node); // Renamed variable for clarity
  steps.push(`Checking balance factor of node ${node.value}: ${balanceFactor}`);

  // Left heavy
  if (balanceFactor > 1) {
    // Left-Right Case
    if (getBalance(node.left) < 0) {
      steps.push(`Left-Right case detected at node ${node.value}. Performing left rotation on left child ${node.left!.value}.`);
      node.left = rotateLeft(node.left!, steps);
    }
    // Left-Left Case (or after Left-Right adjustment)
    steps.push(`Left-Left case detected at node ${node.value}. Performing right rotation.`);
    return rotateRight(node, steps);
  }

  // Right heavy
  if (balanceFactor < -1) {
    // Right-Left Case
    if (getBalance(node.right) > 0) {
      steps.push(`Right-Left case detected at node ${node.value}. Performing right rotation on right child ${node.right!.value}.`);
      node.right = rotateRight(node.right!, steps);
    }
    // Right-Right Case (or after Right-Left adjustment)
    steps.push(`Right-Right case detected at node ${node.value}. Performing left rotation.`);
    return rotateLeft(node, steps);
  }

  steps.push(`Node ${node.value} is balanced`);
  return node;
}