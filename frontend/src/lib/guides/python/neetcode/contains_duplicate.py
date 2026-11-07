def contains_duplicate(nums):
    """True if any value appears at least twice. O(n) time, O(n) space."""
    seen = set()
    for n in nums:
        if n in seen:
            return True
        seen.add(n)
    return False


print(contains_duplicate([1, 2, 3, 1]))  # True
print(contains_duplicate([1, 2, 3, 4]))  # False
