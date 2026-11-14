def climb_stairs(n):
    """ways(i) = ways(i - 1) + ways(i - 2): the last move was 1 or 2 steps.
    Only the last two values are needed."""
    one, two = 1, 1
    for _ in range(n - 1):
        one, two = one + two, one
    return one


print([climb_stairs(n) for n in range(1, 8)])  # [1, 2, 3, 5, 8, 13, 21]
