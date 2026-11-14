def can_finish(num_courses, prerequisites):
    """DFS into each course's prerequisites with a set of courses on the
    current path: meeting one again is a cycle. A course that checks out
    gets its list emptied, so it's never checked twice."""
    pre_map = {i: [] for i in range(num_courses)}
    for crs, pre in prerequisites:
        pre_map[crs].append(pre)
    visiting = set()

    def dfs(crs):
        if crs in visiting:
            return False  # cycle
        if pre_map[crs] == []:
            return True
        visiting.add(crs)
        for pre in pre_map[crs]:
            if not dfs(pre):
                return False
        visiting.remove(crs)
        pre_map[crs] = []
        return True

    return all(dfs(c) for c in range(num_courses))


print(can_finish(2, [[1, 0]]), can_finish(2, [[1, 0], [0, 1]]))  # True False
