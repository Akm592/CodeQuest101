import heapq
from collections import defaultdict


def network_delay_time(times, n, k):
    """Dijkstra from k: the smallest time popped from the heap is final.
    The answer is the time the last node hears the signal."""
    edges = defaultdict(list)
    for u, v, w in times:
        edges[u].append((v, w))
    min_heap, visit, t = [(0, k)], set(), 0
    while min_heap:
        w1, n1 = heapq.heappop(min_heap)
        if n1 in visit:
            continue  # an older, slower entry
        visit.add(n1)
        t = w1
        for n2, w2 in edges[n1]:
            if n2 not in visit:
                heapq.heappush(min_heap, (w1 + w2, n2))
    return t if len(visit) == n else -1


print(network_delay_time([[2, 1, 1], [2, 3, 1], [3, 4, 1]], 4, 2))  # 2
