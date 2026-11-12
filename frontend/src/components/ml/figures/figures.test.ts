import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { boostFigures } from "./boostFigures";
import { kMeansFigures } from "./clusteringFigures";

const circles = (figure: number) => [...renderToStaticMarkup(kMeansFigures[figure].art).matchAll(/<circle\b([^>]*)>/g)].map((m) => {
  const attr = (name: string) => m[1].match(new RegExp(`\\b${name}="([^"]*)"`))![1];
  return { x: Number(attr("cx")), y: Number(attr("cy")), radius: Number(attr("r")), color: attr("fill") };
});

describe("ML concept figures", () => {
  it("moves each k-means centre to the mean of the points actually assigned to it", () => {
    const before = circles(1);
    const after = circles(2);
    const points = before.filter((c) => c.radius === 4);
    expect(after.filter((c) => c.radius === 4)).toEqual(points);
    const centres = after.filter((c) => c.radius === 8);
    const colors = [...new Set(points.map((c) => c.color))];
    for (const [i, color] of colors.entries()) {
      const members = points.filter((c) => c.color === color);
      expect(centres[2 * i + 1].x).toBeCloseTo(members.reduce((s, p) => s + p.x, 0) / members.length, 12);
      expect(centres[2 * i + 1].y).toBeCloseTo(members.reduce((s, p) => s + p.y, 0) / members.length, 12);
    }
  });

  it("starts the boosting sketch at the mean of its plotted targets", () => {
    const html = renderToStaticMarkup(boostFigures[1].art);
    const targets = [...html.matchAll(/<circle[^>]* cy="([^"]*)"/g)].map((m) => Number(m[1]));
    const line = Number(html.match(/<line[^>]* y1="([^"]*)"/)![1]);
    expect(line).toBeCloseTo(targets.reduce((a, b) => a + b, 0) / targets.length, 12);
  });
});
