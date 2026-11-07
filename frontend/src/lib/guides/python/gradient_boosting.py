def fit_stump(xs, residuals):
    """The one-question regression tree with the lowest squared error.

    Returns (threshold, left_value, right_value); each side predicts its mean.
    """
    pairs = sorted(zip(xs, residuals))
    best = None
    for i in range(len(pairs) - 1):
        if pairs[i][0] == pairs[i + 1][0]:
            continue
        left = [r for _, r in pairs[: i + 1]]
        right = [r for _, r in pairs[i + 1:]]
        lm, rm = sum(left) / len(left), sum(right) / len(right)
        err = sum((r - lm) ** 2 for r in left) + sum((r - rm) ** 2 for r in right)
        if best is None or err < best[0]:
            best = (err, (pairs[i][0] + pairs[i + 1][0]) / 2, lm, rm)
    if best is None:  # every x is the same: one flat leaf
        m = sum(residuals) / len(residuals)
        return (float("inf"), m, m)
    return best[1:]


class GradientBoosting:
    """Boosted stumps for regression with squared error."""

    def __init__(self, n_trees=100, learning_rate=0.1):
        self.n_trees = n_trees
        self.lr = learning_rate

    def fit(self, xs, ys):
        self.base = sum(ys) / len(ys)  # start from the average
        self.stumps = []
        pred = [self.base] * len(xs)
        for _ in range(self.n_trees):
            # The residual y - prediction is the negative gradient of ½(y - F)².
            residuals = [y - p for y, p in zip(ys, pred)]
            stump = fit_stump(xs, residuals)
            self.stumps.append(stump)
            pred = [p + self.lr * self._apply(stump, x) for p, x in zip(pred, xs)]
        return self

    @staticmethod
    def _apply(stump, x):
        t, left, right = stump
        return left if x <= t else right

    def predict(self, x):
        return self.base + sum(self.lr * self._apply(s, x) for s in self.stumps)


xs = [1, 2, 3, 4, 5]
ys = [1, 3, 2, 5, 4]
model = GradientBoosting(n_trees=1, learning_rate=0.5).fit(xs, ys)
print([round(model.predict(x), 2) for x in xs])  # [2.5, 2.5, 2.5, 3.75, 3.75]
