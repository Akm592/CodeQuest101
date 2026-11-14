import heapq
from collections import Counter, deque


def least_interval(tasks, n):
    """Greedy: always run the available task with the most copies left. A
    max-heap (negated counts) holds tasks that can run now; a queue holds
    tasks cooling down, with the time they become available."""
    heap = [-c for c in Counter(tasks).values()]
    heapq.heapify(heap)
    q = deque()  # [-count left, time it can run again]
    time = 0
    while heap or q:
        time += 1
        if not heap:
            time = q[0][1]  # idle until the next task is ready
        else:
            cnt = 1 + heapq.heappop(heap)  # one fewer copy (counts are negative)
            if cnt:
                q.append([cnt, time + n])
        if q and q[0][1] == time:
            heapq.heappush(heap, q.popleft()[0])
    return time


print(least_interval(list("AAABBB"), 2))  # 8
