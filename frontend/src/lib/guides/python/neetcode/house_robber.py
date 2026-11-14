def rob(nums):
    """best = max(skip this house, rob it + best from two houses back)."""
    rob1, rob2 = 0, 0  # best up to two houses back, best up to the last house
    for n in nums:
        rob1, rob2 = rob2, max(n + rob1, rob2)
    return rob2


print(rob([2, 7, 9, 3, 1]))  # 12
