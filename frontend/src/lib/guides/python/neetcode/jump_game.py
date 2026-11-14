def can_jump(nums):
    """Move the goal left: any index that can reach the goal becomes the new
    goal. The end is reachable from the start if the goal gets to 0."""
    goal = len(nums) - 1
    for i in range(len(nums) - 2, -1, -1):
        if i + nums[i] >= goal:
            goal = i
    return goal == 0


print(can_jump([2, 3, 1, 1, 4]), can_jump([3, 2, 1, 0, 4]))  # True False
