def erase_overlap_intervals(intervals):
    """Sort by start. On an overlap, remove the interval that ends later
    (keep the smaller end), and count the removal."""
    intervals.sort()
    res = 0
    prev_end = intervals[0][1]
    for start, end in intervals[1:]:
        if start >= prev_end:
            prev_end = end
        else:
            res += 1
            prev_end = min(end, prev_end)
    return res


print(erase_overlap_intervals([[1, 2], [2, 3], [3, 4], [1, 3]]))  # 1
