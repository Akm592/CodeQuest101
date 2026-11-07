def two_sum(nums, target):
    """Indices of the two numbers that add up to target. O(n) time, O(n) space."""
    index_of = {}  # value -> index, for everything seen so far
    for i, n in enumerate(nums):
        need = target - n
        if need in index_of:
            return [index_of[need], i]
        index_of[n] = i
    return []


print(two_sum([2, 7, 11, 15], 9))  # [0, 1]
