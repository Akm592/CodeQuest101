import heapq


def k_closest(points, k):
    """Keep the k closest points in a max-heap by squared distance (negated
    for heapq), so the farthest kept point is on top and easy to throw out."""
    heap = []
    for x, y in points:
        heapq.heappush(heap, (-(x * x + y * y), x, y))
        if len(heap) > k:
            heapq.heappop(heap)  # the farthest of the k + 1
    return [[x, y] for _, x, y in heap]


def k_closest_heapify(points, k):
    """NeetCode's video: heapify every point by distance, then pop k times."""
    heap = [(x * x + y * y, x, y) for x, y in points]
    heapq.heapify(heap)
    return [list(heapq.heappop(heap)[1:]) for _ in range(k)]


print(sorted(k_closest([[3, 3], [5, -1], [-2, 4]], 2)))  # [[-2, 4], [3, 3]]
