def insert(intervals, new_interval):
    """One pass over the sorted intervals: copy the ones before, absorb the
    overlapping ones, and stop at the first one after."""
    res = []
    for i in range(len(intervals)):
        if new_interval[1] < intervals[i][0]:
            res.append(new_interval)
            return res + intervals[i:]
        elif new_interval[0] > intervals[i][1]:
            res.append(intervals[i])
        else:
            new_interval = [min(new_interval[0], intervals[i][0]), max(new_interval[1], intervals[i][1])]
    res.append(new_interval)
    return res


print(insert([[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8]))  # [[1, 2], [3, 10], [12, 16]]
