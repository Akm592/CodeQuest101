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


def invert_tree(root):
    """Mirror the tree: swap every node's children. O(n) time."""
    if root:
        root.left, root.right = root.right, root.left
        invert_tree(root.left)
        invert_tree(root.right)
    return root


print(to_level(invert_tree(build([4, 2, 7, 1, 3, 6, 9]))))  # [4, 7, 2, 9, 6, 3, 1]
