def combination_sum2(candidates, target):
    """Sort; each call picks the next number from position i on. Skip a
    value equal to the previous one in the same loop (it would repeat the
    same combinations), and stop once a value passes the target."""
    candidates.sort()
    res, cur = [], []

    def dfs(start, total):
        if total == target:
            res.append(cur.copy())
            return
        prev = None
        for j in range(start, len(candidates)):
            if candidates[j] == prev:
                continue
            if total + candidates[j] > target:
                break  # sorted: everything after is too big as well
            cur.append(candidates[j])
            dfs(j + 1, total + candidates[j])
            cur.pop()
            prev = candidates[j]

    dfs(0, 0)
    return res


print(combination_sum2([10, 1, 2, 7, 6, 1, 5], 8))  # [[1, 1, 6], [1, 2, 5], [1, 7], [2, 6]]
