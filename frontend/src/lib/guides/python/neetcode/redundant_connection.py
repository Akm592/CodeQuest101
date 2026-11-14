def find_redundant_connection(edges):
    """Union-find: the first edge whose ends already share a root closes a
    cycle, so it's the redundant one."""
    par = list(range(len(edges) + 1))
    rank = [1] * (len(edges) + 1)

    def find(n):
        while n != par[n]:
            par[n] = par[par[n]]  # path compression (halving)
            n = par[n]
        return n

    def union(a, b):
        p1, p2 = find(a), find(b)
        if p1 == p2:
            return False
        if rank[p1] < rank[p2]:
            p1, p2 = p2, p1
        par[p2] = p1
        rank[p1] += rank[p2]
        return True

    for a, b in edges:
        if not union(a, b):
            return [a, b]


print(find_redundant_connection([[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]]))  # [1, 4]
