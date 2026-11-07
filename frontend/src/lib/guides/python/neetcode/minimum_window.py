def min_window(s, t):
    """Shortest substring of s containing every character of t (with
    repeats), or "" if there is none. O(len(s) + len(t)) time."""
    if not t:
        return ""
    need = {}
    for c in t:
        need[c] = need.get(c, 0) + 1
    window = {}
    have, required = 0, len(need)
    best, best_len = (0, -1), float("inf")
    l = 0
    for r, c in enumerate(s):
        window[c] = window.get(c, 0) + 1
        if c in need and window[c] == need[c]:
            have += 1
        while have == required:  # valid: record it, then try to shrink
            if r - l + 1 < best_len:
                best, best_len = (l, r), r - l + 1
            window[s[l]] -= 1
            if s[l] in need and window[s[l]] < need[s[l]]:
                have -= 1
            l += 1
    l, r = best
    return s[l : r + 1] if best_len != float("inf") else ""


print(min_window("ADOBECODEBANC", "ABC"))  # "BANC"
print(min_window("a", "aa"))               # ""
