def search(nums, target):
    """Index of target in the sorted list nums, or -1. Each step halves the
    range that could still hold it. O(log n) time."""
    l, r = 0, len(nums) - 1
    while l <= r:
        m = l + (r - l) // 2  # same as (l + r) // 2, without overflow in other languages
        if nums[m] < target:
            l = m + 1  # target can only be right of m
        elif nums[m] > target:
            r = m - 1  # target can only be left of m
        else:
            return m
    return -1


print(search([-1, 0, 3, 5, 9, 12], 9))  # 4
print(search([-1, 0, 3, 5, 9, 12], 2))  # -1
