def max_profit(prices):
    """Best profit from one buy followed by one later sell (0 if none).
    L is the cheapest day so far, R is the day we'd sell. O(n) time, O(1) space."""
    l, best = 0, 0
    for r in range(1, len(prices)):
        if prices[r] < prices[l]:
            l = r  # a cheaper day to buy: every later sale is better from here
        else:
            best = max(best, prices[r] - prices[l])
    return best


print(max_profit([7, 1, 5, 3, 6, 4]))  # 5 (buy at 1, sell at 6)
print(max_profit([7, 6, 4, 3, 1]))     # 0 (prices only fall)
