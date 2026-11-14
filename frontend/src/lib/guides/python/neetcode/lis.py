def length_of_lis(nums):
    """LIS[i] = longest increasing subsequence starting at i: 1, or 1 plus
    the best LIS of a later, bigger number. Fill from the right."""
    LIS = [1] * len(nums)
    for i in range(len(nums) - 1, -1, -1):
        for j in range(i + 1, len(nums)):
            if nums[i] < nums[j]:
                LIS[i] = max(LIS[i], 1 + LIS[j])
    return max(LIS)


print(length_of_lis([10, 9, 2, 5, 3, 7, 101, 18]))  # 4
