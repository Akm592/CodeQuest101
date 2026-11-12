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


def is_same_tree(p, q):
    if not p and not q:
        return True
    if not p or not q or p.val != q.val:
        return False
    return is_same_tree(p.left, q.left) and is_same_tree(p.right, q.right)


def is_subtree(root, sub):
    """True if some node's subtree is exactly sub. Try is_same_tree at every
    node of root. O(m * n) time."""
    if not sub:
        return True
    if not root:
        return False
    return is_same_tree(root, sub) or is_subtree(root.left, sub) or is_subtree(root.right, sub)


print(is_subtree(build([3, 4, 5, 1, 2]), build([4, 1, 2])))                          # True
print(is_subtree(build([3, 4, 5, 1, 2, None, None, None, None, 0]), build([4, 1, 2])))  # False
