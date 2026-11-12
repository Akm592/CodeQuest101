class ListNode:
    def __init__(self, val=0, next=None):
        self.val, self.next = val, next


def reorder_list(head):
    """Reorder L0 → L1 → … → Ln into L0 → Ln → L1 → Ln-1 → …, in place.
    Find the middle, reverse the second half, then weave the halves."""
    slow, fast = head, head.next
    while fast and fast.next:  # fast moves 2, slow moves 1: slow ends in the middle
        slow, fast = slow.next, fast.next.next

    second = slow.next
    slow.next = None  # cut the list in two
    prev = None
    while second:  # reverse the second half
        nxt = second.next
        second.next = prev
        prev, second = second, nxt

    first, second = head, prev
    while second:  # weave: one from the front, one from the back
        tmp1, tmp2 = first.next, second.next
        first.next = second
        second.next = tmp1
        first, second = tmp1, tmp2


def build(xs):
    head = None
    for x in reversed(xs):
        head = ListNode(x, head)
    return head


def to_list(node):
    out = []
    while node:
        out.append(node.val)
        node = node.next
    return out


h = build([1, 2, 3, 4, 5])
reorder_list(h)
print(to_list(h))  # [1, 5, 2, 4, 3]
