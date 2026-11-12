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


def max_path_sum(root):
    """Largest sum of any path (it needn't pass through the root). Each node
    returns the best sum of a path going down from it (never below 0: a
    negative branch is better left out), and the best path that bends at it
    is node + left gain + right gain. O(n)."""
    best = root.val

    def gain(node):
        nonlocal best
        if not node:
            return 0
        left = max(gain(node.left), 0)
        right = max(gain(node.right), 0)
        best = max(best, node.val + left + right)  # a path that bends here
        return node.val + max(left, right)  # a path that continues up

    gain(root)
    return best


print(max_path_sum(build([1, 2, 3])))                              # 6
print(max_path_sum(build([-10, 9, 20, None, None, 15, 7])))        # 42
