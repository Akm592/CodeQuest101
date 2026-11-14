def subsets(nums):
    """One include/exclude decision per number: a binary decision tree whose
    leaves are the 2^n subsets."""
    res, subset = [], []

    def dfs(i):
        if i >= len(nums):
            res.append(subset.copy())
            return
        subset.append(nums[i])  # decision: include nums[i]
        dfs(i + 1)
        subset.pop()            # decision: leave nums[i] out
        dfs(i + 1)

    dfs(0)
    return res


print(subsets([1, 2, 3]))  # [[1, 2, 3], [1, 2], [1, 3], [1], [2, 3], [2], [3], []]
