def can_complete_circuit(gas, cost):
    """If the totals allow it, one pass finds the start: when the tank goes
    negative at i, no start up to i works, so try i + 1."""
    if sum(gas) < sum(cost):
        return -1
    total, res = 0, 0
    for i in range(len(gas)):
        total += gas[i] - cost[i]
        if total < 0:
            total, res = 0, i + 1
    return res


print(can_complete_circuit([1, 2, 3, 4, 5], [3, 4, 5, 1, 2]))  # 3
