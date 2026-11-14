def merge_triplets(triplets, target):
    """Skip any triplet with a value above the target (merging only raises
    values). The rest are safe; check they supply every target value."""
    good = set()
    for t in triplets:
        if t[0] > target[0] or t[1] > target[1] or t[2] > target[2]:
            continue
        for i, v in enumerate(t):
            if v == target[i]:
                good.add(i)
    return len(good) == 3


print(merge_triplets([[2, 5, 3], [1, 8, 4], [1, 7, 5]], [2, 7, 5]))  # True
