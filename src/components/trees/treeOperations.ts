import { TreeNodeType, TreeType } from "./treeTypes";

export function insertNode(
  root: TreeNodeType | null,
  value: number,
  treeType: TreeType
): { newRoot: TreeNodeType; steps: string[] } {
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
          current.value
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
  const minSteps: string[] = [];
  while (node.left) {
    minSteps.push(`Moving to left child ${node.left.value}`);
    node = node.left;
  }
  return {
    minNode: node,
    minSteps: [...minSteps, `Found minimum value ${node.value}`],
  };
}

function getHeight(node: TreeNodeType | null): number {
  return node ? 1 + Math.max(getHeight(node.left), getHeight(node.right)) : 0;
}

function getBalance(node: TreeNodeType | null): number {
  return node ? getHeight(node.left) - getHeight(node.right) : 0;
}

function rotateRight(y: TreeNodeType, steps: string[]): TreeNodeType {
  steps.push(`Performing right rotation on node ${y.value}`);
  const x = y.left!;
  y.left = x.right;
  x.right = y;
  steps.push(`Rotation complete: ${x.value} is now the parent of ${y.value}`);
  return x;
}

function rotateLeft(x: TreeNodeType, steps: string[]): TreeNodeType {
  steps.push(`Performing left rotation on node ${x.value}`);
  const y = x.right!;
  x.right = y.left;
  y.left = x;
  steps.push(`Rotation complete: ${y.value} is now the parent of ${x.value}`);
  return y;
}

function balance(node: TreeNodeType, steps: string[]): TreeNodeType {
  const balance = getBalance(node);
  steps.push(`Checking balance factor of node ${node.value}: ${balance}`);

  if (balance > 1) {
    if (getBalance(node.left) < 0) {
      steps.push(`Left-Right case detected`);
      node.left = rotateLeft(node.left!, steps);
    }
    steps.push(`Left-Left case detected`);
    return rotateRight(node, steps);
  }

  if (balance < -1) {
    if (getBalance(node.right) > 0) {
      steps.push(`Right-Left case detected`);
      node.right = rotateRight(node.right!, steps);
    }
    steps.push(`Right-Right case detected`);
    return rotateLeft(node, steps);
  }

  steps.push(`Node ${node.value} is balanced`);
  return node;
}
