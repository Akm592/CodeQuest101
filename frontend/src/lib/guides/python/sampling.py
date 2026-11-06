import math
import random


def next_token_probs(logits, temperature=1.0, top_k=0, top_p=1.0):
    """Turn raw scores into the probabilities a decoder samples from.

    top_k = 0 and top_p = 1.0 switch those filters off.
    """
    scaled = [l / max(temperature, 1e-6) for l in logits]
    m = max(scaled)
    exps = [math.exp(s - m) for s in scaled]
    total = sum(exps)
    probs = [e / total for e in exps]

    order = sorted(range(len(probs)), key=lambda i: probs[i], reverse=True)
    keep = set(order)
    if top_k > 0:
        keep &= set(order[:top_k])
    if top_p < 1.0:
        nucleus, cum = set(), 0.0
        for i in order:
            nucleus.add(i)
            cum += probs[i]
            if cum >= top_p:
                break
        keep &= nucleus

    kept_total = sum(probs[i] for i in keep)
    return [probs[i] / kept_total if i in keep else 0.0 for i in range(len(probs))]


def sample_next(logits, temperature=1.0, top_k=0, top_p=1.0, rng=random):
    probs = next_token_probs(logits, temperature, top_k, top_p)
    return rng.choices(range(len(probs)), weights=probs)[0]


tokens = ["Paris", "a", "located", "the", "Lyon", "beautiful", "not", "Berlin"]
logits = [9.2, 5.4, 4.9, 4.6, 3.1, 2.8, 2.2, 0.9]
print(tokens[sample_next(logits, temperature=0.7, top_p=0.9)])  # almost always Paris
