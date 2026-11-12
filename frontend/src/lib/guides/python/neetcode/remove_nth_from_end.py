class ListNode:
    def __init__(self, val=0, next=None):
        self.val, self.next = val, next


def remove_nth_from_end(head, n):
    """Remove the n-th node from the end in one pass. Start `right` n nodes
    ahead of `left`; when right falls off the end, left is just before the
    node to remove. A dummy node handles removing the head."""
    dummy = ListNode(0, head)
    left, right = dummy, head
    for _ in range(n):
        right = right.next
    while right:
        left, right = left.next, right.next
    left.next = left.next.next  # skip over the removed node
    return dummy.next


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


print(to_list(remove_nth_from_end(build([1, 2, 3, 4, 5]), 2)))  # [1, 2, 3, 5]
