def permute(nums):
    """Fill positions one at a time with any number not used yet; unmark it
    after the recursive call so later branches can use it."""
    res, perm, used = [], [], [False] * len(nums)

    def dfs():
        if len(perm) == len(nums):
            res.append(perm.copy())
            return
        for i in range(len(nums)):
            if not used[i]:
                used[i] = True
                perm.append(nums[i])
                dfs()
                perm.pop()
                used[i] = False

    dfs()
    return res


def permute_insert(nums):
    """NeetCode's video: the permutations of nums[1:], with nums[0] inserted
    into every gap of each one."""
    if not nums:
        return [[]]
    res = []
    for p in permute_insert(nums[1:]):
        for i in range(len(p) + 1):
            res.append(p[:i] + [nums[0]] + p[i:])
    return res


print(permute([1, 2, 3]))  # 6 orderings
