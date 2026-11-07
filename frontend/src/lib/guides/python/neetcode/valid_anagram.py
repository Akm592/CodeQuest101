def is_anagram(s, t):
    """True if t uses exactly the same letters as s. O(n) time, O(1) space
    for a fixed alphabet."""
    if len(s) != len(t):
        return False
    count = {}
    for c in s:
        count[c] = count.get(c, 0) + 1
    for c in t:
        count[c] = count.get(c, 0) - 1
        if count[c] < 0:  # t has more of this letter than s
            return False
    return True


print(is_anagram("anagram", "nagaram"))  # True
print(is_anagram("rat", "car"))          # False
