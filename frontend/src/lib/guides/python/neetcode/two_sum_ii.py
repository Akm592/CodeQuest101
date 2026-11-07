def two_sum_sorted(numbers, target):
    """numbers is sorted. Return the 1-based positions of the two numbers
    that add up to target. O(n) time, O(1) space."""
    l, r = 0, len(numbers) - 1
    while l < r:
        total = numbers[l] + numbers[r]
        if total < target:
            l += 1  # need a bigger sum: only moving l right can give one
        elif total > target:
            r -= 1  # need a smaller sum: only moving r left can give one
        else:
            return [l + 1, r + 1]
    return []


print(two_sum_sorted([2, 7, 11, 15], 9))  # [1, 2]
