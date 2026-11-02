def edit_distance(a: str, b: str) -> int:
    """Fewest single-character inserts, deletes and replaces that turn a into b."""
    m, n = len(a), len(b)

    # dp[i][j] = edit distance between the prefixes a[:i] and b[:j].
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i  # turn a[:i] into "": delete all i characters
    for j in range(n + 1):
        dp[0][j] = j  # turn "" into b[:j]: insert all j characters

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]  # letters match: no edit needed
            else:
                dp[i][j] = 1 + min(
                    dp[i - 1][j - 1],  # replace a[i-1] with b[j-1]
                    dp[i - 1][j],      # delete a[i-1]
                    dp[i][j - 1],      # insert b[j-1]
                )

    return dp[m][n]


print(edit_distance("kitten", "sitting"))  # 3
