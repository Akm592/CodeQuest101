def num_distinct(s, t):
    """dfs(i, j) = ways s[i:] contains t[j:]: skip s[i], plus use it when it
    equals t[j]. Memoised on (i, j)."""
    cache = {}

    def dfs(i, j):
        if j == len(t):
            return 1
        if i == len(s):
            return 0
        if (i, j) in cache:
            return cache[(i, j)]
        res = dfs(i + 1, j)
        if s[i] == t[j]:
            res += dfs(i + 1, j + 1)
        cache[(i, j)] = res
        return res

    return dfs(0, 0)


print(num_distinct("rabbbit", "rabbit"), num_distinct("babgbag", "bag"))  # 3 5
