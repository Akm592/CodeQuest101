class ListNode:
    def __init__(self, val=0, next=None):
        self.val, self.next = val, next


def merge_two_lists(l1, l2):
    """Merge two sorted lists by re-linking their nodes. A dummy node in
    front means the first pick needs no special case. O(m + n) time."""
    dummy = tail = ListNode()
    while l1 and l2:
        if l1.val <= l2.val:
            tail.next, l1 = l1, l1.next
        else:
            tail.next, l2 = l2, l2.next
        tail = tail.next
    tail.next = l1 or l2  # one list is empty: attach the rest of the other
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


print(to_list(merge_two_lists(build([1, 2, 4]), build([1, 3, 4]))))  # [1, 1, 2, 3, 4, 4]
