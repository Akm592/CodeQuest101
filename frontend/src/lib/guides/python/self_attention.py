import math


def matmul(a, b):
    return [[sum(x * y for x, y in zip(row, col)) for col in zip(*b)] for row in a]


def softmax(xs):
    m = max(xs)
    exps = [math.exp(x - m) for x in xs]
    total = sum(exps)
    return [e / total for e in exps]


def self_attention(X, Wq, Wk, Wv, causal=False):
    """Scaled dot-product self-attention: softmax(Q K^T / sqrt(d_k)) V.

    From "Attention Is All You Need" (Vaswani et al., 2017), Equation (1).
    X: one row per word (its embedding). Returns (outputs, weights), where
    weights[i][j] is how much word i attends to word j. With causal=True,
    word i can't see later words (their scores become -infinity).
    """
    Q, K, V = matmul(X, Wq), matmul(X, Wk), matmul(X, Wv)
    d = len(K[0])
    weights = []
    for i, q in enumerate(Q):
        scores = [sum(a * b for a, b in zip(q, k)) / math.sqrt(d) for k in K]
        if causal:
            scores = [s if j <= i else -math.inf for j, s in enumerate(scores)]
        weights.append(softmax(scores))
    outputs = matmul(weights, V)
    return outputs, weights


# The page's toy: features are [thing, animal, person, refers back, action].
words = ["the", "cat", "sat", "on", "the", "mat", "because", "it", "was", "tired"]
vocab = {"cat": [1, 1, 0, 0, 0], "mat": [1, 0, 0, 0, 0], "it": [0, 0, 0, 1, 0],
         "sat": [0, 0, 0, 0, 1], "tired": [0, 0, 0, 0, 0.5]}
X = [vocab.get(w, [0, 0, 0, 0, 0]) for w in words]
Wq = [[0, 0, 0, 0, 3], [0] * 5, [0] * 5, [3, 2.4, -4, 0, 0], [1, 3, 3, 0, 0]]
I = [[1 if i == j else 0 for j in range(5)] for i in range(5)]

_, weights = self_attention(X, Wq, I, I)
it = words.index("it")
print(words[max(range(len(words)), key=lambda j: weights[it][j])])  # cat
