def daily_temperatures(temps):
    """For each day, how many days until a warmer one (0 if never).
    The stack holds days still waiting, with temperatures decreasing. O(n)."""
    answer = [0] * len(temps)
    stack = []  # indices
    for i, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:  # today answers them
            j = stack.pop()
            answer[j] = i - j
        stack.append(i)
    return answer


print(daily_temperatures([73, 74, 75, 71, 69, 72, 76, 73]))  # [1, 1, 4, 2, 1, 1, 0, 0]
