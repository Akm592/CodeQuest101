def valid_tree(n, edges):
    """A tree is connected with no cycle. DFS from 0, skipping the node we
    came from; any other visited neighbour is a cycle. Then every node must
    have been reached."""
    if not n:
        return True
    adj = {i: [] for i in range(n)}
    for a, b in edges:
        adj[a].append(b)
        adj[b].append(a)
    visit = set()

    def dfs(i, prev):
        if i in visit:
            return False
        visit.add(i)
        for j in adj[i]:
            if j == prev:
                continue
            if not dfs(j, i):
                return False
        return True

    return dfs(0, -1) and n == len(visit)


print(valid_tree(5, [[0, 1], [0, 2], [0, 3], [1, 4]]), valid_tree(5, [[0, 1], [1, 2], [2, 3], [1, 3], [1, 4]]))  # True False
