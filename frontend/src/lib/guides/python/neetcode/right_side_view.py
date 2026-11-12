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


from collections import deque


def right_side_view(root):
    """The values you'd see from the right: the last node of every level.
    Same BFS as level order. O(n)."""
    out, queue = [], deque([root] if root else [])
    while queue:
        for _ in range(len(queue)):
            node = queue.popleft()
            queue.extend(c for c in (node.left, node.right) if c)
        out.append(node.val)  # the last node taken from this level
    return out


print(right_side_view(build([1, 2, 3, None, 5, None, 4])))  # [1, 3, 4]
