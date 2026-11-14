class TrieNode:
    def __init__(self):
        self.children = {}
        self.end = False


class WordDictionary:
    """addWord is a trie insert. search walks the trie; a "." tries every
    child (a depth-first search that backs up when a branch fails)."""

    def __init__(self):
        self.root = TrieNode()

    def addWord(self, word):
        cur = self.root
        for c in word:
            cur = cur.children.setdefault(c, TrieNode())
        cur.end = True

    def search(self, word):
        def dfs(i, cur):
            for j in range(i, len(word)):
                c = word[j]
                if c == ".":
                    return any(dfs(j + 1, child) for child in cur.children.values())
                if c not in cur.children:
                    return False
                cur = cur.children[c]
            return cur.end

        return dfs(0, self.root)


d = WordDictionary()
for w in ["bad", "dad", "mad"]:
    d.addWord(w)
print([d.search(p) for p in ["pad", "bad", ".ad", "b.."]])  # [False, True, True, True]
