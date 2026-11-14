def my_pow(x, n):
    """x^n = (x^(n//2))^2, times x if n is odd: O(log n) multiplications."""
    def helper(x, n):
        if x == 0:
            return 0
        if n == 0:
            return 1
        res = helper(x, n // 2)
        res = res * res
        return x * res if n % 2 else res

    res = helper(x, abs(n))
    return res if n >= 0 else 1 / res


print(my_pow(2, 10), my_pow(2, -2))  # 1024 0.25
