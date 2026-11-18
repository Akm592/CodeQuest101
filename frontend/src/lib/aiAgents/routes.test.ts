import { describe, expect, it } from "vitest";
import { render } from "../../entry-server";
import { SITE_URL } from "../seo";
import { AGENT_CHAPTERS, AGENT_LESSON_VIEWS } from "./curriculum";

const root = "/visualize/aiAgents";
const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#x27;").replace(/"/g, "&quot;");

describe("AI Agents public course", () => {
  it("links the catalog and every chapter from the prerendered entry points", async () => {
    const overview = await render(root);
    expect(overview.html).toContain("Open Agent Builder");
    expect(overview.head).toContain(`href="${SITE_URL}${root}"`);
    for (const chapter of AGENT_CHAPTERS) expect(overview.html).toContain(`href="${root}/${chapter.slug}"`);
    expect((await render("/visualizations")).html).toContain(`href="${root}"`);
  });

  for (const chapter of AGENT_CHAPTERS) for (const lesson of chapter.lessons) for (const view of AGENT_LESSON_VIEWS) {
    it(`renders ${chapter.slug}/${lesson.id} in ${view}`, async () => {
      const path = `${root}/${chapter.slug}`;
      const { html, head } = await render(`${path}?lesson=${lesson.id}&view=${view}`);
      expect(head).toContain(`href="${SITE_URL}${path}"`);
      expect(head).not.toContain("?lesson=");
      expect(html).toContain(escape(chapter.headline));
      expect(html).not.toMatch(/[\0\uFFFD]/u);
      expect(html).not.toContain("Loading the lesson");
      expect(html).toContain('role="tabpanel"');
      if (view === "understand") expect(html).toContain(escape(lesson.idea[0]));
      if (view === "watch" || view === "try") {
        expect(html).toContain("Authored simulation");
        expect(html).toContain("Run example");
        expect(html).toContain(lesson.id === "builder" && view === "try" ? "Connect tools to the agent" : "Agent execution diagram");
      }
      if (view === "try") {
        expect(html).toContain(escape(lesson.tryInstructions[0]));
        if (lesson.id === "builder") {
          expect(html.replace(/<!-- -->/g, "")).toContain("Disconnect Look up an order");
          expect(html.replace(/<!-- -->/g, "")).toContain("Connect Check stock");
        }
      }
      if (view === "check") {
        expect(html).toContain(escape(lesson.check.prompt));
        for (const option of lesson.check.options) expect(html).toContain(escape(option));
      } else expect(html).not.toContain(escape(lesson.check.prompt));
    });
  }

  it("gives invalid chapter URLs a recovery link and no canonical", async () => {
    const { html, head } = await render(`${root}/missing`);
    expect(html).toContain("This chapter does not exist.");
    expect(html).toContain(`href="${root}/agent-basics"`);
    expect(head).toContain("noindex, follow");
    expect(head).not.toContain('rel="canonical"');
  });
});
