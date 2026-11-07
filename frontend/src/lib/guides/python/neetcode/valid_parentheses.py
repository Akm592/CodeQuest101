def is_valid(s):
    """True if every bracket is closed by the same type, in the right order.
    The stack holds brackets that are still open. O(n) time."""
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for c in s:
        if c in pairs:  # a closing bracket must match the latest open one
            if not stack or stack[-1] != pairs[c]:
                return False
            stack.pop()
        else:
            stack.append(c)
    return not stack  # anything left open is an error


print(is_valid("()[]{}"))  # True
print(is_valid("([)]"))    # False
