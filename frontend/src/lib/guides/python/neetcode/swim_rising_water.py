import heapq


def swim_in_water(grid):
    """Dijkstra where a route's cost is its highest cell: push neighbours
    with max(level so far, their height) and pop the lowest."""
    n = len(grid)
    visit = {(0, 0)}
    min_h = [[grid[0][0], 0, 0]]  # (water level needed, r, c)
    while min_h:
        t, r, c = heapq.heappop(min_h)
        if r == n - 1 and c == n - 1:
            return t
        for dr, dc in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < n and 0 <= nc < n and (nr, nc) not in visit:
                visit.add((nr, nc))
                heapq.heappush(min_h, [max(t, grid[nr][nc]), nr, nc])


print(swim_in_water([[0, 2], [1, 3]]))  # 3
