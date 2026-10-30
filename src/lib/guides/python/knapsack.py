def knapsack(items: list[tuple[str, int, int]], capacity: int) -> tuple[int, list[str]]:
    """0/1 knapsack. items are (label, weight, value); each is taken at most once.

    Returns the best total value and the labels of the items taken.
    """
    n = len(items)

    # dp[i][c] = best value using only the first i items with capacity c.
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        _, weight, value = items[i - 1]
        for c in range(capacity + 1):
            dp[i][c] = dp[i - 1][c]  # skip item i: same as without it
            if weight <= c:
                # take item i: its value plus the best for the room left over
                dp[i][c] = max(dp[i][c], dp[i - 1][c - weight] + value)

    # Trace back: if a row changed the value, that item was taken.
    taken = []
    c = capacity
    for i in range(n, 0, -1):
        if dp[i][c] != dp[i - 1][c]:
            label, weight, _ = items[i - 1]
            taken.append(label)
            c -= weight
    return dp[n][capacity], taken[::-1]


items = [("A", 5, 10), ("B", 4, 40), ("C", 6, 30), ("D", 3, 50)]
print(knapsack(items, 10))  # (90, ['B', 'D'])
