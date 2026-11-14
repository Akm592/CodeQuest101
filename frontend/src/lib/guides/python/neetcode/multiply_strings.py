def multiply(num1, num2):
    """Grade-school multiplication on reversed digit lists: the product of
    digits i and j lands at position i + j, carrying into i + j + 1."""
    if "0" in [num1, num2]:
        return "0"
    res = [0] * (len(num1) + len(num2))
    num1, num2 = num1[::-1], num2[::-1]
    for i1 in range(len(num1)):
        for i2 in range(len(num2)):
            digit = int(num1[i1]) * int(num2[i2])
            res[i1 + i2] += digit
            res[i1 + i2 + 1] += res[i1 + i2] // 10
            res[i1 + i2] = res[i1 + i2] % 10
    res, beg = res[::-1], 0
    while beg < len(res) and res[beg] == 0:
        beg += 1
    return "".join(map(str, res[beg:]))


print(multiply("123", "456"))  # 56088
