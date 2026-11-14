def reverse_bits(n):
    """Move bit i of n to bit 31 - i of the result."""
    res = 0
    for i in range(32):
        bit = (n >> i) & 1
        res = res | (bit << (31 - i))
    return res


print(reverse_bits(43261596))  # 964176192
