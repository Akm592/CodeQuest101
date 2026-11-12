class TimeMap:
    """A key-value store that keeps every version. get(key, t) returns the
    value set at the latest time <= t. Set times only increase, so each
    key's list is sorted and get can binary search it. O(log n) per get."""

    def __init__(self):
        self.store = {}  # key -> [(timestamp, value), ...]

    def set(self, key, value, timestamp):
        self.store.setdefault(key, []).append((timestamp, value))

    def get(self, key, timestamp):
        res = ""
        values = self.store.get(key, [])
        l, r = 0, len(values) - 1
        while l <= r:
            m = (l + r) // 2
            if values[m][0] <= timestamp:
                res = values[m][1]  # a candidate; look for a later one
                l = m + 1
            else:
                r = m - 1
        return res


tm = TimeMap()
tm.set("foo", "bar", 1)
print(tm.get("foo", 1), tm.get("foo", 3))  # bar bar
tm.set("foo", "bar2", 4)
print(tm.get("foo", 4), tm.get("foo", 5))  # bar2 bar2
