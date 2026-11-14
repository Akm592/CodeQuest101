def missing_number(nums):
    """(0 + 1 + ... + n) - sum(nums), folded into one loop."""
    res = len(nums)
    for i in range(len(nums)):
        res += i - nums[i]
    return res


print(missing_number([3, 0, 1]), missing_number([0, 1]))  # 2 2
