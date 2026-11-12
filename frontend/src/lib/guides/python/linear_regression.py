def fit_line(xs, ys, lr=0.1, epochs=2000, tol=1e-12):
    """Fit y = slope * x + intercept by gradient descent on mean squared error.

    x is standardised first, so both parameters learn at the same pace.
    """
    n = len(xs)
    mean = sum(xs) / n
    std = (sum((x - mean) ** 2 for x in xs) / n) ** 0.5
    zs = [(x - mean) / std for x in xs]

    w, b = 0.0, 0.0
    for _ in range(epochs):
        errors = [w * z + b - y for z, y in zip(zs, ys)]
        grad_w = 2 / n * sum(e * z for e, z in zip(errors, zs))
        grad_b = 2 / n * sum(errors)
        if (grad_w ** 2 + grad_b ** 2) ** 0.5 < tol:
            break
        w -= lr * grad_w
        b -= lr * grad_b

    # Undo the scaling so the line is in the original units.
    slope = w / std
    intercept = b - w * mean / std
    return slope, intercept


def fit_line_exact(xs, ys):
    """The exact least-squares line in one step (no iterations needed)."""
    n = len(xs)
    mx, my = sum(xs) / n, sum(ys) / n
    slope = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sum((x - mx) ** 2 for x in xs)
    return slope, my - slope * mx


def r_squared(xs, ys, slope, intercept):
    """1 = perfect; 0 = mean baseline; negative = worse; constant targets are undefined."""
    my = sum(ys) / len(ys)
    ss_res = sum((y - (slope * x + intercept)) ** 2 for x, y in zip(xs, ys))
    ss_tot = sum((y - my) ** 2 for y in ys)
    if ss_tot == 0:
        return float("nan") if ss_res == 0 else float("-inf")
    return 1 - ss_res / ss_tot


xs = [1, 2, 3, 4, 5, 6]
ys = [1.9, 2.4, 3.1, 3.4, 4.2, 4.4]
print(fit_line(xs, ys))  # about (0.52, 1.42)
print(fit_line_exact(xs, ys))  # the same line, exactly
