def longest_common_subsequence(text1, text2):
    """dp[i][j] = LCS of text1[i:] and text2[j:]. A match takes 1 + the
    diagonal; otherwise the better of skipping a letter from either."""
    dp = [[0] * (len(text2) + 1) for _ in range(len(text1) + 1)]
    for i in range(len(text1) - 1, -1, -1):
        for j in range(len(text2) - 1, -1, -1):
            if text1[i] == text2[j]:
                dp[i][j] = 1 + dp[i + 1][j + 1]
            else:
                dp[i][j] = max(dp[i][j + 1], dp[i + 1][j])
    return dp[0][0]


print(longest_common_subsequence("abcde", "ace"))  # 3
