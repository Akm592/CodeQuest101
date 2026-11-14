def max_sub_array(nums):
    """Kadane: extend the running sum, but drop it first if it's negative
    (a negative prefix can only make what follows smaller)."""
    max_sub, cur_sum = nums[0], 0
    for n in nums:
        if cur_sum < 0:
            cur_sum = 0
        cur_sum += n
        max_sub = max(max_sub, cur_sum)
    return max_sub


print(max_sub_array([-2, 1, -3, 4, -1, 2, 1, -5, 4]))  # 6
