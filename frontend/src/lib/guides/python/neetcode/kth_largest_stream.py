import heapq


class KthLargest:
    """A min-heap of the k largest values seen. Its top is the kth largest."""

    def __init__(self, k, nums):
        self.k, self.heap = k, nums
        heapq.heapify(self.heap)
        while len(self.heap) > k:
            heapq.heappop(self.heap)

    def add(self, val):
        heapq.heappush(self.heap, val)
        if len(self.heap) > self.k:
            heapq.heappop(self.heap)  # the smallest can't be in the top k
        return self.heap[0]


kth = KthLargest(3, [4, 5, 8, 2])
print([kth.add(v) for v in [3, 5, 10, 9, 4]])  # [4, 5, 5, 8, 8]
