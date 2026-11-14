class TrieNode:
    def __init__(self):
        self.children = {}  # letter -> TrieNode
        self.end = False    # does a word end here?


class Trie:
    """insert, search and startsWith in O(length of the word)."""

    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        cur = self.root
        for c in word:
            if c not in cur.children:
                cur.children[c] = TrieNode()
            cur = cur.children[c]
        cur.end = True

    def _walk(self, s):
        """The node that spells s, or None if some letter is missing."""
        cur = self.root
        for c in s:
            if c not in cur.children:
                return None
            cur = cur.children[c]
        return cur

    def search(self, word):
        node = self._walk(word)
        return node is not None and node.end

    def startsWith(self, prefix):
        return self._walk(prefix) is not None


t = Trie()
t.insert("apple")
print(t.search("apple"), t.search("app"), t.startsWith("app"))  # True False True
t.insert("app")
print(t.search("app"))  # True
