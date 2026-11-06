import math
import random


def gradient_descent(grad, start, lr=0.1, momentum=0.0, max_steps=1000, tol=1e-6):
    """Minimise a function given its gradient.

    grad(point) -> list of partial derivatives (slopes) at that point.
    momentum = 0 is plain gradient descent; 0.9 is the usual value with momentum.
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


def adam(grad, start, lr=0.001, beta1=0.9, beta2=0.999, eps=1e-8, steps=1000):
    """Adam: momentum on the slope plus a per-weight step size from squared slopes."""
    point = list(start)
    m = [0.0] * len(point)  # moving average of slopes
    s = [0.0] * len(point)  # moving average of squared slopes
    for t in range(1, steps + 1):
        g = grad(point)
        for i in range(len(point)):
            m[i] = beta1 * m[i] + (1 - beta1) * g[i]
            s[i] = beta2 * s[i] + (1 - beta2) * g[i] ** 2
            m_hat = m[i] / (1 - beta1 ** t)  # correct the start-at-zero bias
            s_hat = s[i] / (1 - beta2 ** t)
            point[i] -= lr * m_hat / (math.sqrt(s_hat) + eps)
    return point


def minibatch_sgd(xs, ys, lr=0.1, batch_size=8, epochs=50, seed=0):
    """Fit y = w*x + b by mini-batch SGD on mean squared error.

    batch_size = len(xs) is batch gradient descent; batch_size = 1 is SGD.
    """
    rng = random.Random(seed)
    w, b = 0.0, 0.0
    order = list(range(len(xs)))
    for _ in range(epochs):
        rng.shuffle(order)  # a fresh random order every pass
        for start in range(0, len(order), batch_size):
            batch = order[start:start + batch_size]
            errs = [(w * xs[i] + b - ys[i], xs[i]) for i in batch]
            gw = 2 / len(batch) * sum(e * x for e, x in errs)
            gb = 2 / len(batch) * sum(e for e, _ in errs)
            w -= lr * gw
            b -= lr * gb
    return w, b


# f(x, y) = 0.1x² + 5y²: a narrow valley with its minimum at (0, 0).
def valley_grad(p):
    x, y = p
    return [0.2 * x, 10 * y]


plain, plain_path = gradient_descent(valley_grad, [-2.6, 1.2], lr=0.1)
fast, fast_path = gradient_descent(valley_grad, [-2.6, 1.2], lr=0.1, momentum=0.8)
print(len(plain_path), len(fast_path))  # momentum needs far fewer steps
print(adam(valley_grad, [-2.6, 1.2], lr=0.1))  # close to [0, 0]
