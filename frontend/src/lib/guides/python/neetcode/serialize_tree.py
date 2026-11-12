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


class Codec:
    """Turn a tree into a string and back. Preorder, writing N for every
    missing child, records the shape exactly. O(n) both ways."""

    def serialize(self, root):
        out = []

        def dfs(node):
            if not node:
                out.append("N")
                return
            out.append(str(node.val))
            dfs(node.left)
            dfs(node.right)

        dfs(root)
        return ",".join(out)

    def deserialize(self, data):
        tokens = iter(data.split(","))

        def dfs():
            t = next(tokens)
            if t == "N":
                return None
            node = TreeNode(int(t))
            node.left = dfs()
            node.right = dfs()
            return node

        return dfs()


c = Codec()
s = c.serialize(build([1, 2, 3, None, None, 4, 5]))
print(s)                             # 1,2,N,N,3,4,N,N,5,N,N
print(to_level(c.deserialize(s)))    # [1, 2, 3, None, None, 4, 5]
