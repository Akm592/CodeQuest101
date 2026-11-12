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


def good_nodes(root):
    """Count nodes with no bigger value on the path from the root to them.
    Pass the largest value seen so far down the DFS. O(n)."""
    def dfs(node, best):
        if not node:
            return 0
        good = 1 if node.val >= best else 0
        best = max(best, node.val)
        return good + dfs(node.left, best) + dfs(node.right, best)

    return dfs(root, root.val)


print(good_nodes(build([3, 1, 4, 3, None, 1, 5])))  # 4
