from collections import defaultdict, deque


def ladder_length(begin_word, end_word, word_list):
    """BFS over words. Neighbours share a pattern like "h*t", so bucket the
    words by pattern instead of comparing every pair."""
    if end_word not in word_list:
        return 0
    nei = defaultdict(list)
    word_list.append(begin_word)
    for word in word_list:
        for j in range(len(word)):
            nei[word[:j] + "*" + word[j + 1:]].append(word)

    visit, q, res = {begin_word}, deque([begin_word]), 1
    while q:
        for _ in range(len(q)):
            word = q.popleft()
            if word == end_word:
                return res
            for j in range(len(word)):
                for nei_word in nei[word[:j] + "*" + word[j + 1:]]:
                    if nei_word not in visit:
                        visit.add(nei_word)
                        q.append(nei_word)
        res += 1
    return 0


print(ladder_length("hit", "cog", ["hot", "dot", "dog", "lot", "log", "cog"]))  # 5
