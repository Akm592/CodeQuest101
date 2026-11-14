def partition(s):
    """Choose the first piece s[i..j]; recurse on the rest only if it's a
    palindrome. Reaching the end means every piece was a palindrome."""
    res, part = [], []

    def is_pali(l, r):
        while l < r:
            if s[l] != s[r]:
                return False
            l, r = l + 1, r - 1
        return True

    def dfs(i):
        if i >= len(s):
            res.append(part.copy())
            return
        for j in range(i, len(s)):
            if is_pali(i, j):
                part.append(s[i:j + 1])
                dfs(j + 1)
                part.pop()

    dfs(0)
    return res


print(partition("aab"))  # [['a', 'a', 'b'], ['aa', 'b']]
