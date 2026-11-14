def combination_sum(candidates, target):
    """Two branches per call: use candidates[i] again, or move on to i + 1
    for good. Moving only forward means no combination is built twice."""
    res, cur = [], []

    def dfs(i, total):
        if total == target:
            res.append(cur.copy())
            return
        if i >= len(candidates) or total > target:
            return
        cur.append(candidates[i])
        dfs(i, total + candidates[i])  # reuse the same candidate
        cur.pop()
        dfs(i + 1, total)              # skip it from now on

    dfs(0, 0)
    return res


print(combination_sum([2, 3, 6, 7], 7))  # [[2, 2, 3], [7]]
