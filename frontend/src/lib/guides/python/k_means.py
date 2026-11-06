import random


def k_means(points, k, max_rounds=100, seed=0):
    """Group 2D points into k clusters. Returns (centres, labels)."""
    rng = random.Random(seed)

    def dist2(a, b):
        return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2

    # k-means++: spread the starting centres out.
    centres = [rng.choice(points)]
    while len(centres) < k:
        weights = [min(dist2(p, c) for c in centres) for p in points]
        centres.append(rng.choices(points, weights=weights)[0])

    labels = None
    for _ in range(max_rounds):
        # Assign: each point joins its nearest centre.
        new_labels = [min(range(k), key=lambda c: dist2(p, centres[c])) for p in points]
        if new_labels == labels:
            break  # nothing changed, so nothing will
        labels = new_labels
        # Update: each centre moves to the mean of its points.
        for c in range(k):
            members = [p for p, lab in zip(points, labels) if lab == c]
            if members:
                centres[c] = (
                    sum(p[0] for p in members) / len(members),
                    sum(p[1] for p in members) / len(members),
                )
    return centres, labels


pts = [(1, 1), (1.5, 2), (1, 1.6), (8, 8), (8.5, 7.5), (9, 8.2), (1, 9), (1.4, 8.4)]
centres, labels = k_means(pts, 3)
print(labels)  # three groups, e.g. [0, 0, 0, 1, 1, 1, 2, 2]
