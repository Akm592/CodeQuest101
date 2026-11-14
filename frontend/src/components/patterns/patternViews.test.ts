import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ARRAYS_HASHING } from "../../lib/patterns/arraysHashing";
import { BINARY_SEARCH } from "../../lib/patterns/binarySearch";
import { LINKED_LIST } from "../../lib/patterns/linkedList";
import { SLIDING_WINDOW } from "../../lib/patterns/slidingWindow";
import { STACK } from "../../lib/patterns/stack";
import { TREES } from "../../lib/patterns/trees";
import { TRIES } from "../../lib/patterns/tries";
import { TWO_POINTERS } from "../../lib/patterns/twoPointers";
import StepView from "./StepView";

describe("interview diagrams", () => {
  it("renders every example frame with finite diagram coordinates", () => {
    for (const p of [...ARRAYS_HASHING, ...BINARY_SEARCH, ...LINKED_LIST, ...SLIDING_WINDOW, ...STACK, ...TREES, ...TRIES, ...TWO_POINTERS]) {
      for (const example of p.examples) for (const step of p.run(example.input)) {
        const html = renderToStaticMarkup(createElement(StepView, { step }));
        expect(html, `${p.title}: ${example.label}: ${step.stage}`).not.toMatch(/(?:cx|cy|x|y|width|height|points|d|style)="[^"]*(?:NaN|Infinity|undefined)/);
      }
    }
  });

  it("shows L, M and R labels in matrix cells", () => {
    const p = BINARY_SEARCH.find((p) => p.id === "search-2d-matrix")!;
    const step = p.run({ matrix: [[1]], target: 1 }).at(-1)!;
    const html = renderToStaticMarkup(createElement(StepView, { step }));
    expect(html).toContain(">LMR</span>");
  });
});
