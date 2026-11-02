from collections import deque
from typing import Optional


def topological_sort(nodes: list[str], edges: list[tuple[str, str]]) -> Optional[list[str]]:
    """Kahn's algorithm. An edge (u, v) means u must come before v.

    Returns an order, or None when the graph has a cycle.
    """
    in_degree = {v: 0 for v in nodes}
    out = {v: [] for v in nodes}
    for u, v in edges:
        out[u].append(v)
        in_degree[v] += 1

    # Nodes with no prerequisites can go first.
    ready = deque(v for v in nodes if in_degree[v] == 0)
    order = []
    while ready:
        u = ready.popleft()
        order.append(u)
        for v in out[u]:  # removing u satisfies one prerequisite of each v
            in_degree[v] -= 1
            if in_degree[v] == 0:
                ready.append(v)

    # Anything never emitted still has a prerequisite: it sits on a cycle.
    return order if len(order) == len(nodes) else None


courses = ["intro", "data", "algos", "discrete", "os", "compilers"]
prereqs = [("intro", "data"), ("intro", "discrete"), ("data", "algos"),
           ("discrete", "algos"), ("data", "os"), ("algos", "compilers")]
print(topological_sort(courses, prereqs))
