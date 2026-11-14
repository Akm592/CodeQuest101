def max_product(nums):
    """Track the largest and the smallest product of a subarray ending here:
    a negative number swaps their roles."""
    res = max(nums)
    cur_min, cur_max = 1, 1
    for n in nums:
        tmp = n * cur_max
        cur_max = max(n * cur_max, n * cur_min, n)
        cur_min = min(tmp, n * cur_min, n)
        res = max(res, cur_max)
    return res


print(max_product([2, 3, -2, 4]), max_product([-2, 3, -4]))  # 6 24
