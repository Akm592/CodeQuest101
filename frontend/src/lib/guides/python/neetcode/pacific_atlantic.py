def pacific_atlantic(heights):
    """Search backwards from each ocean's edge cells, climbing to neighbours
    at least as high. Cells reached from both oceans are the answer."""
    rows, cols = len(heights), len(heights[0])
    pac, atl = set(), set()

    def dfs(r, c, visit, prev):
        if ((r, c) in visit or r < 0 or c < 0 or r == rows or c == cols
                or heights[r][c] < prev):
            return
        visit.add((r, c))
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            dfs(r + dr, c + dc, visit, heights[r][c])

    for c in range(cols):
        dfs(0, c, pac, heights[0][c])
        dfs(rows - 1, c, atl, heights[rows - 1][c])
    for r in range(rows):
        dfs(r, 0, pac, heights[r][0])
        dfs(r, cols - 1, atl, heights[r][cols - 1])
    return [[r, c] for r in range(rows) for c in range(cols) if (r, c) in pac and (r, c) in atl]


print(pacific_atlantic([[1, 2, 2, 3, 5], [3, 2, 3, 4, 4], [2, 4, 5, 3, 1], [6, 7, 1, 4, 5], [5, 1, 1, 2, 4]]))
# [[0, 4], [1, 3], [1, 4], [2, 2], [3, 0], [3, 1], [4, 0]]
