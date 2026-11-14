from collections import defaultdict


class DetectSquares:
    """A square with corner q is fixed by its diagonal corner p; the other
    two corners are (px, qy) and (qx, py). Multiply the stored counts."""

    def __init__(self):
        self.pts_count = defaultdict(int)
        self.pts = []

    def add(self, point):
        self.pts_count[tuple(point)] += 1
        self.pts.append(point)

    def count(self, point):
        res = 0
        px, py = point
        for x, y in self.pts:  # every stored copy is a possible diagonal corner
            if abs(py - y) != abs(px - x) or x == px or y == py:
                continue
            res += self.pts_count[(x, py)] * self.pts_count[(px, y)]
        return res


ds = DetectSquares()
for p in [[3, 10], [11, 2], [3, 2]]:
    ds.add(p)
print(ds.count([11, 10]), ds.count([14, 8]))  # 1 0
ds.add([11, 2])
print(ds.count([11, 10]))  # 2
