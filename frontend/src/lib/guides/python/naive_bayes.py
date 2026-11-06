import math
import re
from collections import Counter


def tokenize(text):
    return re.findall(r"[a-z]+", text.lower())


class NaiveBayes:
    """Multinomial Naive Bayes for short texts, with Laplace smoothing."""

    def __init__(self, alpha=1.0):
        self.alpha = alpha

    def fit(self, texts, labels):
        self.classes = sorted(set(labels))
        self.docs = Counter(labels)  # how many training texts per class
        self.counts = {c: Counter() for c in self.classes}
        for text, label in zip(texts, labels):
            self.counts[label].update(tokenize(text))
        self.vocab = set().union(*self.counts.values())
        self.totals = {c: sum(self.counts[c].values()) for c in self.classes}
        return self

    def word_prob(self, word, c):
        # (count + alpha) / (total words + alpha * vocabulary size)
        return (self.counts[c][word] + self.alpha) / (self.totals[c] + self.alpha * len(self.vocab))

    def log_scores(self, text):
        n = sum(self.docs.values())
        scores = {}
        for c in self.classes:
            s = math.log(self.docs[c] / n)  # the prior
            for w in tokenize(text):
                if w in self.vocab:  # words never seen in training are ignored
                    p = self.word_prob(w, c)
                    s += math.log(p) if p > 0 else -math.inf
            scores[c] = s
        return scores

    def predict_proba(self, text):
        scores = self.log_scores(text)
        top = max(scores.values())
        exp = {c: math.exp(s - top) for c, s in scores.items()}  # subtract the max to avoid underflow
        total = sum(exp.values())
        return {c: v / total for c, v in exp.items()}

    def predict(self, text):
        return max(self.log_scores(text).items(), key=lambda kv: kv[1])[0]


texts = ["win free money now", "free prize claim now", "meeting moved to monday", "see you at lunch today"]
labels = ["spam", "spam", "ham", "ham"]
nb = NaiveBayes().fit(texts, labels)
print(nb.predict("free money today"), nb.predict("lunch on monday"))  # spam ham
