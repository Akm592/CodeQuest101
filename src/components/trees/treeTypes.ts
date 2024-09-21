export interface TreeNodeType {
  value: number;
  left: TreeNodeType | null;
  right: TreeNodeType | null;
}

export type TreeType = "binary" | "bst" | "avl";
