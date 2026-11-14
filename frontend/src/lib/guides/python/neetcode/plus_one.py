def plus_one(digits):
    """Carry from the last digit: 9 becomes 0 and carries; anything else
    absorbs the carry. All 9s gain a leading 1."""
    digits = digits[::-1]
    one, i = 1, 0
    while one:
        if i < len(digits):
            if digits[i] == 9:
                digits[i] = 0
            else:
                digits[i] += 1
                one = 0
        else:
            digits.append(1)
            one = 0
        i += 1
    return digits[::-1]


print(plus_one([1, 2, 9, 9]), plus_one([9, 9, 9]))  # [1, 3, 0, 0] [1, 0, 0, 0]
