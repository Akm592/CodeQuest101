def solve_n_queens(n):
    """One queen per row. A square is safe if its column, its r + c diagonal
    and its r - c diagonal are all free; three sets make that O(1)."""
    cols, pos_diag, neg_diag = set(), set(), set()
    res = []
    board = [["."] * n for _ in range(n)]

    def backtrack(r):
        if r == n:
            res.append(["".join(row) for row in board])
            return
        for c in range(n):
            if c in cols or (r + c) in pos_diag or (r - c) in neg_diag:
                continue  # attacked
            cols.add(c); pos_diag.add(r + c); neg_diag.add(r - c)
            board[r][c] = "Q"
            backtrack(r + 1)
            cols.remove(c); pos_diag.remove(r + c); neg_diag.remove(r - c)
            board[r][c] = "."

    backtrack(0)
    return res


print(solve_n_queens(4))  # [['.Q..', '...Q', 'Q...', '..Q.'], ['..Q.', 'Q...', '...Q', '.Q..']]
