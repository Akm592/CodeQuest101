from collections import deque


def oranges_rotting(grid):
    """Multi-source BFS: every rotten orange starts in the queue, and each
    BFS level is one minute. Count fresh oranges down as they rot."""
    q, fresh, time = deque(), 0, 0
    rows, cols = len(grid), len(grid[0])
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                fresh += 1
            elif grid[r][c] == 2:
                q.append((r, c))

    while q and fresh > 0:
        for _ in range(len(q)):  # one minute
            r, c = q.popleft()
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                    grid[nr][nc] = 2
                    q.append((nr, nc))
                    fresh -= 1
        time += 1
    return time if fresh == 0 else -1


print(oranges_rotting([[2, 1, 1], [1, 1, 0], [0, 1, 1]]))  # 4
