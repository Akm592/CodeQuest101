def hamming_weight(n):
    """n & (n - 1) clears the lowest 1 bit; count how many times it takes."""
    res = 0
    while n:
        n &= n - 1
        res += 1
    return res


print(hamming_weight(11), hamming_weight(128))  # 3 1
