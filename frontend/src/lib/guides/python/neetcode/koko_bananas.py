import math


def min_eating_speed(piles, h):
    """Slowest whole-number speed k (bananas per hour) that finishes every pile
    within h hours. Faster always works if slower does, so binary search k
    between 1 and the biggest pile. O(n log max(piles)) time."""
    l, r = 1, max(piles)
    best = r
    while l <= r:
        k = (l + r) // 2
        hours = sum(math.ceil(p / k) for p in piles)
        if hours <= h:
            best = k  # fast enough: try slower
            r = k - 1
        else:
            l = k + 1  # too slow: must go faster
    return best


print(min_eating_speed([3, 6, 7, 11], 8))         # 4
print(min_eating_speed([30, 11, 23, 4, 20], 6))   # 23
