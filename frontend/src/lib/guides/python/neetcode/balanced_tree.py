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


def is_balanced(root):
    """True if, at every node, the two subtrees' heights differ by at most 1.
    Each call returns (balanced, height), so heights are computed once. O(n)."""
    def dfs(node):
        if not node:
            return True, 0
        lb, lh = dfs(node.left)
        rb, rh = dfs(node.right)
        return lb and rb and abs(lh - rh) <= 1, 1 + max(lh, rh)

    return dfs(root)[0]


print(is_balanced(build([3, 9, 20, None, None, 15, 7])))      # True
print(is_balanced(build([1, 2, 2, 3, 3, None, None, 4, 4])))  # False
