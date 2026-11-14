import heapq


def min_interval(intervals, queries):
    """Answer queries in increasing order with a min-heap of (size, end):
    push intervals that have started, pop ones that have ended."""
    intervals.sort()
    min_heap, res, i = [], {}, 0
    for q in sorted(queries):
        while i < len(intervals) and intervals[i][0] <= q:
            l, r = intervals[i]
            heapq.heappush(min_heap, (r - l + 1, r))
            i += 1
        while min_heap and min_heap[0][1] < q:
            heapq.heappop(min_heap)
        res[q] = min_heap[0][0] if min_heap else -1
    return [res[q] for q in queries]


print(min_interval([[1, 4], [2, 4], [3, 6], [4, 4]], [2, 3, 4, 5]))  # [3, 3, 1, 4]
