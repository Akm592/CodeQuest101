def is_match(s, p):
    """dfs(i, j): does s[i:] match p[j:]? "x*" can match zero x's (skip it)
    or one more x (if s[i] matches, eat it and stay). Memoised."""
    cache = {}

    def dfs(i, j):
        if (i, j) in cache:
            return cache[(i, j)]
        if j >= len(p):
            return i >= len(s)
        match = i < len(s) and (s[i] == p[j] or p[j] == ".")
        if j + 1 < len(p) and p[j + 1] == "*":
            res = dfs(i, j + 2) or (match and dfs(i + 1, j))
        else:
            res = match and dfs(i + 1, j + 1)
        cache[(i, j)] = res
        return res

    return dfs(0, 0)


print(is_match("aab", "c*a*b"), is_match("aa", "a"))  # True False
