class ListNode:
    def __init__(self, val=0, next=None):
        self.val, self.next = val, next


def reverse_k_group(head, k):
    """Reverse the list k nodes at a time; a last group shorter than k stays
    as it is. O(n) time, O(1) space."""
    dummy = ListNode(0, head)
    group_prev = dummy
    while True:
        kth = group_prev
        for _ in range(k):  # find the k-th node of this group
            kth = kth.next
            if not kth:
                return dummy.next  # fewer than k left: done
        group_next = kth.next

        prev, curr = group_next, group_prev.next  # reverse the group
        while curr is not group_next:
            nxt = curr.next
            curr.next = prev
            prev, curr = curr, nxt

        first = group_prev.next  # was the group's first node, now its last
        group_prev.next = kth
        group_prev = first


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


print(to_list(reverse_k_group(build([1, 2, 3, 4, 5]), 2)))  # [2, 1, 4, 3, 5]
print(to_list(reverse_k_group(build([1, 2, 3, 4, 5]), 3)))  # [3, 2, 1, 4, 5]
