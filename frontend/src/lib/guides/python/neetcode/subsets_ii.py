def subsets_with_dup(nums):
    """Sort so copies are adjacent. Include branch as usual; the exclude
    branch skips every remaining copy, which is what prevents duplicates."""
    nums.sort()
    res, subset = [], []

    def dfs(i):
        if i == len(nums):
            res.append(subset[::])
            return
        subset.append(nums[i])  # all subsets that include nums[i]
        dfs(i + 1)
        subset.pop()
        while i + 1 < len(nums) and nums[i] == nums[i + 1]:
            i += 1  # all subsets that include no copy of nums[i]
        dfs(i + 1)

    dfs(0)
    return res


print(subsets_with_dup([1, 2, 2]))  # [[1, 2, 2], [1, 2], [1], [2, 2], [2], []]
