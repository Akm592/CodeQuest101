def single_number(nums):
    """x ^ x = 0 and x ^ 0 = x: XOR everything and the pairs cancel."""
    res = 0
    for n in nums:
        res = n ^ res
    return res


print(single_number([4, 1, 2, 1, 2]))  # 4
