def unique_paths(m, n):
    """paths(r, c) = paths(r + 1, c) + paths(r, c + 1), filled from the
    bottom-right one row at a time; the bottom row is all 1s."""
    row = [1] * n
    for _ in range(m - 1):
        new_row = [1] * n
        for j in range(n - 2, -1, -1):
            new_row[j] = new_row[j + 1] + row[j]
        row = new_row
    return row[0]


print(unique_paths(3, 7))  # 28
