class Node:
    def __init__(self, val=0, neighbors=None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []


def clone_graph(node):
    """A map from each old node to its copy. Store the copy before visiting
    the neighbours, so a cycle finds it instead of recursing forever."""
    old_to_new = {}

    def dfs(node):
        if node in old_to_new:
            return old_to_new[node]
        copy = Node(node.val)
        old_to_new[node] = copy
        for nei in node.neighbors:
            copy.neighbors.append(dfs(nei))
        return copy

    return dfs(node) if node else None


def build(adj):
    """Nodes 1..n from LeetCode's adjacency-list format."""
    nodes = [Node(i + 1) for i in range(len(adj))]
    for i, nbrs in enumerate(adj):
        nodes[i].neighbors = [nodes[j - 1] for j in nbrs]
    return nodes[0] if nodes else None


def to_adj(node):
    seen, order = {}, []
    stack = [node] if node else []
    while stack:
        n = stack.pop()
        if n.val in seen:
            continue
        seen[n.val] = n
        stack.extend(n.neighbors)
    return [[m.val for m in seen[v].neighbors] for v in sorted(seen)]


square = build([[2, 4], [1, 3], [2, 4], [1, 3]])
copy = clone_graph(square)
print(to_adj(copy), copy is not square)  # [[2, 4], [1, 3], [2, 4], [1, 3]] True
