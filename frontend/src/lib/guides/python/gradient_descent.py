def gradient_descent(grad, start, lr=0.1, momentum=0.0, max_steps=1000, tol=1e-6):
    """Minimise a function given its gradient.

    grad(point) -> list of partial derivatives at that point.
    momentum = 0 is plain gradient descent; 0.8-0.9 is typical with momentum.
    Returns the final point and the path taken.
    """
    point = list(start)
    velocity = [0.0] * len(point)
    path = [tuple(point)]
    for _ in range(max_steps):
        g = grad(point)
        if sum(v * v for v in g) ** 0.5 < tol:
            break  # the slope is flat: we're at the bottom of a valley
        for i in range(len(point)):
            velocity[i] = momentum * velocity[i] - lr * g[i]
            point[i] += velocity[i]
        path.append(tuple(point))
    return point, path


# f(x, y) = 0.1x² + 5y²: a narrow valley with its minimum at (0, 0).
def valley_grad(p):
    x, y = p
    return [0.2 * x, 10 * y]


plain, plain_path = gradient_descent(valley_grad, [-2.6, 1.2], lr=0.1)
fast, fast_path = gradient_descent(valley_grad, [-2.6, 1.2], lr=0.1, momentum=0.8)
print(len(plain_path), len(fast_path))  # momentum needs far fewer steps
