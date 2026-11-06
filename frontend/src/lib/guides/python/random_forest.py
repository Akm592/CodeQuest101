import math
import random
from collections import Counter


def gini(labels):
    n = len(labels)
    return sum((c / n) * (1 - c / n) for c in Counter(labels).values())


def best_split(rows, labels, features):
    """Best (score, feature, threshold) using only the given features."""
    n = len(rows)
    best = None
    for f in features:
        values = sorted(set(r[f] for r in rows))
        for a, b in zip(values, values[1:]):
            t = (a + b) / 2
            left = [lab for r, lab in zip(rows, labels) if r[f] <= t]
            right = [lab for r, lab in zip(rows, labels) if r[f] > t]
            score = len(left) / n * gini(left) + len(right) / n * gini(right)
            if best is None or score < best[0]:
                best = (score, f, t)
    return best


def build_tree(rows, labels, rng, max_features):
    """A fully grown tree that looks at a random subset of features per split."""
    if gini(labels) == 0:
        return {"counts": Counter(labels)}
    feats = list(range(len(rows[0])))
    rng.shuffle(feats)
    split = best_split(rows, labels, feats[:max_features])
    if split is None or split[0] >= gini(labels):  # nothing useful: try the rest
        split = best_split(rows, labels, feats[max_features:])
    if split is None or split[0] >= gini(labels):
        return {"counts": Counter(labels)}
    _, f, t = split
    yes = [i for i, r in enumerate(rows) if r[f] <= t]
    no = [i for i, r in enumerate(rows) if r[f] > t]
    return {
        "feature": f, "threshold": t,
        "yes": build_tree([rows[i] for i in yes], [labels[i] for i in yes], rng, max_features),
        "no": build_tree([rows[i] for i in no], [labels[i] for i in no], rng, max_features),
    }


def leaf_probs(tree, row):
    while "counts" not in tree:
        tree = tree["yes"] if row[tree["feature"]] <= tree["threshold"] else tree["no"]
    total = sum(tree["counts"].values())
    return {c: k / total for c, k in tree["counts"].items()}


class RandomForest:
    def __init__(self, n_trees=50, seed=0):
        self.n_trees = n_trees
        self.rng = random.Random(seed)

    def fit(self, rows, labels):
        n = len(rows)
        max_features = max(1, round(math.sqrt(len(rows[0]))))  # scikit-learn's "sqrt"
        self.trees, self.out_of_bag = [], []
        for _ in range(self.n_trees):
            sample = [self.rng.randrange(n) for _ in range(n)]  # bootstrap: with replacement
            self.out_of_bag.append(set(range(n)) - set(sample))
            self.trees.append(build_tree([rows[i] for i in sample], [labels[i] for i in sample], self.rng, max_features))
        return self

    def predict(self, row):
        # Average the trees' probabilities (a soft vote), as scikit-learn does.
        total = Counter()
        for tree in self.trees:
            total.update(leaf_probs(tree, row))
        return total.most_common(1)[0][0]


rng = random.Random(1)
rows = [[rng.uniform(0, 10), rng.uniform(0, 10)] for _ in range(60)]
labels = ["above" if y > x else "below" for x, y in rows]
forest = RandomForest(n_trees=25).fit(rows, labels)
print(forest.predict([2, 8]), forest.predict([8, 2]))  # above below
