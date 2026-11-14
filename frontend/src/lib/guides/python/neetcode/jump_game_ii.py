def jump(nums):
    """BFS in windows: l..r is everything reachable with res jumps; the next
    window runs to the farthest point any of them can reach."""
    res, l, r = 0, 0, 0
    while r < len(nums) - 1:
        farthest = max(i + nums[i] for i in range(l, r + 1))
        l, r = r + 1, farthest
        res += 1
    return res


print(jump([2, 3, 1, 1, 4]))  # 2
