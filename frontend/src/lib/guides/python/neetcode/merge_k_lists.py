class ListNode:
    def __init__(self, val=0, next=None):
        self.val, self.next = val, next


def merge_two(l1, l2):
    dummy = tail = ListNode()
    while l1 and l2:
        if l1.val <= l2.val:
            tail.next, l1 = l1, l1.next
        else:
            tail.next, l2 = l2, l2.next
        tail = tail.next
    tail.next = l1 or l2
    return dummy.next


def merge_k_lists(lists):
    """Merge k sorted lists by merging them in pairs, round after round, like
    merge sort. Each round halves the number of lists and touches every node
    once: O(N log k) for N nodes in total."""
    if not lists:
        return None
    while len(lists) > 1:
        merged = []
        for i in range(0, len(lists), 2):
            l2 = lists[i + 1] if i + 1 < len(lists) else None
            merged.append(merge_two(lists[i], l2))
        lists = merged
    return lists[0]


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


print(to_list(merge_k_lists([build([1, 4, 5]), build([1, 3, 4]), build([2, 6])])))  # [1, 1, 2, 3, 4, 4, 5, 6]
