def set_zeroes(matrix):
    """Record the rows and columns that contain a 0 first, then zero them,
    so new zeros don't spread. (The O(1)-space version keeps these marks in
    the first row and column.)"""
    rows, cols = set(), set()
    for r, line in enumerate(matrix):
        for c, v in enumerate(line):
            if v == 0:
                rows.add(r)
                cols.add(c)
    for r in range(len(matrix)):
        for c in range(len(matrix[0])):
            if r in rows or c in cols:
                matrix[r][c] = 0


m = [[0, 1, 2, 0], [3, 4, 5, 2], [1, 3, 1, 5]]
set_zeroes(m)
print(m)  # [[0, 0, 0, 0], [0, 4, 5, 0], [0, 3, 1, 0]]
