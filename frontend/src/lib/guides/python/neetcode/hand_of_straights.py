import heapq
from collections import Counter


def is_n_straight_hand(hand, group_size):
    """The smallest card left must start a group: take smallest .. smallest +
    group_size - 1. A min-heap of distinct values finds the smallest."""
    if len(hand) % group_size:
        return False
    count = Counter(hand)
    min_h = list(count.keys())
    heapq.heapify(min_h)
    while min_h:
        first = min_h[0]
        for i in range(first, first + group_size):
            if i not in count:
                return False
            count[i] -= 1
            if count[i] == 0:
                if i != min_h[0]:
                    return False  # a smaller value would be left with no group
                heapq.heappop(min_h)
    return True


print(is_n_straight_hand([1, 2, 3, 6, 2, 3, 4, 7, 8], 3), is_n_straight_hand([1, 2, 3, 4, 5], 4))  # True False
