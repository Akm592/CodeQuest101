class ListNode:
    def __init__(self, val=0, next=None):
        self.val, self.next = val, next


def reverse_list(head):
    """Reverse a linked list in place by flipping each arrow. O(n) time, O(1) space."""
    prev, curr = None, head
    while curr:
        nxt = curr.next  # remember the rest before we cut it off
        curr.next = prev  # flip this arrow
        prev, curr = curr, nxt
    return prev  # the old tail is the new head


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


print(to_list(reverse_list(build([1, 2, 3, 4, 5]))))  # [5, 4, 3, 2, 1]
