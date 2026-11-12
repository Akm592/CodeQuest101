class Node:
    def __init__(self, key=0, val=0):
        self.key, self.val = key, val
        self.prev = self.next = None


class LRUCache:
    """get and put in O(1). A hash map finds a key's node; a doubly linked
    list keeps the order of use, least recent at the left, most recent at
    the right. Two sentinel nodes mean no edge cases at the ends."""

    def __init__(self, capacity):
        self.cap = capacity
        self.cache = {}  # key -> node
        self.left, self.right = Node(), Node()  # left.next = LRU, right.prev = MRU
        self.left.next, self.right.prev = self.right, self.left

    def _remove(self, node):
        node.prev.next, node.next.prev = node.next, node.prev

    def _insert(self, node):  # just before the right sentinel: most recent
        prev, nxt = self.right.prev, self.right
        prev.next = nxt.prev = node
        node.prev, node.next = prev, nxt

    def get(self, key):
        if key not in self.cache:
            return -1
        node = self.cache[key]
        self._remove(node)
        self._insert(node)  # it was just used
        return node.val

    def put(self, key, value):
        if key in self.cache:
            self._remove(self.cache[key])
        self.cache[key] = Node(key, value)
        self._insert(self.cache[key])
        if len(self.cache) > self.cap:
            lru = self.left.next
            self._remove(lru)
            del self.cache[lru.key]


c = LRUCache(2)
c.put(1, 1); c.put(2, 2)
print(c.get(1))   # 1
c.put(3, 3)       # evicts key 2
print(c.get(2))   # -1
