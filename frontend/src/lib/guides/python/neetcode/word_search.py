def exist(board, word):
    """DFS from every cell; a cell joins the path only if it matches the next
    letter and isn't on the path already. Undo it when backing up."""
    rows, cols = len(board), len(board[0])
    path = set()

    def dfs(r, c, i):
        if i == len(word):
            return True
        if (r < 0 or c < 0 or r >= rows or c >= cols
                or word[i] != board[r][c] or (r, c) in path):
            return False
        path.add((r, c))
        res = (dfs(r + 1, c, i + 1) or dfs(r - 1, c, i + 1)
               or dfs(r, c + 1, i + 1) or dfs(r, c - 1, i + 1))
        path.remove((r, c))
        return res

    return any(dfs(r, c, 0) for r in range(rows) for c in range(cols))


board = [list("ABCE"), list("SFCS"), list("ADEE")]
print(exist(board, "ABCCED"), exist(board, "SEE"), exist(board, "ABCB"))  # True True False
