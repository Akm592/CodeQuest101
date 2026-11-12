def find_min(nums):
    """Minimum of a sorted list (distinct values) rotated at some point.
    The minimum sits where the order breaks. O(log n) time."""
    res = nums[0]
    l, r = 0, len(nums) - 1
    while l <= r:
        if nums[l] < nums[r]:  # this part is sorted: its first value is its min
            res = min(res, nums[l])
            break
        m = (l + r) // 2
        res = min(res, nums[m])
        if nums[m] >= nums[l]:
            l = m + 1  # left part is sorted, so the break is on the right
        else:
            r = m - 1  # the break is at m or on the left
    return res


print(find_min([3, 4, 5, 1, 2]))        # 1
print(find_min([4, 5, 6, 7, 0, 1, 2]))  # 0
