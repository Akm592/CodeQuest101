def alien_order(words):
    """Neighbouring words give one rule each (their first differing letters).
    A DFS post-order over those rules, reversed, is the alphabet; a letter
    met again on the current path means the rules contradict each other."""
    adj = {c: set() for w in words for c in w}
    for i in range(len(words) - 1):
        w1, w2 = words[i], words[i + 1]
        min_len = min(len(w1), len(w2))
        if len(w1) > len(w2) and w1[:min_len] == w2[:min_len]:
            return ""  # a word can't come before its own prefix
        for j in range(min_len):
            if w1[j] != w2[j]:
                adj[w1[j]].add(w2[j])
                break

    visit = {}  # False = finished, True = on the current path
    res = []

    def dfs(c):
        if c in visit:
            return visit[c]  # True means a cycle
        visit[c] = True
        for nei in adj[c]:
            if dfs(nei):
                return True
        visit[c] = False
        res.append(c)
        return False

    for c in adj:
        if dfs(c):
            return ""
    res.reverse()
    return "".join(res)


print(alien_order(["wrt", "wrf", "er", "ett", "rftt"]))  # wertf
