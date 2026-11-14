def count_substrings(s):
    """Every successful expansion from a centre is one palindromic substring."""
    def count(l, r):
        res = 0
        while l >= 0 and r < len(s) and s[l] == s[r]:
            res += 1
            l, r = l - 1, r + 1
        return res

    return sum(count(i, i) + count(i, i + 1) for i in range(len(s)))


print(count_substrings("aaa"))  # 6
