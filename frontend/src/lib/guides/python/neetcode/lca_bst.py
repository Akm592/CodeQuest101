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


def lowest_common_ancestor(root, p, q):
    """In a BST, smaller values are left and bigger ones right. While p and q
    are both on the same side, go that way; where they split (or one of them
    is the current node), that's the lowest common ancestor. O(height)."""
    node = root
    while node:
        if p < node.val and q < node.val:
            node = node.left
        elif p > node.val and q > node.val:
            node = node.right
        else:
            return node.val


print(lowest_common_ancestor(build([6, 2, 8, 0, 4, 7, 9, None, None, 3, 5]), 2, 8))  # 6
print(lowest_common_ancestor(build([6, 2, 8, 0, 4, 7, 9, None, None, 3, 5]), 2, 4))  # 2
