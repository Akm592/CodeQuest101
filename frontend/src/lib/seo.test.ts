import { describe, expect, it } from "vitest";
import { allVisualizations } from "../components/homepage/catalog";
import { getSeoPage, publicPages, utilityPages } from "./seo";

describe("page SEO", () => {
  it("gives every catalog tool a unique indexable page", () => {
    expect(new Set(publicPages.map((page) => page.path)).size).toBe(publicPages.length);
    expect(new Set(publicPages.map((page) => page.title)).size).toBe(publicPages.length);
    expect(new Set(publicPages.map((page) => page.description)).size).toBe(publicPages.length);
    for (const viz of allVisualizations) {
      const page = getSeoPage(`/visualize/${viz.key}`);
      expect(page.index).toBe(true);
      expect(page.title).toContain(viz.seoTitle ?? viz.title);
      expect(page.description).toBe(viz.description);
    }
  });

  it("normalizes trailing slashes without changing the canonical path", () => {
    expect(getSeoPage("/visualize/slidingWindow/")).toEqual(getSeoPage("/visualize/slidingWindow"));
    expect(getSeoPage("/").path).toBe("/");
  });

  it("excludes account, chat and nonexistent pages from search", () => {
    for (const page of utilityPages) {
      expect(getSeoPage(page.path).index).toBe(false);
      expect(publicPages.some((entry) => entry.path === page.path)).toBe(false);
    }
    expect(getSeoPage("/visualize/unknown").index).toBe(false);
    expect(getSeoPage("/unknown").title).toBe("Page Not Found | CodeQuest101");
  });
});
