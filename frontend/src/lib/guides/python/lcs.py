def longest_common_subsequence(a: str, b: str) -> str:
    """The longest sequence of characters appearing in both strings, in order."""
    m, n = len(a), len(b)

    # dp[i][j] = LCS length of the prefixes a[:i] and b[:j].
    # Row 0 and column 0 stay 0: an empty string shares nothing.
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1  # match: extend the diagonal
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])  # drop one letter

    # The table only holds lengths. Walk back from the corner to recover
    # which characters made up the answer.
    out = []
    i, j = m, n
    while i > 0 and j > 0:
        if a[i - 1] == b[j - 1]:
            out.append(a[i - 1])
            i -= 1
            j -= 1
        elif dp[i - 1][j] >= dp[i][j - 1]:
            i -= 1
        else:
            j -= 1
    return "".join(reversed(out))


print(longest_common_subsequence("kitten", "sitting"))  # "ittn"
