def get_sum(a, b):
    """a ^ b adds without carries; (a & b) << 1 is the carries. Repeat until
    no carry is left. Python ints have no fixed width, so keep everything to
    32 bits with a mask and turn the result back into a signed number."""
    mask, max_int = 0xFFFFFFFF, 0x7FFFFFFF
    a, b = a & mask, b & mask
    while b:
        a, b = (a ^ b) & mask, ((a & b) << 1) & mask
    return a if a <= max_int else ~(a ^ mask)


print(get_sum(2, 3), get_sum(-2, 3), get_sum(-5, -7))  # 5 1 -12
