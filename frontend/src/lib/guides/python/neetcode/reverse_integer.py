import math


def reverse(x):
    """Pop the last digit and push it onto res, checking before each push that
    res * 10 + digit stays inside the 32-bit range."""
    MIN, MAX = -2147483648, 2147483647
    res = 0
    while x:
        digit = int(math.fmod(x, 10))  # truncates towards zero, like C
        x = int(x / 10)
        if res > MAX // 10 or (res == MAX // 10 and digit > MAX % 10):
            return 0
        if res < int(MIN / 10) or (res == int(MIN / 10) and digit < int(math.fmod(MIN, 10))):
            return 0
        res = res * 10 + digit
    return res


print(reverse(123), reverse(-120), reverse(1534236469))  # 321 -21 0
