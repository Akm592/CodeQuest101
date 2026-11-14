def rob(nums):
    """In a circle the first and last houses can't both be robbed, so solve
    the straight problem without the first and without the last."""
    def helper(houses):
        rob1, rob2 = 0, 0
        for n in houses:
            rob1, rob2 = rob2, max(n + rob1, rob2)
        return rob2

    return max(nums[0], helper(nums[1:]), helper(nums[:-1]))


print(rob([2, 3, 2]), rob([1, 2, 3, 1]))  # 3 4
