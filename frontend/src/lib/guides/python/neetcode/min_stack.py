class MinStack:
    """A stack that also returns its minimum in O(1). A second stack stores,
    for each level, the minimum of everything at or below it."""

    def __init__(self):
        self.stack = []
        self.mins = []

    def push(self, val):
        self.stack.append(val)
        self.mins.append(min(val, self.mins[-1]) if self.mins else val)

    def pop(self):
        self.stack.pop()
        self.mins.pop()

    def top(self):
        return self.stack[-1]

    def getMin(self):
        return self.mins[-1]


s = MinStack()
s.push(-2); s.push(0); s.push(-3)
print(s.getMin())  # -3
s.pop()
print(s.top(), s.getMin())  # 0 -2
