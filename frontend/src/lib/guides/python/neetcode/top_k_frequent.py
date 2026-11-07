def top_k_frequent(nums, k):
    """The k most frequent values. Bucket sort by frequency: O(n) time."""
    count = {}
    for n in nums:
        count[n] = count.get(n, 0) + 1
    buckets = [[] for _ in range(len(nums) + 1)]  # buckets[f] = values seen f times
    for n, f in count.items():
        buckets[f].append(n)
    result = []
    for f in range(len(buckets) - 1, 0, -1):  # most frequent first
        for n in buckets[f]:
            result.append(n)
            if len(result) == k:
                return result
    return result


print(top_k_frequent([1, 1, 1, 2, 2, 3], 2))  # [1, 2]
