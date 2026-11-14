def longest_palindrome(s):
    """Expand around every centre: each letter (odd lengths) and each gap
    between letters (even lengths). Keep the longest match."""
    res, res_len = "", 0

    def expand(l, r):
        nonlocal res, res_len
        while l >= 0 and r < len(s) and s[l] == s[r]:
            if r - l + 1 > res_len:
                res, res_len = s[l:r + 1], r - l + 1
            l, r = l - 1, r + 1

    for i in range(len(s)):
        expand(i, i)
        expand(i, i + 1)
    return res


print(longest_palindrome("babad"), longest_palindrome("cbbd"))  # bab bb
