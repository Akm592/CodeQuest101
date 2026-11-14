def max_profit(prices):
    """States: (day, free to buy or holding). Buy, sell (then skip a day for
    the cooldown) or wait. Memoised."""
    dp = {}

    def dfs(i, buying):
        if i >= len(prices):
            return 0
        if (i, buying) in dp:
            return dp[(i, buying)]
        cooldown = dfs(i + 1, buying)
        if buying:
            act = dfs(i + 1, not buying) - prices[i]
        else:
            act = dfs(i + 2, not buying) + prices[i]
        dp[(i, buying)] = max(act, cooldown)
        return dp[(i, buying)]

    return dfs(0, True)


print(max_profit([1, 2, 3, 0, 2]))  # 3
