class TrieNode:
    __slots__ = ("children", "is_end")

    def __init__(self):
        self.children: dict[str, "TrieNode"] = {}
        self.is_end = False  # True when a whole word ends at this node


class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        node = self.root
        for ch in word:
            # Reuse the child if this prefix already exists, else create it.
            node = node.children.setdefault(ch, TrieNode())
        node.is_end = True

    def _walk(self, s: str):
        """The node spelling s, or None if the path falls off the trie."""
        node = self.root
        for ch in s:
            node = node.children.get(ch)
            if node is None:
                return None
        return node

    def search(self, word: str) -> bool:
        node = self._walk(word)
        # Reaching the node is not enough: "ca" exists as a prefix of "cat".
        return node is not None and node.is_end

    def starts_with(self, prefix: str) -> list[str]:
        """Every stored word that begins with prefix."""
        node = self._walk(prefix)
        if node is None:
            return []
        words = []
        stack = [(node, prefix)]
        while stack:
            current, spelled = stack.pop()
            if current.is_end:
                words.append(spelled)
            for ch, child in current.children.items():
                stack.append((child, spelled + ch))
        return sorted(words)


trie = Trie()
for w in ["cat", "car", "card", "care", "dog", "do"]:
    trie.insert(w)
print(trie.search("card"), trie.search("ca"), trie.starts_with("ca"))
# True False ['car', 'card', 'care', 'cat']
