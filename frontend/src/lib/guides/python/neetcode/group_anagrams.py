from collections import defaultdict


def group_anagrams(strs):
    """Group words that are anagrams of each other. O(m * n) time for m words
    of length up to n (lowercase a-z)."""
    groups = defaultdict(list)
    for word in strs:
        count = [0] * 26
        for c in word:
            count[ord(c) - ord("a")] += 1
        groups[tuple(count)].append(word)  # same letter counts -> same key
    return list(groups.values())


print(group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"]))
# [['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']]
