from collections import deque


def num_islands(grid):
    """Scan every cell; unvisited land starts a new island, which a BFS
    floods so none of its cells is counted again."""
    if not grid:
        return 0
    rows, cols = len(grid), len(grid[0])
    visit, islands = set(), 0

    def bfs(r, c):
        q = deque([(r, c)])
        visit.add((r, c))
        while q:
            row, col = q.popleft()
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = row + dr, col + dc
                if (0 <= nr < rows and 0 <= nc < cols
                        and grid[nr][nc] == "1" and (nr, nc) not in visit):
                    q.append((nr, nc))
                    visit.add((nr, nc))  # mark when queued, not when popped

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1" and (r, c) not in visit:
                bfs(r, c)
                islands += 1
    return islands


print(num_islands(["11000", "11000", "00100", "00011"]))  # 3
