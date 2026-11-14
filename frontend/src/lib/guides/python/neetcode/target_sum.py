from collections import defaultdict


def find_target_sum_ways(nums, target):
    """Track how many sign choices reach each running total; each number
    moves every total up and down by its value."""
    dp = defaultdict(int)
    dp[0] = 1
    for n in nums:
        next_dp = defaultdict(int)
        for total, count in dp.items():
            next_dp[total + n] += count
            next_dp[total - n] += count
        dp = next_dp
    return dp[target]


print(find_target_sum_ways([1, 1, 1, 1, 1], 3))  # 5
