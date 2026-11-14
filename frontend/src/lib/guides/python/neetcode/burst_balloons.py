def max_coins(nums):
    """Pick the LAST balloon to burst in each range l..r: its neighbours are
    then the fixed balloons just outside, and the two sides are independent."""
    nums = [1] + nums + [1]
    dp = {}

    def dfs(l, r):
        if l > r:
            return 0
        if (l, r) in dp:
            return dp[(l, r)]
        dp[(l, r)] = 0
        for i in range(l, r + 1):
            coins = nums[l - 1] * nums[i] * nums[r + 1]
            coins += dfs(l, i - 1) + dfs(i + 1, r)
            dp[(l, r)] = max(dp[(l, r)], coins)
        return dp[(l, r)]

    return dfs(1, len(nums) - 2)


print(max_coins([3, 1, 5, 8]))  # 167
