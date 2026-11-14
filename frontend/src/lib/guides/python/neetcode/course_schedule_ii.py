def find_order(num_courses, prerequisites):
    """Topological sort by DFS: add a course only after all of its
    prerequisites are in the output (post-order). A course met again on the
    current path means a cycle, so no order exists."""
    pre_map = {c: [] for c in range(num_courses)}
    for crs, pre in prerequisites:
        pre_map[crs].append(pre)
    output, visit, cycle = [], set(), set()

    def dfs(crs):
        if crs in cycle:
            return False
        if crs in visit:
            return True
        cycle.add(crs)
        for pre in pre_map[crs]:
            if not dfs(pre):
                return False
        cycle.remove(crs)
        visit.add(crs)
        output.append(crs)
        return True

    for c in range(num_courses):
        if not dfs(c):
            return []
    return output


print(find_order(4, [[1, 0], [2, 0], [3, 1], [3, 2]]))  # [0, 1, 2, 3]
