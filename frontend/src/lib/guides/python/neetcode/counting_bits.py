def count_bits(n):
    """bits[i] = 1 + bits[i - offset], where offset is the largest power of
    two <= i: i is that top bit plus a smaller number already counted."""
    dp = [0] * (n + 1)
    offset = 1
    for i in range(1, n + 1):
        if offset * 2 == i:
            offset = i
        dp[i] = 1 + dp[i - offset]
    return dp


print(count_bits(5))  # [0, 1, 1, 2, 1, 2]
