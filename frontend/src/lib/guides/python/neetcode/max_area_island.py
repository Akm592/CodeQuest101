def max_area_of_island(grid):
    """dfs returns an island's area: 1 for the cell plus its neighbours'
    areas. Each island is measured once, from its first cell in the scan."""
    rows, cols = len(grid), len(grid[0])
    visit = set()

    def dfs(r, c):
        if (r < 0 or r == rows or c < 0 or c == cols
                or grid[r][c] == 0 or (r, c) in visit):
            return 0
        visit.add((r, c))
        return 1 + dfs(r + 1, c) + dfs(r - 1, c) + dfs(r, c + 1) + dfs(r, c - 1)

    return max((dfs(r, c) for r in range(rows) for c in range(cols)), default=0)


print(max_area_of_island([[1, 1, 0, 0, 0], [1, 1, 0, 1, 1], [0, 0, 0, 1, 0], [1, 0, 0, 1, 1]]))  # 5
