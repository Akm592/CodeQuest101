import heapq


def last_stone_weight(stones):
    """Smash the two heaviest stones until at most one is left. heapq is a
    min-heap, so store negated weights: the most negative is the heaviest."""
    stones = [-s for s in stones]
    heapq.heapify(stones)
    while len(stones) > 1:
        first = -heapq.heappop(stones)
        second = -heapq.heappop(stones)
        if first > second:
            heapq.heappush(stones, -(first - second))
    return -stones[0] if stones else 0


print(last_stone_weight([2, 7, 4, 1, 8, 1]))  # 1
