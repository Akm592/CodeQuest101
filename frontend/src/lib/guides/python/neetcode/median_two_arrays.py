def find_median_sorted_arrays(a, b):
    """Median of two sorted lists in O(log(min(m, n))) time. Binary search
    how many items of the shorter list go in the left half; the rest of the
    left half comes from the other list. The split is right when every value
    on the left is <= every value on the right."""
    if len(a) > len(b):
        a, b = b, a  # search the shorter list
    total = len(a) + len(b)
    half = (total + 1) // 2
    l, r = 0, len(a)
    while True:
        i = (l + r) // 2  # items taken from a
        j = half - i  # items taken from b
        a_left = a[i - 1] if i > 0 else float("-inf")
        a_right = a[i] if i < len(a) else float("inf")
        b_left = b[j - 1] if j > 0 else float("-inf")
        b_right = b[j] if j < len(b) else float("inf")
        if a_left <= b_right and b_left <= a_right:
            if total % 2:
                return max(a_left, b_left)
            return (max(a_left, b_left) + min(a_right, b_right)) / 2
        if a_left > b_right:
            r = i - 1  # took too many from a
        else:
            l = i + 1  # took too few from a


print(find_median_sorted_arrays([1, 3], [2]))     # 2
print(find_median_sorted_arrays([1, 2], [3, 4]))  # 2.5
