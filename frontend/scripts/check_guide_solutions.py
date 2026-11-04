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

if failures:
    print(f"\n{len(failures)} check(s) failed:")
    for f in failures:
        print("  ", f)
    sys.exit(1)
print("\nAll guide solutions check out.")
