class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val, self.left, self.right = val, left, right


def build(level):
    """A tree from LeetCode's level order, e.g. [3, 9, 20, None, None, 15, 7]."""
    if not level or level[0] is None:
        return None
    root = TreeNode(level[0])
    queue, i = [root], 1
    while queue and i < len(level):
        node = queue.pop(0)
        for side in ("left", "right"):
            if i < len(level) and level[i] is not None:
                setattr(node, side, TreeNode(level[i]))
                queue.append(getattr(node, side))
            i += 1
    return root


def to_level(root):
    out, queue = [], [root]
    while queue:
        node = queue.pop(0)
        out.append(node.val if node else None)
        if node:
            queue += [node.left, node.right]
    while out and out[-1] is None:
        out.pop()
    return out


def build_tree(preorder, inorder):
    """Rebuild a tree (distinct values) from its preorder and inorder lists.
    Preorder's first value is the root; in inorder, everything left of the
    root is its left subtree. A map from value to inorder index avoids
    searching. O(n) time."""
    index = {v: i for i, v in enumerate(inorder)}
    pre = iter(preorder)

    def go(lo, hi):  # build from inorder[lo:hi]
        if lo >= hi:
            return None
        root = TreeNode(next(pre))
        mid = index[root.val]
        root.left = go(lo, mid)
        root.right = go(mid + 1, hi)
        return root

    return go(0, len(inorder))


print(to_level(build_tree([3, 9, 20, 15, 7], [9, 3, 15, 20, 7])))  # [3, 9, 20, None, None, 15, 7]
