def character_replacement(s, k):
    """Longest substring you can make one repeated letter by changing at most
    k characters. O(n) time, O(26) space."""
    count = {}
    l = maxf = best = 0
    for r, c in enumerate(s):
        count[c] = count.get(c, 0) + 1
        maxf = max(maxf, count[c])
        # Letters to change = window length - most common letter's count.
        while (r - l + 1) - maxf > k:
            count[s[l]] -= 1
            l += 1
        best = max(best, r - l + 1)
    return best


print(character_replacement("ABAB", 2))     # 4
print(character_replacement("AABABBA", 1))  # 4
