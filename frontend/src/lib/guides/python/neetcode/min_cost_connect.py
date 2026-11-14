import heapq


def min_cost_connect_points(points):
    """Prim's algorithm: grow one tree from point 0, always adding the
    cheapest point outside it (Manhattan distance)."""
    n = len(points)
    adj = {i: [] for i in range(n)}
    for i in range(n):
        x1, y1 = points[i]
        for j in range(i + 1, n):
            x2, y2 = points[j]
            d = abs(x1 - x2) + abs(y1 - y2)
            adj[i].append([d, j])
            adj[j].append([d, i])
    res, visit, min_heap = 0, set(), [[0, 0]]
    while len(visit) < n:
        cost, i = heapq.heappop(min_heap)
        if i in visit:
            continue
        res += cost
        visit.add(i)
        for nei_cost, nei in adj[i]:
            if nei not in visit:
                heapq.heappush(min_heap, [nei_cost, nei])
    return res


print(min_cost_connect_points([[0, 0], [2, 2], [3, 10], [5, 2], [7, 0]]))  # 20
