import { describe, expect, it } from "vitest";

import { TREES } from "./index";
import { serialize } from "./serializeTree";
import { fromLevel, preorder, showLevel, toLevel } from "./tree";

const get = (id: string) => TREES.find((p) => p.id === id)!;
const inputs = (id: string) => [...get(id).examples.map((e) => e.input), ...Array.from({ length: 300 }, (_, s) => get(id).random(s + 1))];

describe("tree helpers", () => {
  it("level order round-trips", () => {
    for (const arr of [[3, 9, 20, null, null, 15, 7], [1, null, 2], [], [1, 2, null, 3]]) expect(toLevel(fromLevel(arr))).toEqual(arr);
  });
});

describe("worked examples match the known answers", () => {
  it("each problem", () => {
    expect(get("invert-tree").solve([4, 2, 7, 1, 3, 6, 9])).toBe("[4,7,2,9,6,3,1]");
    expect(get("max-depth").solve([3, 9, 20, null, null, 15, 7])).toBe(3);
    expect(get("diameter-tree").solve([1, 2, 3, 4, 5])).toBe(3);
    expect(get("balanced-tree").solve([3, 9, 20, null, null, 15, 7])).toBe(true);
    expect(get("balanced-tree").solve([1, 2, 2, 3, 3, null, null, 4, 4])).toBe(false);
    expect(get("same-tree").solve({ p: [1, 2], q: [1, null, 2] })).toBe(false);
    expect(get("subtree").solve({ root: [3, 4, 5, 1, 2], sub: [4, 1, 2] })).toBe(true);
    expect(get("subtree").solve({ root: [3, 4, 5, 1, 2, null, null, null, null, 0], sub: [4, 1, 2] })).toBe(false);
    expect(get("lca-bst").solve({ tree: [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p: 2, q: 8 })).toBe(6);
    expect(get("lca-bst").solve({ tree: [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p: 2, q: 4 })).toBe(2);
    expect(get("level-order").solve([3, 9, 20, null, null, 15, 7])).toBe("[[3], [9, 20], [15, 7]]");
    expect(get("right-side-view").solve([1, 2, 3, null, 5, null, 4])).toBe("[1, 3, 4]");
    expect(get("good-nodes").solve([3, 1, 4, 3, null, 1, 5])).toBe(4);
    expect(get("validate-bst").solve([5, 1, 4, null, null, 3, 6])).toBe(false);
    expect(get("validate-bst").solve([5, 4, 6, null, null, 3, 7])).toBe(false);
    expect(get("kth-smallest").solve({ tree: [5, 3, 6, 2, 4, null, null, 1], k: 3 })).toBe(3);
    expect(get("build-tree").solve({ pre: [3, 9, 20, 15, 7], ino: [9, 3, 15, 20, 7] })).toBe("[3,9,20,null,null,15,7]");
    expect(get("max-path-sum").solve([-10, 9, 20, null, null, 15, 7])).toBe(42);
    expect(get("serialize-tree").solve([1, 2, 3, null, null, 4, 5])).toBe("1,2,N,N,3,4,N,N,5,N,N");
  });
});

describe("the animations", () => {
  it("every list or string answer shown matches the slow solution", () => {
    for (const p of TREES)
      for (const input of inputs(p.id)) {
        const want = p.solve(input);
        if (typeof want === "string") expect(p.run(input).at(-1)!.answer, `${p.title}: ${p.describe(input)}`).toBe(want);
      }
  });
  it("Construct Tree rebuilds a tree with the given traversals", () => {
    const p = get("build-tree");
    for (const input of inputs("build-tree")) {
      const t = fromLevel(JSON.parse(p.run(input).at(-1)!.answer!.replace(/null/g, "null")));
      expect(preorder(t).map((x) => x.val)).toEqual(input.pre);
    }
  });
  it("serialize then read back gives the same tree", () => {
    for (const arr of inputs("serialize-tree")) {
      const tokens = serialize(arr);
      let i = 0;
      const read = (): ReturnType<typeof fromLevel> => {
        const tk = tokens[i++];
        return tk === "N" ? null : { id: "", val: Number(tk), left: read(), right: read() };
      };
      expect(showLevel(toLevel(read()))).toBe(showLevel(arr));
    }
  });
  it("tree pictures: no two nodes share a spot, and every child sits one row below its drawn parent", () => {
    for (const p of TREES)
      for (const input of inputs(p.id).slice(0, 80))
        for (const st of p.run(input)) {
          if (!st.tree) continue;
          const spots = st.tree.nodes.map((n) => `${n.x},${n.depth}`);
          expect(new Set(spots).size, p.title).toBe(spots.length);
          const byId = new Map(st.tree.nodes.map((n) => [n.id, n]));
          for (const n of st.tree.nodes) {
            if (!n.parent) continue;
            const par = byId.get(n.parent)!;
            expect(par, `${p.title}: parent of ${n.id}`).toBeTruthy();
            expect(n.depth).toBe(par.depth + 1);
          }
        }
  });
  it("random inputs cover both answers for the yes/no problems", () => {
    for (const id of ["balanced-tree", "same-tree", "subtree", "validate-bst"]) expect(new Set(inputs(id).map((i) => get(id).solve(i))), id).toEqual(new Set([true, false]));
  });
});
