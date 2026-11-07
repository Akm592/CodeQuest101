def is_valid_sudoku(board):
    """True if no row, column or 3x3 box repeats a digit (empty cells are '.').
    One pass with a set per row, column and box."""
    rows = [set() for _ in range(9)]
    cols = [set() for _ in range(9)]
    boxes = [set() for _ in range(9)]
    for r in range(9):
        for c in range(9):
            d = board[r][c]
            if d == ".":
                continue
            b = (r // 3) * 3 + c // 3
            if d in rows[r] or d in cols[c] or d in boxes[b]:
                return False
            rows[r].add(d)
            cols[c].add(d)
            boxes[b].add(d)
    return True


empty = [["."] * 9 for _ in range(9)]
empty[0][0] = empty[1][1] = "5"  # same box
print(is_valid_sudoku(empty))  # False
