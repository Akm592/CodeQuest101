def can_partition(nums):
    """Two equal halves exist when some subset sums to half the total. Keep
    the set of sums reachable so far, adding each number to every sum."""
    if sum(nums) % 2:
        return False
    target = sum(nums) // 2
    dp = {0}
    for n in nums:
        dp = dp | {t + n for t in dp if t + n <= target}
        if target in dp:
            return True
    return False


print(can_partition([1, 5, 11, 5]), can_partition([1, 2, 3, 5]))  # True False
