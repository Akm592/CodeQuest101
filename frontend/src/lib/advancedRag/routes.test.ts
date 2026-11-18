import { describe, expect, it } from "vitest";
import { render } from "../../entry-server";
import { SITE_URL } from "../seo";
import { ADVANCED_CHAPTERS, LESSON_VIEWS } from "./curriculum";

const ROOT = "/visualize/advancedRag";
const escaped = (text: string) => text.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[character]!);

describe("advanced RAG public routes", () => {
  it("renders the overview with links to every chapter", async () => {
    const { html, head } = await render(ROOT);
    expect(html).toContain("Better retrieval. Clearer decisions.");
    for (const chapter of ADVANCED_CHAPTERS) expect(html).toContain(`href="${ROOT}/${chapter.slug}"`);
    expect(head).toContain(`href="${SITE_URL}${ROOT}"`);
    expect(head).toContain("index, follow");
    expect(html).not.toContain("Loading visualizer");
  });

  it("resolves nested chapter paths and keeps lesson views on one chapter canonical", async () => {
    for (const chapter of ADVANCED_CHAPTERS) {
      const path = `${ROOT}/${chapter.slug}`;
      const { html, head } = await render(`${path}?view=watch&lesson=${chapter.lessons[0].id}`);
      expect(html).toContain(escaped(chapter.headline));
      expect(html).toContain(`href="/visualize/rag"`);
      expect(html).not.toContain("This chapter does not exist.");
      expect(head).toContain(`href="${SITE_URL}${path}"`);
      expect(head).not.toContain("?view=");
      expect(head).toContain("index, follow");
    }
  });

  for (const chapter of ADVANCED_CHAPTERS) for (const lesson of chapter.lessons) for (const view of LESSON_VIEWS) {
    it(`renders ${view} alone for ${chapter.slug}/${lesson.id}`, async () => {
      const { html } = await render(`${ROOT}/${chapter.slug}?lesson=${lesson.id}&view=${view}`);
      expect(html, "SSR must not insert buffer padding").not.toContain("\0");
      expect(html, "SSR must preserve Unicode across stream buffer boundaries").not.toContain("\uFFFD");
      expect(html).toContain(escaped(chapter.headline));
      expect(html).not.toContain("Loading the recorded experiment");
      if (view === "understand") expect(html).toContain(escaped(lesson.idea[0]));
      if (view === "watch" || view === "try" && lesson.id !== "clean") {
        expect(html).toContain('aria-label="Interactive data flow diagram"');
        expect(html.match(/class="react-flow__node /g)?.length).toBeGreaterThan(1);
      }
      if (view === "try" && lesson.id === "clean") {
        expect(html).toContain("<textarea");
        expect(html).toContain("Cleaned text");
      }
      if (view === "try") expect(html).toContain(escaped(lesson.tryInstructions[0]));
      if (view === "check") {
        expect(html).toContain(escaped(lesson.check.prompt));
        for (const option of lesson.check.options) expect(html).toContain(escaped(option));
        expect(html).not.toContain('aria-label="Interactive data flow diagram"');
      } else expect(html).not.toContain(escaped(lesson.check.prompt));
    });
  }

  it("keeps invalid chapter paths recoverable and out of search results", async () => {
    const { html, head } = await render(`${ROOT}/unknown`);
    expect(html).toContain("This chapter does not exist.");
    expect(html).toContain(`href="${ROOT}/prepare-text"`);
    expect(head).toContain("noindex, follow");
    expect(head).not.toContain('rel="canonical"');
  });
});
