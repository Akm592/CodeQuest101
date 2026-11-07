def longest_consecutive(nums):
    """Length of the longest run of consecutive integers. O(n) time."""
    present = set(nums)
    best = 0
    for n in present:
        if n - 1 in present:  # not the start of a run; its start will count it
            continue
        length = 1
        while n + length in present:
            length += 1
        best = max(best, length)
    return best


print(longest_consecutive([100, 4, 200, 1, 3, 2]))  # 4
