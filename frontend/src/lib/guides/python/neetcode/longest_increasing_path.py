def longest_increasing_path(matrix):
    """lip(cell) = 1 + max lip(bigger neighbour), memoised. Increasing paths
    can't loop, so no visited set is needed."""
    rows, cols = len(matrix), len(matrix[0])
    dp = {}

    def dfs(r, c, prev):
        if r < 0 or r == rows or c < 0 or c == cols or matrix[r][c] <= prev:
            return 0
        if (r, c) in dp:
            return dp[(r, c)]
        res = 1
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            res = max(res, 1 + dfs(r + dr, c + dc, matrix[r][c]))
        dp[(r, c)] = res
        return res

    return max(dfs(r, c, -1) for r in range(rows) for c in range(cols))


print(longest_increasing_path([[9, 9, 4], [6, 6, 8], [2, 1, 1]]))  # 4
