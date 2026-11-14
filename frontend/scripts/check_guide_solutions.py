"""Check the Python solutions shown in the visualizers' "How it works" guides.

The guides offer these as copy-paste interview answers, so they have to be
right. Each one is loaded from src/lib/guides/python and checked against an
independent brute force on small random inputs, plus the answers the
visualizer pages show for their own demo inputs.

Run: python3 scripts/check_guide_solutions.py
"""

import contextlib
import importlib.util
import io
import itertools
import math
import random
import sys
from functools import lru_cache
from pathlib import Path

# Importing the solutions would otherwise drop a __pycache__ into src/.
sys.dont_write_bytecode = True

PY_DIR = Path(__file__).resolve().parent.parent / "src" / "lib" / "guides" / "python"
rng = random.Random(1234)
failures = []


def load(name):
    """Import a solution file, swallowing its example print."""
    spec = importlib.util.spec_from_file_location(name, PY_DIR / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    with contextlib.redirect_stdout(io.StringIO()):
        spec.loader.exec_module(module)
    return module


def check(label, ok):
    print(f"  {'ok  ' if ok else 'FAIL'} {label}")
    if not ok:
        failures.append(label)


def random_word(alphabet="abc", max_len=6):
    return "".join(rng.choice(alphabet) for _ in range(rng.randint(0, max_len)))


# --- Edit distance -----------------------------------------------------------
print("edit_distance")
edit_distance = load("edit_distance").edit_distance


def edit_brute(a, b):
    @lru_cache(maxsize=None)
    def go(i, j):
        if i == len(a):
            return len(b) - j
        if j == len(b):
            return len(a) - i
        if a[i] == b[j]:
            return go(i + 1, j + 1)
        return 1 + min(go(i + 1, j + 1), go(i + 1, j), go(i, j + 1))

    return go(0, 0)


check("kitten -> sitting is 3", edit_distance("kitten", "sitting") == 3)
check("identical strings are 0", edit_distance("flaw", "flaw") == 0)
check("matches brute force on 300 random pairs",
      all(edit_distance(a, b) == edit_brute(a, b)
          for a, b in ((random_word(), random_word()) for _ in range(300))))

# --- LCS ---------------------------------------------------------------------
print("lcs")
lcs = load("lcs").longest_common_subsequence


def is_subsequence(s, of):
    it = iter(of)
    return all(ch in it for ch in s)


def lcs_len_brute(a, b):
    for k in range(min(len(a), len(b)), -1, -1):
        for idx in itertools.combinations(range(len(a)), k):
            if is_subsequence("".join(a[i] for i in idx), b):
                return k
    return 0


check('kitten / sitting -> "ittn"', lcs("kitten", "sitting") == "ittn")
pairs = [(random_word(max_len=7), random_word(max_len=7)) for _ in range(300)]
check("is a common subsequence of maximum length (300 random pairs)",
      all(is_subsequence(lcs(a, b), a) and is_subsequence(lcs(a, b), b)
          and len(lcs(a, b)) == lcs_len_brute(a, b) for a, b in pairs))

# --- Knapsack ----------------------------------------------------------------
print("knapsack")
knapsack = load("knapsack").knapsack
page_items = [("A", 5, 10), ("B", 4, 40), ("C", 6, 30), ("D", 3, 50)]


def knapsack_brute(items, cap):
    best = 0
    for r in range(len(items) + 1):
        for combo in itertools.combinations(items, r):
            if sum(w for _, w, _ in combo) <= cap:
                best = max(best, sum(v for _, _, v in combo))
    return best


check("page demo, capacity 10 -> 90 with B + D", knapsack(page_items, 10) == (90, ["B", "D"]))
ok = True
for _ in range(300):
    items = [(chr(65 + i), rng.randint(1, 8), rng.randint(1, 30)) for i in range(rng.randint(0, 6))]
    cap = rng.randint(0, 16)
    value, taken = knapsack(items, cap)
    chosen = [it for it in items if it[0] in taken]
    ok &= (value == knapsack_brute(items, cap)
           and sum(w for _, w, _ in chosen) <= cap
           and sum(v for _, _, v in chosen) == value)
check("optimal, feasible, and the taken items add up (300 random cases)", ok)

# --- N-Queens ----------------------------------------------------------------
print("n_queens")
solve = load("n_queens").solve_n_queens
known = [1, 0, 0, 2, 10, 4, 40, 92]
check("solution counts for n = 1..8 are 1,0,0,2,10,4,40,92",
      [len(solve(n)) for n in range(1, 9)] == known)


def valid(board):
    return all(board[i] != board[j] and abs(board[i] - board[j]) != j - i
               for i in range(len(board)) for j in range(i + 1, len(board)))


six = solve(6)
check("every 6x6 solution is conflict-free and distinct",
      all(valid(b) for b in six) and len({tuple(b) for b in six}) == len(six))

# --- Topological sort --------------------------------------------------------
print("topological_sort")
topo = load("topological_sort").topological_sort
courses = ["intro", "data", "algos", "discrete", "os", "compilers"]
prereqs = [("intro", "data"), ("intro", "discrete"), ("data", "algos"),
           ("discrete", "algos"), ("data", "os"), ("algos", "compilers")]


def respects(order, nodes, edges):
    pos = {v: i for i, v in enumerate(order)}
    return sorted(order) == sorted(nodes) and all(pos[u] < pos[v] for u, v in edges)


check("page DAG order respects every prerequisite", respects(topo(courses, prereqs), courses, prereqs))
check("page DAG plus compilers -> intro is reported as a cycle",
      topo(courses, prereqs + [("compilers", "intro")]) is None)
ok = True
for _ in range(200):
    n = rng.randint(1, 8)
    nodes = [str(i) for i in range(n)]
    perm = nodes[:]
    rng.shuffle(perm)
    dag = [(perm[i], perm[j]) for i in range(n) for j in range(i + 1, n) if rng.random() < 0.3]
    order = topo(nodes, dag)
    ok &= order is not None and respects(order, nodes, dag)
    if dag:  # the reverse of an existing edge always closes a two-node cycle
        u, v = rng.choice(dag)
        cyclic = dag + [(v, u)]
        ok &= topo(nodes, cyclic) is None
check("random DAGs sort correctly, and adding a back edge is caught (200 cases)", ok)

# --- Kruskal + Union-Find ----------------------------------------------------
print("kruskal_union_find")
kruskal = load("kruskal_union_find").kruskal
weighted = [("A", "B", 2), ("A", "C", 3), ("B", "C", 1), ("B", "D", 4),
            ("C", "E", 6), ("D", "E", 5), ("D", "F", 7), ("E", "F", 2)]


def spans(nodes, edges):
    parent = {x: x for x in nodes}

    def find(x):
        while parent[x] != x:
            x = parent[x]
        return x

    for u, v, _ in edges:
        ru, rv = find(u), find(v)
        if ru == rv:
            return False
        parent[ru] = rv
    return len({find(x) for x in nodes}) == 1


def mst_brute(nodes, edges):
    return min(sum(w for _, _, w in combo)
               for combo in itertools.combinations(edges, len(nodes) - 1) if spans(nodes, combo))


tree = kruskal("ABCDEF", weighted)
check("page graph: 5 edges, total weight 14 (the brute-force minimum)",
      len(tree) == 5 and sum(w for _, _, w in tree) == 14 == mst_brute("ABCDEF", weighted))
ok = True
for _ in range(150):
    n = rng.randint(2, 6)
    nodes = [str(i) for i in range(n)]
    edges = [(nodes[i - 1], nodes[i], rng.randint(1, 9)) for i in range(1, n)]  # connected
    edges += [(u, v, rng.randint(1, 9)) for u, v in itertools.combinations(nodes, 2) if rng.random() < 0.4]
    tree = kruskal(nodes, edges)
    ok &= spans(nodes, tree) and sum(w for _, _, w in tree) == mst_brute(nodes, edges)
check("random connected graphs: a spanning tree of minimum weight (150 cases)", ok)

# --- Trie --------------------------------------------------------------------
print("trie")
Trie = load("trie").Trie
trie = Trie()
words = ["cat", "car", "card", "care", "dog", "do"]
for w in words:
    trie.insert(w)
check('search("card") finds a stored word', trie.search("card"))
check('search("ca") is false: a prefix is not a word', not trie.search("ca"))
check('search("cab") is false: the path falls off', not trie.search("cab"))
check('starts_with("ca") -> car, card, care, cat', trie.starts_with("ca") == ["car", "card", "care", "cat"])
check('starts_with("x") -> nothing', trie.starts_with("x") == [])
ok = True
for _ in range(100):
    stored = {random_word("ab", 5) for _ in range(rng.randint(0, 8))}
    t = Trie()
    for w in stored:
        t.insert(w)
    probe = random_word("ab", 5)
    ok &= t.search(probe) == (probe in stored)
    ok &= t.starts_with(probe) == sorted(w for w in stored if w.startswith(probe))
check("random word sets: search and starts_with agree with a set (100 cases)", ok)

print("\ngradient descent")
gd = load("gradient_descent")
bowl, _ = gd.gradient_descent(lambda p: [2 * p[0], 2 * p[1]], [-2.4, 1.5], lr=0.3)
check("reaches the bottom of x² + y²", abs(bowl[0]) < 1e-5 and abs(bowl[1]) < 1e-5)
_, plain_path = gd.gradient_descent(gd.valley_grad, [-2.6, 1.2], lr=0.1)
end, mom_path = gd.gradient_descent(gd.valley_grad, [-2.6, 1.2], lr=0.1, momentum=0.8)
check("momentum reaches the valley floor in fewer steps", len(mom_path) < len(plain_path) and abs(end[0]) < 1e-4)
first = gd.adam(gd.valley_grad, [-2.6, 1.2], lr=0.1, steps=1)
check("Adam's first step is lr in every direction (bias correction)", abs(abs(first[0] + 2.6) - 0.1) < 1e-6 and abs(abs(first[1] - 1.2) - 0.1) < 1e-6)
end = gd.adam(gd.valley_grad, [-2.6, 1.2], lr=0.1, steps=400)
check("Adam reaches the valley floor", abs(end[0]) < 1e-2 and abs(end[1]) < 1e-2)
xs = [rng.uniform(-1, 1) for _ in range(40)]
ys = [2 * x + 1 + rng.gauss(0, 0.3) for x in xs]
mx, my = sum(xs) / 40, sum(ys) / 40
slope = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sum((x - mx) ** 2 for x in xs)
ok = True
for size in (40, 8, 1):
    w, b = gd.minibatch_sgd(xs, ys, lr=0.05 if size == 1 else 0.1, batch_size=size, epochs=300)
    ok &= abs(w - slope) < 0.1 and abs(b - (my - slope * mx)) < 0.1
check("batch, mini-batch and SGD all land near the least-squares line", ok)

print("\nlinear regression")
lr_mod = load("linear_regression")
ok = True
for _ in range(100):
    n = rng.randint(3, 20)
    xs = [rng.uniform(0, 10) for _ in range(n)]
    if max(xs) - min(xs) < 0.5:
        continue
    ys = [rng.uniform(-1, 1) * 3 + 0.7 * x for x in xs]
    mx, my = sum(xs) / n, sum(ys) / n
    slope = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sum((x - mx) ** 2 for x in xs)
    got = lr_mod.fit_line(xs, ys)
    ok &= abs(got[0] - slope) < 1e-4 and abs(got[1] - (my - slope * mx)) < 1e-3
check("matches the closed-form least-squares line (100 random sets)", ok)
slope, intercept = lr_mod.fit_line_exact([1, 2, 3, 4, 5], [2, 4, 5, 4, 5])
check("the page's 5-point example: slope 0.6, intercept 2.2", abs(slope - 0.6) < 1e-12 and abs(intercept - 2.2) < 1e-12)
check("R² of that line is 0.6", abs(lr_mod.r_squared([1, 2, 3, 4, 5], [2, 4, 5, 4, 5], slope, intercept) - 0.6) < 1e-12)
ys5 = [2, 4, 5, 4, 5]
check("R² of always predicting the mean is 0", abs(lr_mod.r_squared([1, 2, 3, 4, 5], ys5, 0, 4) - 0) < 1e-12)
check("R² is undefined for constant targets", math.isnan(lr_mod.r_squared([1, 3], [4, 4], 0, 4)))
check("oscillating regression does not falsely converge", lr_mod.fit_line([1, 3], [2, 4], lr=1, epochs=10) == (0, 0))

print("\nk-means")
km = load("k_means")
ok = True
for _ in range(60):
    pts = [(rng.uniform(0, 10), rng.uniform(0, 10)) for _ in range(rng.randint(6, 30))]
    k = rng.randint(1, 4)
    centres, labels = km.k_means(pts, k, seed=rng.randint(0, 999))
    d2 = lambda a, b: (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2
    ok &= all(d2(p, centres[lab]) <= min(d2(p, c) for c in centres) + 1e-9 for p, lab in zip(pts, labels))
    for c in range(k):
        members = [p for p, lab in zip(pts, labels) if lab == c]
        if members:
            ok &= abs(centres[c][0] - sum(p[0] for p in members) / len(members)) < 1e-9
check("every point is on its nearest centre, every centre is its points' mean (60 cases)", ok)
centres, labels = km.k_means([(2, 2)] * 4, 3, seed=0)
check("k-means++ handles identical points", centres == [(2, 2)] * 3 and labels == [0] * 4)

print("\nself-attention")
sa = load("self_attention")
_, weights = sa.self_attention(sa.X, sa.Wq, sa.I, sa.I)
check("every row of weights sums to 1", all(abs(sum(r) - 1) < 1e-12 for r in weights))
it = sa.words.index("it")
check('"it" attends most to "cat" (the page\'s example)', sa.words[max(range(len(sa.words)), key=lambda j: weights[it][j])] == "cat")
rows = [[rng.uniform(-1, 1) for _ in range(3)] for _ in range(4)]
eye = [[1 if i == j else 0 for j in range(3)] for i in range(3)]
out, w = sa.self_attention(rows, eye, eye, eye)
manual = [sum(w[0][j] * rows[j][f] for j in range(4)) for f in range(3)]
check("output is the weights times the values", all(abs(a - b) < 1e-12 for a, b in zip(out[0], manual)))
_, wm = sa.self_attention(sa.X, sa.Wq, sa.I, sa.I, causal=True)
check("causal mask: no word attends to a later word", all(wm[i][j] == 0 for i in range(len(wm)) for j in range(i + 1, len(wm))))
check("causal mask: rows still sum to 1", all(abs(sum(r) - 1) < 1e-12 for r in wm))
hx = [[1, 0, 0], [0, 1, 0], [1, 0, 1]]
_, hw = sa.self_attention(hx, [[0, 2], [2, 0], [0, 0]], [[1, 0], [0, 1], [0, 0]], [[1, 0], [0, 1], [0, 1]])
check("the page's cats/chase/mice example: cats gives 0.6728 to chase", abs(hw[0][1] - 0.6728) < 1e-4)

print("\nnext-token sampling")
smp = load("sampling")
p = smp.next_token_probs(smp.logits, temperature=1.0, top_k=3)
check("top-k = 3 keeps three words and sums to 1", sum(1 for v in p if v > 0) == 3 and abs(sum(p) - 1) < 1e-12)
p = smp.next_token_probs(smp.logits, temperature=0.05)
check("temperature near 0 picks the top word", p[0] > 0.999)
p = smp.next_token_probs(smp.logits, temperature=1.0, top_p=0.95)
kept = sorted((v for v in p if v > 0), reverse=True)
full = smp.next_token_probs(smp.logits)
check("top-p keeps the smallest set reaching p", sum(full[:len(kept)]) >= 0.95 and sum(full[:len(kept) - 1]) < 0.95)
draws = [smp.sample_next(smp.logits, rng=rng) for _ in range(20000)]
check("sampling frequencies match the probabilities", all(abs(draws.count(i) / 20000 - v) < 0.02 for i, v in enumerate(full)))
check("top-p uses the rescaled top-k distribution", smp.next_token_probs([6.1, 5.6, 5.3, 5.1], top_k=2, top_p=0.5) == [1, 0, 0, 0])

print("\ntiny neural network")
mlp = load("tiny_mlp")
data = [(rng.uniform(-1, 1), rng.uniform(-1, 1), rng.randint(0, 1)) for _ in range(12)]


def grad_check(net):
    grads = net.gradients(data)
    flat_g = [*grads[0][0], *grads[0][1], *grads[0][2], *grads[0][3], *grads[1], *grads[2], grads[3]]
    params = [(net.W1, (j, i)) for j in range(4) for i in range(2)] + [(net.b1, j) for j in range(4)] + [(net.W2, j) for j in range(4)]
    ok = True
    h = 1e-6
    for (arr, idx), g in zip(params, flat_g):
        def get():
            return arr[idx[0]][idx[1]] if isinstance(idx, tuple) else arr[idx]
        def put(v):
            if isinstance(idx, tuple):
                arr[idx[0]][idx[1]] = v
            else:
                arr[idx] = v
        v0 = get()
        put(v0 + h); up = net.loss(data)
        put(v0 - h); down = net.loss(data)
        put(v0)
        ok &= abs((up - down) / (2 * h) - g) < 1e-6
    net.b2 += h; up = net.loss(data); net.b2 -= 2 * h; down = net.loss(data); net.b2 += h
    ok &= abs((up - down) / (2 * h) - grads[3]) < 1e-6
    return ok


for act in mlp.ACTIVATIONS:
    check(f"backprop gradients match finite differences ({act})", grad_check(mlp.TinyMLP(hidden=4, seed=3, activation=act)))

stable_net = mlp.TinyMLP(hidden=1)
stable_net.W2 = [0]
for logit, label in ((1000, 0), (-1000, 1)):
    stable_net.b2 = logit
    check(f"cross-entropy stays finite and accurate at logit {logit}", stable_net.loss([(0, 0, label)]) == 1000)

xor_net = mlp.TinyMLP(hidden=4, seed=1)
xor_net.train(mlp.xor)
check("learns XOR", [xor_net.predict(x, y) for x, y, _ in mlp.xor] == [0, 0, 1, 1])

print("\ndecision tree")
dt = load("decision_tree")
check("Gini of a 50/50 group is 0.5, of a pure group 0", abs(dt.gini(["a"] * 5 + ["b"] * 5) - 0.5) < 1e-12 and dt.gini(["a"] * 4) == 0)
labels10 = list("AAABAABBBB")
s = dt.best_split([[i + 1] for i in range(10)], labels10)
check("the page's 10-point example splits at 6.5 with weighted Gini 1/6", s[2] == 6.5 and abs(s[0] - 1 / 6) < 1e-12)
ok = True
for _ in range(60):
    n = rng.randint(4, 25)
    rows = [[rng.randint(0, 9), rng.randint(0, 9)] for _ in range(n)]
    labs = [rng.randint(0, 2) for _ in range(n)]
    got = dt.best_split(rows, labs)
    # brute force over every threshold at every value
    best = None
    for f in range(2):
        for t in set(r[f] for r in rows):
            L = [lab for r, lab in zip(rows, labs) if r[f] <= t]
            R = [lab for r, lab in zip(rows, labs) if r[f] > t]
            if L and R:
                sc = len(L) / n * dt.gini(L) + len(R) / n * dt.gini(R)
                best = sc if best is None else min(best, sc)
    ok &= (got is None and best is None) or (got is not None and best is not None and abs(got[0] - best) < 1e-12)
check("best_split finds the lowest weighted Gini (60 random sets)", ok)
ok = True
for _ in range(40):
    n = rng.randint(5, 30)
    rows = [[rng.uniform(0, 10), rng.uniform(0, 10)] for _ in range(n)]
    labs = [rng.randint(0, 1) for _ in range(n)]
    tree = dt.build_tree(rows, labs, max_depth=50)
    ok &= all(dt.predict(tree, r) == lab for r, lab in zip(rows, labs))
check("an unlimited tree fits every training point (distinct values, 40 sets)", ok)

print("\nnaive Bayes")
nbm = load("naive_bayes")
words = "win free money now prize claim cash meeting lunch project notes today monday".split()
ok = True
for _ in range(60):
    texts = [" ".join(rng.choice(words) for _ in range(rng.randint(2, 6))) for _ in range(rng.randint(4, 12))]
    labels = [rng.choice(["spam", "ham"]) for _ in texts]
    if len(set(labels)) < 2:
        continue
    model = nbm.NaiveBayes(alpha=1.0).fit(texts, labels)
    probe = " ".join(rng.choice(words) for _ in range(rng.randint(1, 5)))
    # Independent: multiply the raw probabilities out, then divide by the total.
    raw = {}
    for c in ["spam", "ham"]:
        cnt = {}
        tot = 0
        for t, lab in zip(texts, labels):
            if lab == c:
                for w in t.split():
                    cnt[w] = cnt.get(w, 0) + 1
                    tot += 1
        vocab = {w for t in texts for w in t.split()}
        pr = labels.count(c) / len(labels)
        for w in probe.split():
            if w in vocab:
                pr *= (cnt.get(w, 0) + 1) / (tot + len(vocab))
        raw[c] = pr
    got = model.predict_proba(probe)
    ok &= abs(got["spam"] - raw["spam"] / (raw["spam"] + raw["ham"])) < 1e-9
check("probabilities match multiplying everything out (60 random sets)", ok)
m = nbm.NaiveBayes(alpha=1.0).fit(["a b", "a c", "d e"], ["s", "s", "h"])
check("smoothed word chances add up to 1 over the vocabulary", abs(sum(m.word_prob(w, "s") for w in m.vocab) - 1) < 1e-12)
m0 = nbm.NaiveBayes(alpha=0.0).fit(["free offer", "free cash"], ["spam", "ham"])  # "offer" never appears in ham
check("with alpha = 0 an unseen-in-class word rules the class out", m0.predict_proba("free offer")["ham"] == 0.0)

print("\nrandom forest")
rf = load("random_forest")
forest = rf.RandomForest(n_trees=200, seed=3).fit([[i, 0] for i in range(80)], ["a"] * 80)
left = sum(len(o) for o in forest.out_of_bag) / (200 * 80)
check("bootstrap samples leave out about a third of the rows (≈ 0.366 for n = 80)", abs(left - (1 - 1 / 80) ** 80) < 0.01)
wins = 0
for trial in range(5):
    r = rng
    def noisy(n):
        pts, labs = [], []
        for i in range(n):
            lab = i % 2
            pts.append([r.gauss(6.5 if lab else 3.5, 1.6), r.gauss(6 if lab else 4, 1.6)])
            labs.append(lab if r.random() > 0.15 else 1 - lab)
        return pts, labs
    tr_x, tr_y = noisy(80)
    te_x, te_y = noisy(600)
    tree = rf.build_tree(tr_x, tr_y, random.Random(0), 2)
    single = sum(max(rf.leaf_probs(tree, x).items(), key=lambda kv: kv[1])[0] == y for x, y in zip(te_x, te_y)) / len(te_y)
    model = rf.RandomForest(n_trees=40, seed=trial).fit(tr_x, tr_y)
    combined = sum(model.predict(x) == y for x, y in zip(te_x, te_y)) / len(te_y)
    wins += combined > single
check("the forest beats a single fully grown tree on new noisy points (5 of 5 trials)", wins == 5)

print("\ngradient boosting")
gb = load("gradient_boosting")
m = gb.GradientBoosting(n_trees=1, learning_rate=0.5).fit([1, 2, 3, 4, 5], [1, 3, 2, 5, 4])
check("the page's 5-point example: 2.5 on the left, 3.75 on the right", [round(m.predict(x), 10) for x in [1, 3, 4, 5]] == [2.5, 2.5, 3.75, 3.75])
ok = True
for _ in range(40):
    xs = [rng.uniform(0, 10) for _ in range(rng.randint(5, 30))]
    ys = [rng.uniform(-3, 3) for _ in xs]
    t, l, r = gb.fit_stump(xs, ys)
    def err(t0):
        L = [y for x, y in zip(xs, ys) if x <= t0]
        R = [y for x, y in zip(xs, ys) if x > t0]
        if not L or not R:
            return float("inf")
        lm, rm = sum(L) / len(L), sum(R) / len(R)
        return sum((y - lm) ** 2 for y in L) + sum((y - rm) ** 2 for y in R)
    ok &= abs(err(t) - min(err(x) for x in xs)) < 1e-9
check("fit_stump finds the lowest squared error (40 random sets)", ok)
ok = True
for _ in range(20):
    xs = [rng.uniform(0, 10) for _ in range(25)]
    ys = [math.sin(x) + rng.gauss(0, 0.3) for x in xs]
    prev = float("inf")
    for n in range(0, 30, 3):
        mdl = gb.GradientBoosting(n_trees=n, learning_rate=0.3).fit(xs, ys)
        e = sum((y - mdl.predict(x)) ** 2 for x, y in zip(xs, ys))
        ok &= e <= prev + 1e-9
        prev = e
check("training error never goes up as trees are added (lr <= 1)", ok)

print("\nNeetCode 150: Arrays & Hashing")
nc = {name: load(f"neetcode/{name}") for name in ["contains_duplicate", "valid_anagram", "two_sum", "group_anagrams", "top_k_frequent", "product_except_self", "valid_sudoku", "encode_decode", "longest_consecutive"]}
ok = True
for _ in range(300):
    nums = [rng.randint(-5, 9) for _ in range(rng.randint(0, 9))]
    ok &= nc["contains_duplicate"].contains_duplicate(nums) == (len(set(nums)) != len(nums))
check("contains duplicate matches a set-size check (300 cases)", ok)
ok = True
for _ in range(300):
    s = "".join(rng.choice("abc") for _ in range(rng.randint(0, 6)))
    t = "".join(rng.choice("abc") for _ in range(rng.randint(0, 6)))
    ok &= nc["valid_anagram"].is_anagram(s, t) == (sorted(s) == sorted(t))
check("valid anagram matches comparing sorted strings (300 cases)", ok)
ok = True
for _ in range(300):
    nums = rng.sample(range(-20, 20), rng.randint(2, 8))
    i, j = sorted(rng.sample(range(len(nums)), 2))
    target = nums[i] + nums[j]
    a, b = nc["two_sum"].two_sum(nums, target)
    ok &= a < b and nums[a] + nums[b] == target
check("two sum returns two indices that add to the target (300 cases)", ok)
ok = True
for _ in range(200):
    words = ["".join(rng.choice("abc") for _ in range(rng.randint(0, 3))) for _ in range(rng.randint(0, 7))]
    got = sorted(sorted(g) for g in nc["group_anagrams"].group_anagrams(words))
    want = {}
    for w in words:
        want.setdefault("".join(sorted(w)), []).append(w)
    ok &= got == sorted(sorted(g) for g in want.values())
check("group anagrams matches grouping by sorted word (200 cases)", ok)
ok = True
for _ in range(200):
    vals = rng.sample(range(10), rng.randint(2, 5))
    freqs = rng.sample(range(1, 7), len(vals))
    nums = [v for v, f in zip(vals, freqs) for _ in range(f)]
    rng.shuffle(nums)
    k = rng.randint(1, len(vals))
    want = {v for v, f in sorted(zip(vals, freqs), key=lambda x: -x[1])[:k]}
    ok &= set(nc["top_k_frequent"].top_k_frequent(nums, k)) == want
check("top k frequent returns the k most common values (200 cases)", ok)
ok = True
for _ in range(300):
    nums = [rng.randint(-3, 4) for _ in range(rng.randint(1, 7))]
    want = [math.prod(nums[:i] + nums[i + 1 :]) for i in range(len(nums))]
    ok &= nc["product_except_self"].product_except_self(nums) == want
check("product except self matches multiplying the others (300 cases)", ok)
ok = True
for _ in range(200):
    board = [[rng.choice(".........123456789") for _ in range(9)] for _ in range(9)]
    def brute_valid(b):
        groups = [[b[r][c] for c in range(9)] for r in range(9)] + [[b[r][c] for r in range(9)] for c in range(9)]
        groups += [[b[r][c] for r in range(br, br + 3) for c in range(bc, bc + 3)] for br in (0, 3, 6) for bc in (0, 3, 6)]
        return all(len([d for d in g if d != "."]) == len({d for d in g if d != "."}) for g in groups)
    ok &= nc["valid_sudoku"].is_valid_sudoku(board) == brute_valid(board)
check("valid sudoku matches checking all 27 groups (200 boards)", ok)
ok = True
for _ in range(300):
    words = ["".join(rng.choice("a#1 2") for _ in range(rng.randint(0, 12))) for _ in range(rng.randint(0, 5))]
    ok &= nc["encode_decode"].decode(nc["encode_decode"].encode(words)) == words
check("decode(encode(words)) == words, with # and digits (300 cases)", ok)
ok = True
for _ in range(300):
    nums = [rng.randint(0, 15) for _ in range(rng.randint(0, 10))]
    s, best = set(nums), 0
    for n in s:
        l = 0
        while n + l in s:
            l += 1
        best = max(best, l)
    ok &= nc["longest_consecutive"].longest_consecutive(nums) == best
check("longest consecutive matches counting up from every number (300 cases)", ok)

print("\nNeetCode 150: Two Pointers")
tp = {name: load(f"neetcode/{name}") for name in ["valid_palindrome", "two_sum_ii", "three_sum", "container_most_water", "trapping_rain_water"]}
ok = True
for _ in range(300):
    s = "".join(rng.choice("abAB ,.1") for _ in range(rng.randint(0, 10)))
    if rng.random() < 0.5:
        s = s + s[::-1]
    clean = [c.lower() for c in s if c.isalnum()]
    ok &= tp["valid_palindrome"].is_palindrome(s) == (clean == clean[::-1])
check("valid palindrome matches comparing the cleaned string with its reverse (300 cases)", ok)
ok = True
for _ in range(300):
    nums = sorted(rng.sample(range(-15, 30), rng.randint(2, 9)))
    i, j = sorted(rng.sample(range(len(nums)), 2))
    target = nums[i] + nums[j]
    a, b = tp["two_sum_ii"].two_sum_sorted(nums, target)
    ok &= a < b and nums[a - 1] + nums[b - 1] == target
check("two sum II returns 1-based positions that add to the target (300 cases)", ok)
ok = True
for _ in range(200):
    nums = [rng.randint(-4, 4) for _ in range(rng.randint(0, 9))]
    want = sorted({tuple(sorted(t)) for t in itertools.combinations(nums, 3) if sum(t) == 0})
    got = sorted(tuple(t) for t in tp["three_sum"].three_sum(nums))
    ok &= got == want
check("3sum matches checking every triple, with no repeats (200 cases)", ok)
ok = True
for _ in range(300):
    h = [rng.randint(0, 9) for _ in range(rng.randint(2, 12))]
    want = max(min(h[i], h[j]) * (j - i) for i in range(len(h)) for j in range(i + 1, len(h)))
    ok &= tp["container_most_water"].max_area(h) == want
check("container with most water matches trying every pair (300 cases)", ok)
ok = True
for _ in range(300):
    h = [rng.randint(0, 6) for _ in range(rng.randint(0, 14))]
    want = sum(min(max(h[: i + 1]), max(h[i:])) - h[i] for i in range(len(h)))
    ok &= tp["trapping_rain_water"].trap(h) == want
check("trapping rain water matches min(left max, right max) - height per bar (300 cases)", ok)

print("\nNeetCode 150: Sliding Window")
sw = {name: load(f"neetcode/{name}") for name in ["best_time_stock", "longest_substring", "character_replacement", "permutation_in_string", "minimum_window", "sliding_window_max"]}
ok = True
for _ in range(300):
    p = [rng.randint(1, 9) for _ in range(rng.randint(1, 10))]
    want = max([0] + [p[j] - p[i] for i in range(len(p)) for j in range(i + 1, len(p))])
    ok &= sw["best_time_stock"].max_profit(p) == want
check("best time to buy and sell matches trying every buy/sell pair (300 cases)", ok)
ok = True
for _ in range(300):
    s = "".join(rng.choice("abcd ") for _ in range(rng.randint(0, 12)))
    want = max([0] + [j - i for i in range(len(s)) for j in range(i + 1, len(s) + 1) if len(set(s[i:j])) == j - i])
    ok &= sw["longest_substring"].length_of_longest_substring(s) == want
check("longest substring without repeats matches checking every substring (300 cases)", ok)
ok = True
for _ in range(300):
    s = "".join(rng.choice("ABC") for _ in range(rng.randint(0, 12)))
    k = rng.randint(0, 3)
    want = max([0] + [j - i for i in range(len(s)) for j in range(i + 1, len(s) + 1) if (j - i) - max(s[i:j].count(c) for c in "ABC") <= k])
    ok &= sw["character_replacement"].character_replacement(s, k) == want
check("character replacement matches checking every substring (300 cases)", ok)
ok = True
for _ in range(300):
    s1 = "".join(rng.choice("abcd") for _ in range(rng.randint(1, 4)))
    s2 = "".join(rng.choice("abcd") for _ in range(rng.randint(0, 10)))
    want = any(sorted(s2[i : i + len(s1)]) == sorted(s1) for i in range(len(s2) - len(s1) + 1))
    ok &= sw["permutation_in_string"].check_inclusion(s1, s2) == want
check("permutation in string matches sorting every window (300 cases)", ok)
ok = True
for _ in range(300):
    s = "".join(rng.choice("abcx") for _ in range(rng.randint(0, 12)))
    t = "".join(rng.choice("abc") for _ in range(rng.randint(1, 3)))
    cands = [s[i:j] for i in range(len(s)) for j in range(i + 1, len(s) + 1) if all(s[i:j].count(c) >= t.count(c) for c in set(t))]
    got = sw["minimum_window"].min_window(s, t)
    want_len = min((len(w) for w in cands), default=0)
    ok &= len(got) == want_len and (got in cands or (got == "" and not cands))
check("minimum window is a shortest window that covers t (300 cases)", ok)
ok = True
for _ in range(300):
    nums = [rng.randint(-5, 9) for _ in range(rng.randint(1, 12))]
    k = rng.randint(1, len(nums))
    ok &= sw["sliding_window_max"].max_sliding_window(nums, k) == [max(nums[i : i + k]) for i in range(len(nums) - k + 1)]
check("sliding window maximum matches max() of every window (300 cases)", ok)

print("\nNeetCode 150: Stack")
st = {name: load(f"neetcode/{name}") for name in ["valid_parentheses", "min_stack", "eval_rpn", "generate_parentheses", "daily_temperatures", "car_fleet", "largest_rectangle"]}
ok = True
for _ in range(300):
    s = "".join(rng.choice("()[]{}") for _ in range(rng.randint(0, 10)))
    t = s
    while True:
        u = t.replace("()", "").replace("[]", "").replace("{}", "")
        if u == t:
            break
        t = u
    ok &= st["valid_parentheses"].is_valid(s) == (t == "")
check("valid parentheses matches deleting adjacent pairs until none are left (300 cases)", ok)
ok = True
for _ in range(200):
    ms, ref = st["min_stack"].MinStack(), []
    for _ in range(20):
        if not ref or rng.random() < 0.5:
            v = rng.randint(-9, 9)
            ms.push(v)
            ref.append(v)
        elif rng.random() < 0.3:
            ms.pop()
            ref.pop()
        else:
            ok &= ms.top() == ref[-1] and ms.getMin() == min(ref)
check("min stack's top and getMin match a plain list (200 runs)", ok)
ok = True
for _ in range(300):
    def expr(d):
        if d == 0 or rng.random() < 0.3:
            v = rng.randint(-9, 9)
            return [str(v)], v
        (lt, lv), (rt, rv) = expr(d - 1), expr(d - 1)
        op = rng.choice("+-*/")
        if op == "/" and rv == 0:
            op = "+"
        # Reference maths with fractions, truncated towards zero at each division.
        from fractions import Fraction
        v = {"+": lv + rv, "-": lv - rv, "*": lv * rv}.get(op)
        if op == "/":
            q = Fraction(lv, rv)
            v = int(q) if q >= 0 else -int(-q)
        return lt + rt + [op], v
    tokens, want = expr(4)
    ok &= st["eval_rpn"].eval_rpn(tokens) == want
check("RPN matches evaluating the expression tree, dividing towards zero (300 cases)", ok)
ok = True
for n in range(1, 8):
    def valid(s):
        d = 0
        for c in s:
            d += 1 if c == "(" else -1
            if d < 0:
                return False
        return d == 0
    want = sorted("".join(p) for p in itertools.product("()", repeat=2 * n) if valid(p))
    ok &= sorted(st["generate_parentheses"].generate_parenthesis(n)) == want
check("generate parentheses matches filtering all 2^(2n) strings, n = 1..7", ok)
ok = True
for _ in range(300):
    t = [rng.randint(60, 75) for _ in range(rng.randint(0, 12))]
    want = [next((j - i for j in range(i + 1, len(t)) if t[j] > t[i]), 0) for i in range(len(t))]
    ok &= st["daily_temperatures"].daily_temperatures(t) == want
check("daily temperatures matches scanning forward from each day (300 cases)", ok)
ok = True
for _ in range(300):
    target = rng.randint(10, 30)
    pos = rng.sample(range(target), rng.randint(1, 8))
    spd = [rng.randint(1, 6) for _ in pos]
    # Simulate in exact time steps: a car leads a fleet if it is slower to arrive than every car ahead.
    from fractions import Fraction
    times = {p: Fraction(target - p, s) for p, s in zip(pos, spd)}
    want = sum(1 for p in pos if all(times[p] > times[q] for q in pos if q > p))
    ok &= st["car_fleet"].car_fleet(target, pos, spd) == want
check("car fleet matches counting cars slower than every car ahead (300 cases)", ok)
ok = True
for _ in range(300):
    h = [rng.randint(0, 8) for _ in range(rng.randint(0, 12))]
    want = max([0] + [min(h[i : j + 1]) * (j - i + 1) for i in range(len(h)) for j in range(i, len(h))])
    ok &= st["largest_rectangle"].largest_rectangle_area(h) == want
check("largest rectangle matches trying every range of bars (300 cases)", ok)

print("\nNeetCode 150: Binary Search")
bs = {name: load(f"neetcode/{name}") for name in ["binary_search", "search_2d_matrix", "koko_bananas", "find_min_rotated", "search_rotated", "time_map", "median_two_arrays"]}
ok = True
for _ in range(300):
    nums = sorted(rng.sample(range(-20, 40), rng.randint(0, 12)))
    target = rng.randint(-22, 42)
    ok &= bs["binary_search"].search(nums, target) == (nums.index(target) if target in nums else -1)
check("binary search matches list.index (300 cases)", ok)
ok = True
for _ in range(300):
    rows, cols = rng.randint(1, 5), rng.randint(1, 5)
    flat = sorted(rng.sample(range(0, 60), rows * cols))
    matrix = [flat[r * cols : (r + 1) * cols] for r in range(rows)]
    target = rng.randint(-1, 61)
    ok &= bs["search_2d_matrix"].search_matrix(matrix, target) == (target in flat)
check("search a 2D matrix matches checking every cell (300 cases)", ok)
ok = True
for _ in range(300):
    piles = [rng.randint(1, 30) for _ in range(rng.randint(1, 7))]
    h = rng.randint(len(piles), len(piles) * 4)
    want = next(k for k in range(1, max(piles) + 1) if sum(-(-p // k) for p in piles) <= h)
    ok &= bs["koko_bananas"].min_eating_speed(piles, h) == want
check("koko eating bananas matches trying every speed from 1 up (300 cases)", ok)
ok = True
for _ in range(300):
    s = sorted(rng.sample(range(-20, 40), rng.randint(1, 12)))
    k = rng.randrange(len(s))
    nums = s[k:] + s[:k]
    target = rng.randint(-22, 42)
    ok &= bs["find_min_rotated"].find_min(nums) == min(nums)
    ok &= bs["search_rotated"].search(nums, target) == (nums.index(target) if target in nums else -1)
check("rotated array: find min matches min(), search matches list.index (300 cases)", ok)
ok = True
for _ in range(200):
    tm, ref, t = bs["time_map"].TimeMap(), [], 0
    for _ in range(25):
        key = rng.choice("abc")
        if rng.random() < 0.5:
            t += rng.randint(1, 3)
            val = rng.choice(["x", "y", "z"]) + str(t)
            tm.set(key, val, t)
            ref.append((key, t, val))
        else:
            q = rng.randint(0, t + 2)
            hits = [v for k, tt, v in ref if k == key and tt <= q]
            ok &= tm.get(key, q) == (hits[-1] if hits else "")
check("time map's get matches scanning every version (200 runs)", ok)
ok = True
for _ in range(300):
    a = sorted(rng.randint(-10, 30) for _ in range(rng.randint(0, 8)))
    b = sorted(rng.randint(-10, 30) for _ in range(rng.randint(0 if a else 1, 8)))
    allv = sorted(a + b)
    n = len(allv)
    want = allv[n // 2] if n % 2 else (allv[n // 2 - 1] + allv[n // 2]) / 2
    ok &= bs["median_two_arrays"].find_median_sorted_arrays(a, b) == want
check("median of two sorted arrays matches merging and taking the middle (300 cases)", ok)

print("\nNeetCode 150: Linked List")
ll = {name: load(f"neetcode/{name}") for name in ["reverse_list", "merge_two_lists", "reorder_list", "remove_nth_from_end", "copy_random_list", "add_two_numbers", "linked_list_cycle", "find_duplicate", "lru_cache", "merge_k_lists", "reverse_k_group"]}
def lst(m, xs):
    return m.build(xs)
ok = True
for _ in range(300):
    xs = [rng.randint(0, 9) for _ in range(rng.randint(0, 8))]
    m = ll["reverse_list"]
    ok &= m.to_list(m.reverse_list(m.build(xs))) == xs[::-1]
check("reverse list matches xs[::-1] (300 cases)", ok)
ok = True
for _ in range(300):
    a = sorted(rng.randint(0, 9) for _ in range(rng.randint(0, 6)))
    b = sorted(rng.randint(0, 9) for _ in range(rng.randint(0, 6)))
    m = ll["merge_two_lists"]
    ok &= m.to_list(m.merge_two_lists(m.build(a), m.build(b))) == sorted(a + b)
check("merge two sorted lists matches sorted(a + b) (300 cases)", ok)
ok = True
for n in range(1, 12):
    xs = list(range(n))
    m = ll["reorder_list"]
    h = m.build(xs)
    m.reorder_list(h)
    want, l, r = [], 0, n - 1
    while l <= r:
        want.append(xs[l])
        if l != r:
            want.append(xs[r])
        l, r = l + 1, r - 1
    ok &= m.to_list(h) == want
check("reorder list alternates front and back, n = 1..11", ok)
ok = True
for _ in range(300):
    xs = list(range(rng.randint(1, 8)))
    k = rng.randint(1, len(xs))
    m = ll["remove_nth_from_end"]
    ok &= m.to_list(m.remove_nth_from_end(m.build(xs), k)) == xs[: len(xs) - k] + xs[len(xs) - k + 1 :]
check("remove nth from end matches slicing the list (300 cases)", ok)
ok = True
for _ in range(200):
    n = rng.randint(0, 7)
    vals = [rng.randint(0, 9) for _ in range(n)]
    rand = [rng.choice([None] + list(range(n))) for _ in range(n)]
    m = ll["copy_random_list"]
    h = m.build(vals, rand)
    c = m.copy_random_list(h)
    originals, node = set(), h
    while node:
        originals.add(id(node))
        node = node.next
    copies, node = set(), c
    while node:
        copies.add(id(node))
        node = node.next
    ok &= m.serialise(c) == [[v, r] for v, r in zip(vals, rand)] and not (originals & copies)
check("copy random list has the same shape and shares no nodes (200 cases)", ok)
ok = True
for _ in range(300):
    x, y = rng.randint(0, 10**12), rng.randint(0, 10**12)
    m = ll["add_two_numbers"]
    digits = lambda v: [int(d) for d in str(v)[::-1]]
    ok &= m.to_list(m.add_two_numbers(m.build(digits(x)), m.build(digits(y)))) == digits(x + y)
check("add two numbers matches Python's big integers (300 cases)", ok)
ok = True
for _ in range(300):
    n = rng.randint(1, 8)
    pos = rng.choice([-1] + list(range(n)))
    ok &= ll["linked_list_cycle"].has_cycle(ll["linked_list_cycle"].build(list(range(n)), pos)) == (pos >= 0)
check("linked list cycle detects every planted loop (300 cases)", ok)
ok = True
for _ in range(300):
    n = rng.randint(1, 12)
    dup = rng.randint(1, n)
    nums = list(range(1, n + 1)) + [dup] * rng.randint(1, 3)
    nums = [v if v != 0 else dup for v in nums]
    # keep n + 1 values in 1..n: replace some distinct values with the duplicate
    nums = nums[: n + 1]
    rng.shuffle(nums)
    want = next(v for v in nums if nums.count(v) > 1)
    ok &= ll["find_duplicate"].find_duplicate(nums) == want
check("find the duplicate matches counting (300 cases)", ok)
ok = True
for _ in range(200):
    cap = rng.randint(1, 4)
    c, ref = ll["lru_cache"].LRUCache(cap), []
    for _ in range(30):
        key = rng.randint(1, 6)
        if rng.random() < 0.5:
            v = rng.randint(0, 99)
            c.put(key, v)
            ref = [(k, x) for k, x in ref if k != key] + [(key, v)]
            ref = ref[-cap:]
        else:
            hit = [x for k, x in ref if k == key]
            if hit:
                ref = [(k, x) for k, x in ref if k != key] + [(key, hit[0])]
            ok &= c.get(key) == (hit[0] if hit else -1)
check("LRU cache matches a list kept in order of use (200 runs)", ok)
ok = True
for _ in range(200):
    lists = [sorted(rng.randint(0, 20) for _ in range(rng.randint(0, 5))) for _ in range(rng.randint(0, 6))]
    m = ll["merge_k_lists"]
    ok &= m.to_list(m.merge_k_lists([m.build(l) for l in lists])) == sorted(sum(lists, []))
check("merge k sorted lists matches sorting everything (200 cases)", ok)
ok = True
for _ in range(300):
    xs = list(range(rng.randint(0, 10)))
    k = rng.randint(1, 4)
    want = []
    for i in range(0, len(xs), k):
        g = xs[i : i + k]
        want += g[::-1] if len(g) == k else g
    m = ll["reverse_k_group"]
    ok &= m.to_list(m.reverse_k_group(m.build(xs), k)) == want
check("reverse nodes in k-group matches reversing each full block (300 cases)", ok)

print("\nNeetCode 150: Trees")
tr = {name: load(f"neetcode/{name}") for name in ["invert_tree", "max_depth", "diameter_tree", "balanced_tree", "same_tree", "subtree", "lca_bst", "level_order", "right_side_view", "good_nodes", "validate_bst", "kth_smallest", "build_tree", "max_path_sum", "serialize_tree"]}
B = tr["invert_tree"]  # every module has the same build / to_level helpers
def rtree(n, lo=1, hi=9, unique=False):
    """A random tree in level order, plus its nodes as (value, left, right) dicts."""
    if n == 0:
        return []
    vals = rng.sample(range(lo, hi + 1), n) if unique else [rng.randint(lo, hi) for _ in range(n)]
    root = B.TreeNode(vals[0])
    nodes = [root]
    for v in vals[1:]:
        while True:
            t = rng.choice(nodes)
            side = rng.choice(["left", "right"])
            if getattr(t, side) is None:
                c = B.TreeNode(v)
                setattr(t, side, c)
                nodes.append(c)
                break
    return B.to_level(root)
def bst(n):
    vals = rng.sample(range(1, 50), n)
    root = None
    for v in vals:
        if root is None:
            root = B.TreeNode(v)
            continue
        t = root
        while True:
            side = "left" if v < t.val else "right"
            if getattr(t, side) is None:
                setattr(t, side, B.TreeNode(v))
                break
            t = getattr(t, side)
    return B.to_level(root), sorted(vals)
def nodes_of(t):
    return [t] + nodes_of(t.left) + nodes_of(t.right) if t else []
def h(t):
    return 1 + max(h(t.left), h(t.right)) if t else 0
def mirror(t):
    return B.TreeNode(t.val, mirror(t.right), mirror(t.left)) if t else None
ok = True
for _ in range(200):
    lv = rtree(rng.randint(0, 9))
    ok &= tr["invert_tree"].to_level(tr["invert_tree"].invert_tree(tr["invert_tree"].build(lv))) == B.to_level(mirror(B.build(lv)))
    ok &= tr["max_depth"].max_depth(tr["max_depth"].build(lv)) == h(B.build(lv))
    ok &= tr["diameter_tree"].diameter_of_binary_tree(tr["diameter_tree"].build(lv)) == max([0] + [h(t.left) + h(t.right) for t in nodes_of(B.build(lv))])
    ok &= tr["balanced_tree"].is_balanced(tr["balanced_tree"].build(lv)) == all(abs(h(t.left) - h(t.right)) <= 1 for t in nodes_of(B.build(lv)))
check("invert, max depth, diameter and balanced match direct definitions (200 trees)", ok)
ok = True
for _ in range(300):
    a = rtree(rng.randint(0, 6), 1, 3)
    b = a if rng.random() < 0.4 else rtree(rng.randint(0, 6), 1, 3)
    ok &= tr["same_tree"].is_same_tree(tr["same_tree"].build(a), tr["same_tree"].build(b)) == (a == b)
    sub = rtree(rng.randint(1, 3), 1, 3)
    if rng.random() < 0.5 and a:
        sub = B.to_level(rng.choice(nodes_of(B.build(a))))
    want = any(B.to_level(t) == sub for t in nodes_of(B.build(a)))
    ok &= tr["subtree"].is_subtree(tr["subtree"].build(a), tr["subtree"].build(sub)) == want
check("same tree and subtree match comparing level-order lists (300 cases)", ok)
ok = True
for _ in range(300):
    lv, vals = bst(rng.randint(2, 12))
    p, q = rng.sample(vals, 2)
    root = B.build(lv)
    def path(t, v):
        out = []
        while t:
            out.append(t.val)
            if t.val == v:
                return out
            t = t.left if v < t.val else t.right
    pa, pb = path(root, p), path(root, q)
    i = 0
    while i < min(len(pa), len(pb)) and pa[i] == pb[i]:
        i += 1
    ok &= tr["lca_bst"].lowest_common_ancestor(tr["lca_bst"].build(lv), p, q) == pa[i - 1]
    k = rng.randint(1, len(vals))
    ok &= tr["kth_smallest"].kth_smallest(tr["kth_smallest"].build(lv), k) == vals[k - 1]
check("LCA of a BST matches comparing root paths; kth smallest matches sorting (300 cases)", ok)
ok = True
for _ in range(300):
    lv = rtree(rng.randint(0, 10))
    levels, depth_of = {}, {}
    def walk(t, d):
        if t:
            levels.setdefault(d, []).append(t.val)
            walk(t.left, d + 1)
            walk(t.right, d + 1)
    walk(B.build(lv), 0)
    want = [levels[d] for d in sorted(levels)]
    ok &= tr["level_order"].level_order(tr["level_order"].build(lv)) == want
    ok &= tr["right_side_view"].right_side_view(tr["right_side_view"].build(lv)) == [l[-1] for l in want]
check("level order and right side view match a depth-tagged DFS (300 cases)", ok)
ok = True
for _ in range(300):
    lv = rtree(rng.randint(1, 10))
    good = 0
    def walk(t, path):
        global good
        if t:
            good += all(v <= t.val for v in path)
            walk(t.left, path + [t.val])
            walk(t.right, path + [t.val])
    walk(B.build(lv), [])
    ok &= tr["good_nodes"].good_nodes(tr["good_nodes"].build(lv)) == good
check("count good nodes matches checking every root path (300 cases)", ok)
ok = True
for _ in range(300):
    lv, vals = bst(rng.randint(1, 10))
    if rng.random() < 0.5 and len(vals) > 1:
        idx = [i for i, v in enumerate(lv) if v is not None]
        i, j = rng.sample(idx, 2)
        lv[i], lv[j] = lv[j], lv[i]
    ino = []
    def inorder(t):
        if t:
            inorder(t.left)
            ino.append(t.val)
            inorder(t.right)
    inorder(B.build(lv))
    ok &= tr["validate_bst"].is_valid_bst(tr["validate_bst"].build(lv)) == all(a < b for a, b in zip(ino, ino[1:]))
check("validate BST matches “inorder is strictly increasing” (300 cases)", ok)
ok = True
for _ in range(300):
    lv = rtree(rng.randint(1, 10), 1, 40, unique=True)
    pre, ino = [], []
    def walk(t):
        if t:
            pre.append(t.val)
            walk(t.left)
            ino.append(t.val)
            walk(t.right)
    walk(B.build(lv))
    m = tr["build_tree"]
    ok &= m.to_level(m.build_tree(pre, ino)) == lv
check("construct tree from preorder and inorder rebuilds the tree (300 cases)", ok)
ok = True
for _ in range(300):
    lv = rtree(rng.randint(1, 9), -8, 8)
    root = B.build(lv)
    adj = {}
    for t in nodes_of(root):
        adj.setdefault(id(t), [])
        for c in (t.left, t.right):
            if c:
                adj[id(t)].append(c)
                adj.setdefault(id(c), []).append(t)
    best = -10**9
    def dfs(t, seen, total):
        global best
        best = max(best, total)
        for n in adj[id(t)]:
            if id(n) not in seen:
                dfs(n, seen | {id(n)}, total + n.val)
    for t in nodes_of(root):
        dfs(t, {id(t)}, t.val)
    ok &= tr["max_path_sum"].max_path_sum(tr["max_path_sum"].build(lv)) == best
check("max path sum matches trying every path in the tree (300 cases)", ok)
ok = True
for _ in range(300):
    lv = rtree(rng.randint(0, 10), -20, 20)
    c = tr["serialize_tree"].Codec()
    ok &= tr["serialize_tree"].to_level(c.deserialize(c.serialize(tr["serialize_tree"].build(lv)))) == lv
check("serialize then deserialize gives back the same tree (300 cases)", ok)

print("\nNeetCode 150: Tries")
tri = {name: load(f"neetcode/{name}") for name in ["implement_trie", "word_dictionary", "word_search_ii"]}
ok = True
for _ in range(300):
    t, words = tri["implement_trie"].Trie(), set()
    for _ in range(rng.randint(3, 12)):
        w = "".join(rng.choice("abc") for _ in range(rng.randint(1, 4)))
        op = rng.choice(["insert", "search", "startsWith"])
        if op == "insert":
            t.insert(w); words.add(w)
        elif op == "search":
            ok &= t.search(w) == (w in words)
        else:
            ok &= t.startsWith(w) == any(x.startswith(w) for x in words)
check("trie matches a plain set of words (300 runs)", ok)
ok = True
for _ in range(300):
    d, words = tri["word_dictionary"].WordDictionary(), []
    for _ in range(rng.randint(3, 10)):
        w = "".join(rng.choice("abc") for _ in range(rng.randint(1, 3)))
        if rng.random() < 0.5:
            d.addWord(w); words.append(w)
        else:
            p = "".join("." if rng.random() < 0.4 else c for c in w)
            ok &= d.search(p) == any(len(x) == len(p) and all(a in (".", b) for a, b in zip(p, x)) for x in words)
check("add and search words matches comparing with every word (300 runs)", ok)
def word_on_board(board, w):
    rows, cols = len(board), len(board[0])
    def go(r, c, i, used):
        if not (0 <= r < rows and 0 <= c < cols) or (r, c) in used or board[r][c] != w[i]:
            return False
        if i == len(w) - 1:
            return True
        return any(go(r + dr, c + dc, i + 1, used | {(r, c)}) for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)))
    return any(go(r, c, 0, frozenset()) for r in range(rows) for c in range(cols))
ok = True
for _ in range(300):
    rows, cols = rng.randint(1, 4), rng.randint(1, 4)
    board = [[rng.choice("abc") for _ in range(cols)] for _ in range(rows)]
    words = list({"".join(rng.choice("abc") for _ in range(rng.randint(1, 5))) for _ in range(rng.randint(1, 8))})
    got = tri["word_search_ii"].find_words([row[:] for row in board], words)
    ok &= len(got) == len(set(got)) and sorted(got) == sorted(w for w in words if word_on_board(board, w))
check("word search ii matches a separate search per word (300 boards)", ok)

if failures:
    print(f"\n{len(failures)} check(s) failed:")
    for f in failures:
        print("  ", f)
    sys.exit(1)
print("\nAll guide solutions check out.")
