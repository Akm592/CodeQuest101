def generate_parenthesis(n):
    """Every well-formed string of n pairs of brackets. Add "(" while some are
    left, add ")" only when it closes an open one, and undo after each try."""
    out, stack = [], []

    def backtrack(opened, closed):
        if opened == closed == n:
            out.append("".join(stack))
            return
        if opened < n:
            stack.append("(")
            backtrack(opened + 1, closed)
            stack.pop()
        if closed < opened:
            stack.append(")")
            backtrack(opened, closed + 1)
            stack.pop()

    backtrack(0, 0)
    return out


print(generate_parenthesis(3))  # ['((()))', '(()())', '(())()', '()(())', '()()()']
