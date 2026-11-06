from collections import Counter


def gini(labels):
    """Gini impurity: the chance two random picks from this group disagree."""
    n = len(labels)
    return sum((c / n) * (1 - c / n) for c in Counter(labels).values())


def best_split(rows, labels):
    """Try every feature and every threshold; return (score, feature, threshold) or None."""
    n = len(rows)
    best = None
    for f in range(len(rows[0])):
        values = sorted(set(r[f] for r in rows))
        for a, b in zip(values, values[1:]):
            t = (a + b) / 2  # halfway between two neighbouring values
            left = [lab for r, lab in zip(rows, labels) if r[f] <= t]
            right = [lab for r, lab in zip(rows, labels) if r[f] > t]
            score = len(left) / n * gini(left) + len(right) / n * gini(right)
            if best is None or score < best[0]:
                best = (score, f, t)
    return best


def build_tree(rows, labels, max_depth=3, depth=0):
    """Grow a tree; leaves are {"predict": label}, inner nodes ask one question."""
    majority = Counter(labels).most_common(1)[0][0]
    if gini(labels) == 0 or depth >= max_depth:
        return {"predict": majority}
    split = best_split(rows, labels)
    if split is None or split[0] >= gini(labels):
        return {"predict": majority}  # no question makes the groups purer
    _, f, t = split
    yes = [i for i, r in enumerate(rows) if r[f] <= t]
    no = [i for i, r in enumerate(rows) if r[f] > t]
    return {
        "feature": f,
        "threshold": t,
        "yes": build_tree([rows[i] for i in yes], [labels[i] for i in yes], max_depth, depth + 1),
        "no": build_tree([rows[i] for i in no], [labels[i] for i in no], max_depth, depth + 1),
    }


def predict(tree, row):
    while "predict" not in tree:
        tree = tree["yes"] if row[tree["feature"]] <= tree["threshold"] else tree["no"]
    return tree["predict"]


# Fruit: [weight in grams, colour score 0-10]. Apples are lighter and redder.
rows = [[120, 8], [130, 7], [110, 9], [180, 3], [170, 2], [190, 4], [125, 3], [175, 8]]
labels = ["apple", "apple", "apple", "orange", "orange", "orange", "apple", "orange"]
tree = build_tree(rows, labels, max_depth=2)
print(predict(tree, [115, 6]), predict(tree, [185, 5]))  # apple orange
