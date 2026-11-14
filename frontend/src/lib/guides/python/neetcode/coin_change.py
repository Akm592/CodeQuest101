def coin_change(coins, amount):
    """dp[a] = fewest coins for amount a = 1 + min over coins c of dp[a - c].
    amount + 1 stands for "impossible"."""
    dp = [amount + 1] * (amount + 1)
    dp[0] = 0
    for a in range(1, amount + 1):
        for c in coins:
            if a - c >= 0:
                dp[a] = min(dp[a], 1 + dp[a - c])
    return dp[amount] if dp[amount] != amount + 1 else -1


print(coin_change([1, 2, 5], 11), coin_change([1, 3, 4], 6), coin_change([2], 3))  # 3 2 -1
