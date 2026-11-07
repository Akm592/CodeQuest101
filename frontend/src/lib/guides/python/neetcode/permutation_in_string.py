def check_inclusion(s1, s2):
    """True if some rearrangement of s1 appears in s2 as a substring.
    A window of len(s1) slides over s2; `matches` counts the letters a-z
    whose count in the window equals their count in s1. O(n) time."""
    if len(s1) > len(s2):
        return False
    need, window = [0] * 26, [0] * 26
    for a, b in zip(s1, s2):
        need[ord(a) - 97] += 1
        window[ord(b) - 97] += 1
    matches = sum(need[i] == window[i] for i in range(26))

    for r in range(len(s1), len(s2)):
        if matches == 26:
            return True
        i = ord(s2[r]) - 97  # letter coming in on the right
        window[i] += 1
        if window[i] == need[i]:
            matches += 1
        elif window[i] == need[i] + 1:
            matches -= 1
        i = ord(s2[r - len(s1)]) - 97  # letter leaving on the left
        window[i] -= 1
        if window[i] == need[i]:
            matches += 1
        elif window[i] == need[i] - 1:
            matches -= 1
    return matches == 26


print(check_inclusion("ab", "eidbaooo"))  # True ("ba")
print(check_inclusion("ab", "eidboaoo"))  # False
