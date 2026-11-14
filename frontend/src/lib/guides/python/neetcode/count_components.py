def count_components(n, edges):
    """Start with n components; every edge that joins two different roots
    merges two components into one."""
    par, rank = list(range(n)), [1] * n

    def find(x):
        while x != par[x]:
            par[x] = par[par[x]]
            x = par[x]
        return x

    def union(a, b):
        p1, p2 = find(a), find(b)
        if p1 == p2:
            return 0
        if rank[p1] < rank[p2]:
            p1, p2 = p2, p1
        par[p2] = p1
        rank[p1] += rank[p2]
        return 1

    res = n
    for a, b in edges:
        res -= union(a, b)
    return res


print(count_components(5, [[0, 1], [1, 2], [3, 4]]))  # 2
