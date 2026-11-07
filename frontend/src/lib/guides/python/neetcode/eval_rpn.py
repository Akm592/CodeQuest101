def eval_rpn(tokens):
    """Evaluate Reverse Polish Notation: each operator applies to the two
    most recent values. Division truncates towards zero. O(n) time."""
    stack = []
    for t in tokens:
        if t in "+-*/" and len(t) == 1:
            b, a = stack.pop(), stack.pop()  # b was pushed last
            if t == "+":
                stack.append(a + b)
            elif t == "-":
                stack.append(a - b)
            elif t == "*":
                stack.append(a * b)
            else:
                stack.append(int(a / b))  # truncate towards zero, not floor
        else:
            stack.append(int(t))
    return stack[0]


print(eval_rpn(["2", "1", "+", "3", "*"]))              # 9  = (2 + 1) * 3
print(eval_rpn(["4", "13", "5", "/", "+"]))             # 6  = 4 + 13 / 5
