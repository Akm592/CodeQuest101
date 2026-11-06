import math
import random


class TinyMLP:
    """2 inputs -> `hidden` tanh neurons -> 1 sigmoid output."""

    def __init__(self, hidden=4, seed=0):
        rng = random.Random(seed)
        self.W1 = [[rng.gauss(0, 1.2), rng.gauss(0, 1.2)] for _ in range(hidden)]
        self.b1 = [rng.gauss(0, 0.3) for _ in range(hidden)]
        self.W2 = [rng.gauss(0, 0.8) for _ in range(hidden)]
        self.b2 = 0.0

    def forward(self, x, y):
        h = [math.tanh(w[0] * x + w[1] * y + b) for w, b in zip(self.W1, self.b1)]
        z = sum(hi * wi for hi, wi in zip(h, self.W2)) + self.b2
        return h, 1 / (1 + math.exp(-z))

    def loss(self, data):
        eps = 1e-9
        total = 0.0
        for x, y, label in data:
            p = self.forward(x, y)[1]
            total -= math.log(p + eps) if label else math.log(1 - p + eps)
        return total / len(data)

    def gradients(self, data):
        """Backpropagation: mean gradient of the loss for every parameter."""
        H = len(self.W2)
        gW1 = [[0.0, 0.0] for _ in range(H)]
        gb1, gW2, gb2 = [0.0] * H, [0.0] * H, 0.0
        for x, y, label in data:
            h, p = self.forward(x, y)
            dz = p - label  # sigmoid + cross-entropy: the output error is just p - y
            gb2 += dz
            for j in range(H):
                gW2[j] += dz * h[j]
                dh = dz * self.W2[j] * (1 - h[j] ** 2)  # back through tanh
                gW1[j][0] += dh * x
                gW1[j][1] += dh * y
                gb1[j] += dh
        n = len(data)
        return ([[a / n, b / n] for a, b in gW1], [v / n for v in gb1], [v / n for v in gW2], gb2 / n)

    def train(self, data, lr=0.8, epochs=600):
        for _ in range(epochs):
            gW1, gb1, gW2, gb2 = self.gradients(data)
            for j in range(len(self.W2)):
                self.W1[j][0] -= lr * gW1[j][0]
                self.W1[j][1] -= lr * gW1[j][1]
                self.b1[j] -= lr * gb1[j]
                self.W2[j] -= lr * gW2[j]
            self.b2 -= lr * gb2

    def predict(self, x, y):
        return 1 if self.forward(x, y)[1] >= 0.5 else 0


# XOR: opposite corners share a label, so no single straight line separates them.
xor = [(-0.5, -0.5, 0), (0.5, 0.5, 0), (-0.5, 0.5, 1), (0.5, -0.5, 1)]
net = TinyMLP(hidden=4, seed=1)
net.train(xor)
print([net.predict(x, y) for x, y, _ in xor])  # [0, 0, 1, 1]
