from collections import deque

INF = 2147483647


def walls_and_gates(rooms):
    """Multi-source BFS from every gate at once: the first time a room is
    reached is from its nearest gate, so each room is filled once."""
    rows, cols = len(rooms), len(rooms[0])
    q = deque((r, c) for r in range(rows) for c in range(cols) if rooms[r][c] == 0)
    dist = 0
    while q:
        dist += 1
        for _ in range(len(q)):
            r, c = q.popleft()
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols and rooms[nr][nc] == INF:
                    rooms[nr][nc] = dist
                    q.append((nr, nc))


rooms = [[INF, -1, 0, INF], [INF, INF, INF, -1], [INF, -1, INF, -1], [0, -1, INF, INF]]
walls_and_gates(rooms)
print(rooms)  # [[3, -1, 0, 1], [2, 2, 1, -1], [1, -1, 2, -1], [0, -1, 3, 4]]
