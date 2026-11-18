import { describe, expect, it } from "vitest";
import { allVisualizations } from "../components/homepage/catalog";
import { ADVANCED_CHAPTERS } from "./advancedRag/curriculum";
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

  it("indexes each advanced chapter separately without making lesson views separate pages", () => {
    expect(ADVANCED_CHAPTERS).toHaveLength(8);
    for (const chapter of ADVANCED_CHAPTERS) {
      const path = `/visualize/advancedRag/${chapter.slug}`;
      const page = getSeoPage(path);
      expect(page).toEqual({ path, title: `${chapter.title} | Advanced RAG | CodeQuest101`, description: chapter.summary, index: true });
      expect(getSeoPage(`${path}/`)).toEqual(page);
      expect(publicPages.filter((entry) => entry.path === path)).toHaveLength(1);
    }
    expect(getSeoPage("/visualize/advancedRag/unknown").index).toBe(false);
    expect(publicPages.some((page) => page.path.includes("?"))).toBe(false);
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
