def search_matrix(matrix, target):
    """Each row is sorted and starts after the previous row ends. Binary
    search for the row, then within it. O(log m + log n) time."""
    rows, cols = len(matrix), len(matrix[0])
    top, bot = 0, rows - 1
    while top <= bot:
        row = (top + bot) // 2
        if target > matrix[row][-1]:
            top = row + 1
        elif target < matrix[row][0]:
            bot = row - 1
        else:
            break  # target is within this row's range
    if not top <= bot:
        return False

    row = (top + bot) // 2
    l, r = 0, cols - 1
    while l <= r:
        m = (l + r) // 2
        if target > matrix[row][m]:
            l = m + 1
        elif target < matrix[row][m]:
            r = m - 1
        else:
            return True
    return False


print(search_matrix([[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 3))   # True
print(search_matrix([[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 13))  # False
