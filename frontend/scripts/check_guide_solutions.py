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

if failures:
    print(f"\n{len(failures)} check(s) failed:")
    for f in failures:
        print("  ", f)
    sys.exit(1)
print("\nAll guide solutions check out.")
