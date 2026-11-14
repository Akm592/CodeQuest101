def min_distance(word1, word2):
    """dp[i][j] = edits to turn word1[i:] into word2[j:]. A match costs
    nothing; otherwise 1 + the cheapest of delete, insert and replace."""
    m, n = len(word1), len(word2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for j in range(n + 1):
        dp[m][j] = n - j
    for i in range(m + 1):
        dp[i][n] = m - i
    for i in range(m - 1, -1, -1):
        for j in range(n - 1, -1, -1):
            if word1[i] == word2[j]:
                dp[i][j] = dp[i + 1][j + 1]
            else:
                dp[i][j] = 1 + min(dp[i + 1][j], dp[i][j + 1], dp[i + 1][j + 1])
    return dp[0][0]


print(min_distance("horse", "ros"), min_distance("intention", "execution"))  # 3 5
