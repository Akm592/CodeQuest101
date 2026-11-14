def can_attend_meetings(intervals):
    """Sorted by start, any overlap shows up between neighbours."""
    intervals.sort(key=lambda i: i[0])
    for i in range(1, len(intervals)):
        if intervals[i - 1][1] > intervals[i][0]:
            return False
    return True


print(can_attend_meetings([[0, 30], [5, 10], [15, 20]]), can_attend_meetings([[7, 10], [2, 4]]))  # False True
