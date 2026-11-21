def confusion(y_true, scores, threshold=0.5):
    """Count the four outcomes. Positive = score >= threshold (as scikit-learn)."""
    tp = fp = fn = tn = 0
    for truth, score in zip(y_true, scores):
        flagged = score >= threshold
        if flagged and truth:
            tp += 1
        elif flagged:
            fp += 1
        elif truth:
            fn += 1
        else:
            tn += 1
    return tp, fp, fn, tn


def ratio(top, bottom):
    # A ratio with nothing below the line has no value: None, not a fake 0.
    return None if bottom == 0 else top / bottom


def metrics(tp, fp, fn, tn):
    precision = ratio(tp, tp + fp)  # of the flagged, how many were right
    recall = ratio(tp, tp + fn)  # of the positives, how many were caught
    if precision is None or recall is None:
        f1 = None
    elif precision + recall == 0:
        f1 = 0.0
    else:
        f1 = 2 * precision * recall / (precision + recall)
    return {
        "accuracy": ratio(tp + tn, tp + fp + fn + tn),
        "precision": precision,
        "recall": recall,
        "specificity": ratio(tn, tn + fp),
        "f1": f1,
    }


def roc_curve(y_true, scores):
    """(false positive rate, true positive rate) as the threshold drops past each score."""
    pos = sum(1 for t in y_true if t)
    neg = len(y_true) - pos
    points = [(0.0, 0.0)]
    for t in sorted(set(scores), reverse=True):
        tp, fp, fn, tn = confusion(y_true, scores, t)
        points.append((fp / neg, tp / pos))
    return points


def auc(points):
    # Trapezoid rule over points sorted by false positive rate.
    return sum((x1 - x0) * (y0 + y1) / 2 for (x0, y0), (x1, y1) in zip(points, points[1:]))


def auc_by_pairs(y_true, scores):
    """The chance a random positive outscores a random negative (ties count half)."""
    pos = [s for t, s in zip(y_true, scores) if t]
    neg = [s for t, s in zip(y_true, scores) if not t]
    wins = sum(1.0 if p > n else 0.5 if p == n else 0.0 for p in pos for n in neg)
    return wins / (len(pos) * len(neg))


if __name__ == "__main__":
    y_true = [1] * 8 + [0] * 12
    scores = [0.95, 0.91, 0.86, 0.78, 0.71, 0.62, 0.44, 0.27,
              0.83, 0.66, 0.55, 0.48, 0.38, 0.33, 0.25, 0.19, 0.14, 0.09, 0.06, 0.03]
    counts = confusion(y_true, scores, 0.5)
    print(counts)  # (6, 3, 2, 9)
    print(metrics(*counts))
    print(round(auc(roc_curve(y_true, scores)), 4), round(auc_by_pairs(y_true, scores), 4))  # 0.8542 0.8542
