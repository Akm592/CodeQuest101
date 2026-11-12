class ListNode:
    def __init__(self, val=0, next=None):
        self.val, self.next = val, next


def has_cycle(head):
    """Floyd's tortoise and hare: slow moves 1 step, fast moves 2. If there's
    a loop, fast laps slow and they meet; if not, fast reaches the end.
    O(n) time, O(1) space."""
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:
            return True
    return False


def build(vals, pos):
    nodes = [ListNode(v) for v in vals]
    for a, b in zip(nodes, nodes[1:]):
        a.next = b
    if pos >= 0:
        nodes[-1].next = nodes[pos]
    return nodes[0] if nodes else None


print(has_cycle(build([3, 2, 0, -4], 1)))  # True
print(has_cycle(build([1, 2], -1)))        # False
