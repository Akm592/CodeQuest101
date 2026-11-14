class TrieNode:
    def __init__(self):
        self.children = {}
        self.word = None  # the word that ends here, if any


def find_words(board, words):
    """One trie for all the words, one DFS from each cell. The board path and
    the trie node move together; branches with nothing left are removed."""
    root = TrieNode()
    for w in words:
        cur = root
        for c in w:
            cur = cur.children.setdefault(c, TrieNode())
        cur.word = w

    rows, cols = len(board), len(board[0])
    res = []

    def dfs(r, c, parent):
        letter = board[r][c]
        node = parent.children[letter]
        if node.word:
            res.append(node.word)
            node.word = None  # don't add it twice
        board[r][c] = "#"  # mark the cell as used on this path
        for dr, dc in ((-1, 0), (0, 1), (1, 0), (0, -1)):
            y, x = r + dr, c + dc
            if 0 <= y < rows and 0 <= x < cols and board[y][x] in node.children:
                dfs(y, x, node)
        board[r][c] = letter
        if not node.children and not node.word:
            del parent.children[letter]  # nothing left to find down here

    for r in range(rows):
        for c in range(cols):
            if board[r][c] in root.children:
                dfs(r, c, root)
    return res


board = [list("oaan"), list("etae"), list("ihkr"), list("iflv")]
print(sorted(find_words(board, ["oath", "pea", "eat", "rain"])))  # ['eat', 'oath']
