class Node:
    def __init__(self, val, next=None, random=None):
        self.val, self.next, self.random = val, next, random


def copy_random_list(head):
    """Deep-copy a list whose nodes also have a `random` pointer. Pass 1
    makes a copy of every node; pass 2 wires the copies using the map
    old node → its copy. O(n) time and space."""
    copy = {None: None}
    node = head
    while node:
        copy[node] = Node(node.val)
        node = node.next
    node = head
    while node:
        copy[node].next = copy[node.next]
        copy[node].random = copy[node.random]
        node = node.next
    return copy[head]


def build(vals, rand):
    nodes = [Node(v) for v in vals]
    for i, node in enumerate(nodes):
        node.next = nodes[i + 1] if i + 1 < len(nodes) else None
        node.random = nodes[rand[i]] if rand[i] is not None else None
    return nodes[0] if nodes else None


def serialise(head):
    nodes, node = [], head
    while node:
        nodes.append(node)
        node = node.next
    index = {id(n): i for i, n in enumerate(nodes)}
    return [[n.val, index[id(n.random)] if n.random else None] for n in nodes]


h = build([7, 13, 11, 10, 1], [None, 0, 4, 2, 0])
c = copy_random_list(h)
print(serialise(c), c is not h)  # [[7, None], [13, 0], [11, 4], [10, 2], [1, 0]] True
