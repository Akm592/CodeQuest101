def min_cost_climbing_stairs(cost):
    """Work back from the top: from step i you pay cost[i] and take the
    cheaper of the next two. Start on step 0 or 1."""
    cost = cost + [0]  # the top costs nothing
    for i in range(len(cost) - 3, -1, -1):
        cost[i] += min(cost[i + 1], cost[i + 2])
    return min(cost[0], cost[1])


print(min_cost_climbing_stairs([1, 100, 1, 1, 1, 100, 1, 1, 100, 1]))  # 6
