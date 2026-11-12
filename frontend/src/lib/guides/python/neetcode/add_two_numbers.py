class ListNode:
    def __init__(self, val=0, next=None):
        self.val, self.next = val, next


def add_two_numbers(l1, l2):
    """Each list holds a number's digits, ones digit first. Add them like
    on paper, one digit at a time with a carry. O(max(m, n)) time."""
    dummy = tail = ListNode()
    carry = 0
    while l1 or l2 or carry:
        total = (l1.val if l1 else 0) + (l2.val if l2 else 0) + carry
        carry, digit = divmod(total, 10)
        tail.next = ListNode(digit)
        tail = tail.next
        l1 = l1.next if l1 else None
        l2 = l2.next if l2 else None
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


print(to_list(add_two_numbers(build([2, 4, 3]), build([5, 6, 4]))))  # [7, 0, 8]: 342 + 465 = 807
