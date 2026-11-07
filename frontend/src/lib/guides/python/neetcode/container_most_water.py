def max_area(height):
    """Two walls that hold the most water. Start at both ends and always
    move the shorter wall inwards. O(n) time, O(1) space."""
    l, r = 0, len(height) - 1
    best = 0
    while l < r:
        best = max(best, min(height[l], height[r]) * (r - l))
        if height[l] < height[r]:
            l += 1
        else:
            r -= 1
    return best


print(max_area([1, 8, 6, 2, 5, 4, 8, 3, 7]))  # 49
