def change(amount, coins):
    """dp[a] = combinations making a. Looping coins outside means each
    combination is counted once, in coin order."""
    dp = [0] * (amount + 1)
    dp[0] = 1
    for c in coins:
        for a in range(c, amount + 1):
            dp[a] += dp[a - c]
    return dp[amount]


print(change(5, [1, 2, 5]), change(3, [2]))  # 4 0
