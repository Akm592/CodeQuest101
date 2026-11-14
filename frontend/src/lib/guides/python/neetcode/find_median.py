import heapq


class MedianFinder:
    """small: a max-heap (negated) of the lower half. large: a min-heap of
    the upper half. The median is a top, or the average of both tops."""

    def __init__(self):
        self.small, self.large = [], []

    def addNum(self, num):
        heapq.heappush(self.small, -num)
        # keep the halves in order: everything in small <= everything in large
        if self.large and -self.small[0] > self.large[0]:
            heapq.heappush(self.large, -heapq.heappop(self.small))
        # keep the sizes within one of each other
        if len(self.small) > len(self.large) + 1:
            heapq.heappush(self.large, -heapq.heappop(self.small))
        if len(self.large) > len(self.small) + 1:
            heapq.heappush(self.small, -heapq.heappop(self.large))

    def findMedian(self):
        if len(self.small) > len(self.large):
            return -self.small[0]
        if len(self.large) > len(self.small):
            return self.large[0]
        return (-self.small[0] + self.large[0]) / 2


m = MedianFinder()
m.addNum(1); m.addNum(2)
print(m.findMedian())  # 1.5
m.addNum(3)
print(m.findMedian())  # 2
