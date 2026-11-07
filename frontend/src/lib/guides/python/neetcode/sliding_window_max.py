from collections import deque


def max_sliding_window(nums, k):
    """The maximum of every window of size k. The deque holds indices whose
    values are decreasing, so the front is always the window's max. O(n) time."""
    out, q = [], deque()
    for r, x in enumerate(nums):
        while q and nums[q[-1]] < x:  # smaller, older values can never win again
            q.pop()
        q.append(r)
        if q[0] <= r - k:  # the front has slid out of the window
            q.popleft()
        if r >= k - 1:
            out.append(nums[q[0]])
    return out


print(max_sliding_window([1, 3, -1, -3, 5, 3, 6, 7], 3))  # [3, 3, 5, 5, 6, 7]
