def rotate(matrix):
    """Rotate ring by ring; in each ring, four cells move together:
    top -> right -> bottom -> left -> top, with one saved value."""
    l, r = 0, len(matrix) - 1
    while l < r:
        for i in range(r - l):
            top, bottom = l, r
            top_left = matrix[top][l + i]
            matrix[top][l + i] = matrix[bottom - i][l]
            matrix[bottom - i][l] = matrix[bottom][r - i]
            matrix[bottom][r - i] = matrix[top + i][r]
            matrix[top + i][r] = top_left
        l, r = l + 1, r - 1


m = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
rotate(m)
print(m)  # [[7, 4, 1], [8, 5, 2], [9, 6, 3]]
