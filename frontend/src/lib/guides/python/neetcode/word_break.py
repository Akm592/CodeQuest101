def word_break(s, word_dict):
    """dp[i] = can s[i:] be split into words? True if some word matches at i
    and dp is true just after it."""
    dp = [False] * (len(s) + 1)
    dp[len(s)] = True
    for i in range(len(s) - 1, -1, -1):
        for w in word_dict:
            if s[i:i + len(w)] == w and dp[i + len(w)]:
                dp[i] = True
                break
    return dp[0]


print(word_break("applepenapple", ["apple", "pen"]), word_break("catsandog", ["cats", "dog", "sand", "and", "cat"]))  # True False
