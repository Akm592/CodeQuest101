def partition_labels(s):
    """Stretch the current part to the last index of every letter in it;
    cut when the sweep reaches that end."""
    last = {c: i for i, c in enumerate(s)}
    res, size, end = [], 0, 0
    for i, c in enumerate(s):
        size += 1
        end = max(end, last[c])
        if i == end:
            res.append(size)
            size = 0
    return res


print(partition_labels("ababcbacadefegdehijhklij"))  # [9, 7, 8]
