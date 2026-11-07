def length_of_longest_substring(s):
    """Length of the longest substring with no repeated character.
    The window s[l..r] never holds a repeat. O(n) time."""
    seen = set()
    l = best = 0
    for r, c in enumerate(s):
        while c in seen:  # shrink from the left until c is gone
            seen.remove(s[l])
            l += 1
        seen.add(c)
        best = max(best, r - l + 1)
    return best


print(length_of_longest_substring("abcabcbb"))  # 3 ("abc")
print(length_of_longest_substring("pwwkew"))    # 3 ("wke")
