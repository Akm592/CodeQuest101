def min_meeting_rooms(intervals):
    """Sweep the sorted start and end times: a start (before the next end)
    takes a room, an end frees one. The peak is the answer."""
    start = sorted(i[0] for i in intervals)
    end = sorted(i[1] for i in intervals)
    res = count = 0
    s = e = 0
    while s < len(intervals):
        if start[s] < end[e]:
            s += 1
            count += 1
        else:
            e += 1
            count -= 1
        res = max(res, count)
    return res


print(min_meeting_rooms([[0, 30], [5, 10], [15, 20]]))  # 2
