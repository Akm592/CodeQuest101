def solve_n_queens(n: int) -> list[list[int]]:
    """Every way to place n queens with no two attacking each other.

    Each solution lists the column of the queen in each row.
    """
    solutions: list[list[int]] = []
    queens: list[int] = []  # queens[r] = column of the queen in row r

    # Squares on one diagonal share row - col; on the other, row + col.
    # Sets make "is this square attacked?" O(1) instead of a scan.
    cols: set[int] = set()
    diagonals: set[int] = set()
    anti_diagonals: set[int] = set()

    def place(row: int) -> None:
        if row == n:
            solutions.append(queens.copy())  # every row has a queen: solved
            return
        for col in range(n):
            if col in cols or row - col in diagonals or row + col in anti_diagonals:
                continue  # attacked: reject this square

            # Safe: place the queen and recurse into the next row.
            queens.append(col)
            cols.add(col)
            diagonals.add(row - col)
            anti_diagonals.add(row + col)

            place(row + 1)

            # Backtrack: undo exactly what was done, then try the next column.
            queens.pop()
            cols.remove(col)
            diagonals.remove(row - col)
            anti_diagonals.remove(row + col)

    place(0)
    return solutions


print(len(solve_n_queens(8)))  # 92
