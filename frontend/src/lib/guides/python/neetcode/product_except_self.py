def product_except_self(nums):
    """answer[i] = product of every number except nums[i], without division.
    O(n) time, O(1) extra space besides the answer."""
    n = len(nums)
    answer = [1] * n
    prefix = 1
    for i in range(n):  # answer[i] = product of everything to the left
        answer[i] = prefix
        prefix *= nums[i]
    suffix = 1
    for i in range(n - 1, -1, -1):  # times product of everything to the right
        answer[i] *= suffix
        suffix *= nums[i]
    return answer


print(product_except_self([1, 2, 3, 4]))  # [24, 12, 8, 6]
