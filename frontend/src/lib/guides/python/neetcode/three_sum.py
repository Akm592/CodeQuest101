def three_sum(nums):
    """All unique triplets that add up to 0. Sort, fix one number, then
    two pointers on the rest. O(n^2) time."""
    nums = sorted(nums)
    result = []
    for i, a in enumerate(nums):
        if i > 0 and a == nums[i - 1]:
            continue  # same first number as before: same triplets
        l, r = i + 1, len(nums) - 1
        while l < r:
            total = a + nums[l] + nums[r]
            if total < 0:
                l += 1
            elif total > 0:
                r -= 1
            else:
                result.append([a, nums[l], nums[r]])
                l += 1
                while l < r and nums[l] == nums[l - 1]:
                    l += 1  # skip repeats of the second number
    return result


print(three_sum([-1, 0, 1, 2, -1, -4]))  # [[-1, -1, 2], [-1, 0, 1]]
