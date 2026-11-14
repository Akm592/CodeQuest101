def is_happy(n):
    """Follow n -> sum of squared digits until it hits 1 or repeats."""
    visit = set()
    while n not in visit:
        visit.add(n)
        n = sum(int(d) ** 2 for d in str(n))
        if n == 1:
            return True
    return False


print(is_happy(19), is_happy(2))  # True False
