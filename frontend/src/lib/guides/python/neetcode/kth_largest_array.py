import heapq
import random


def find_kth_largest(nums, k):
    """A min-heap of the k largest values; its top is the kth largest. O(n log k)."""
    heap = []
    for n in nums:
        heapq.heappush(heap, n)
        if len(heap) > k:
            heapq.heappop(heap)
    return heap[0]


def quickselect(nums, k):
    """NeetCode's video: partition like quicksort and recurse into one side
    only. The kth largest sits at index len(nums) - k once sorted. O(n) on average."""
    target = len(nums) - k
    nums = nums[:]

    def select(lo, hi):
        p = random.randint(lo, hi)  # a random pivot avoids the sorted-input worst case
        nums[p], nums[hi] = nums[hi], nums[p]
        pivot, store = nums[hi], lo
        for i in range(lo, hi):
            if nums[i] <= pivot:
                nums[store], nums[i] = nums[i], nums[store]
                store += 1
        nums[store], nums[hi] = nums[hi], nums[store]
        if store > target:
            return select(lo, store - 1)
        if store < target:
            return select(store + 1, hi)
        return nums[store]

    return select(0, len(nums) - 1)


print(find_kth_largest([3, 2, 1, 5, 6, 4], 2), quickselect([3, 2, 3, 1, 2, 4, 5, 5, 6], 4))  # 5 4
