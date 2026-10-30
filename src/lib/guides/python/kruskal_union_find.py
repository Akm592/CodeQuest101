class UnionFind:
    """Disjoint sets with path compression and union by rank."""

    def __init__(self, items):
        self.parent = {x: x for x in items}  # every item starts as its own set
        self.rank = {x: 0 for x in items}

    def find(self, x):
        """The representative (root) of x's set."""
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]  # path halving
            x = self.parent[x]
        return x

    def union(self, a, b) -> bool:
        """Merge the sets of a and b. False if they were already one set."""
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        if self.rank[ra] < self.rank[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra  # hang the shorter tree under the taller one
        if self.rank[ra] == self.rank[rb]:
            self.rank[ra] += 1
        return True


def kruskal(nodes, edges):
    """Minimum spanning tree. edges are (u, v, weight); returns the edges kept."""
    uf = UnionFind(nodes)
    tree = []
    for u, v, w in sorted(edges, key=lambda e: e[2]):  # cheapest first
        if uf.union(u, v):  # different sets: keeping it cannot make a cycle
            tree.append((u, v, w))
    return tree


edges = [("A", "B", 2), ("A", "C", 3), ("B", "C", 1), ("B", "D", 4),
         ("C", "E", 6), ("D", "E", 5), ("D", "F", 7), ("E", "F", 2)]
tree = kruskal("ABCDEF", edges)
print(tree, sum(w for _, _, w in tree))  # total weight 14
