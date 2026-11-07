def largest_rectangle_area(heights):
    """Largest rectangle in a histogram. The stack holds (start, height) with
    heights increasing; a lower bar ends every taller rectangle. O(n)."""
    best = 0
    stack = []  # (index where this height starts, height)
    for i, h in enumerate(heights):
        start = i
        while stack and stack[-1][1] > h:
            j, height = stack.pop()
            best = max(best, height * (i - j))
            start = j  # the lower bar can extend back to here
        stack.append((start, h))
    for j, height in stack:  # these reach all the way to the end
        best = max(best, height * (len(heights) - j))
    return best


print(largest_rectangle_area([2, 1, 5, 6, 2, 3]))  # 10
