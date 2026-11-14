def find_cheapest_price(n, flights, src, dst, k):
    """Bellman-Ford limited to k + 1 rounds: after round r, prices[c] is the
    cheapest way to c with at most r flights. Each round writes to a copy."""
    prices = [float("inf")] * n
    prices[src] = 0
    for _ in range(k + 1):
        tmp = prices.copy()
        for s, d, p in flights:
            if prices[s] != float("inf") and prices[s] + p < tmp[d]:
                tmp[d] = prices[s] + p
        prices = tmp
    return -1 if prices[dst] == float("inf") else prices[dst]


print(find_cheapest_price(4, [[0, 1, 100], [1, 2, 100], [2, 0, 100], [1, 3, 600], [2, 3, 200]], 0, 3, 1))  # 700
