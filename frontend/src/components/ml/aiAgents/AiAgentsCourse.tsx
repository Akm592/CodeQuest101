import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, Code2, FileText, Layers, Menu, Play, Search, X } from "lucide-react";
import { AGENT_CHAPTERS, AGENT_LESSON_VIEWS, getAgentChapter, getAgentLesson, type AgentLessonView } from "../../../lib/aiAgents/curriculum";
import { Button } from "../../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import type { AgentConfig } from "../../../lib/aiAgents/types";
import "../advancedRag/course.css";
import "./agentCourse.css";

const COURSE_ROOT = "/visualize/aiAgents";

const LessonWorkspace = lazy(() => import("./LessonWorkspace"));
const chapterIcons = [FileText, Code2, Play, Layers, ClipboardCheck, Search, BookOpen];
const views = [{ id: "understand", label: "Understand", Icon: BookOpen }, { id: "watch", label: "Watch", Icon: Play }, { id: "try", label: "Try", Icon: Code2 }, { id: "check", label: "Check", Icon: CheckCircle2 }] as const;

export default function AiAgentsCourse({ onBack }: { onBack: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const slug = location.pathname.slice(COURSE_ROOT.length).replace(/^\/+|\/+$/g, "");
  const chapter = getAgentChapter(slug);
  const chapterIndex = chapter ? AGENT_CHAPTERS.indexOf(chapter) : -1;
  const params = new URLSearchParams(location.search);
  const lesson = chapter ? getAgentLesson(chapter, params.get("lesson") ?? undefined) : undefined;
  const view = AGENT_LESSON_VIEWS.find((item) => item === params.get("view")) ?? "understand";
  const [builderConfig, setBuilderConfig] = useState<AgentConfig>({
    scenarioId: "eligible-return", taskPreset: "return-draft", orderId: "L-1001", sku: "X200", policyTopic: "returns",
    enabledTools: ["lookup_order", "search_policies", "create_return_draft"],
    contextMode: "conversation", maxToolAttempts: 6, maxRetries: 1, fault: "none", reuseOperationKey: true, memoryMode: "retrieved",
  });
  const menu = useRef<HTMLDialogElement>(null);
  const chapterHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    menu.current?.close();
    chapterHeading.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  function changeLessonQuery(key: "view" | "lesson", value: string) {
    const next = new URLSearchParams(location.search);
    next.set(key, value);
    navigate({ pathname: location.pathname, search: next.toString() });
  }

  const chapterNavigation = (
    <>
      <Link className="course-rail-title" to={COURSE_ROOT} onClick={() => menu.current?.close()}>AI Agents & Tool Calling</Link>
      <p className="course-muted">{AGENT_CHAPTERS.length} chapters</p>
      <nav aria-label="AI Agents & Tool Calling chapters" className="course-chapters">
        {AGENT_CHAPTERS.map((item, index) => {
          const Icon = chapterIcons[index];
          return <Link key={item.id} to={`${COURSE_ROOT}/${item.slug}`} onClick={() => menu.current?.close()} aria-current={item.id === chapter?.id ? "page" : undefined}>
            <span className="course-chapter-number">{index + 1}</span><Icon size={19} aria-hidden="true" /><span>{item.title}</span>
          </Link>;
        })}
      </nav>
      <Link className="course-basics" to="/visualize/advancedRag" onClick={() => menu.current?.close()}><BookOpen size={19} />Advanced RAG</Link>
    </>
  );

  return <div className="advanced-course agent-course">
    <header className="course-topbar">
      <Button className="course-menu-toggle" variant="ghost" size="icon" aria-label="Open chapters" onClick={() => menu.current?.showModal()}><Menu /></Button>
      <Button variant="ghost" className="course-back" onClick={() => navigate("/visualizations#directory-machineLearning")}><ArrowLeft /><span>Machine Learning & AI</span></Button>
      <Link className="course-brand" to="/">CodeQuest<span>101</span></Link>
      <Link className="course-title-link" to={COURSE_ROOT}>AI Agents & Tool Calling</Link>
      <span className="course-badge">Chapter Studio</span>
    </header>
    <div className="course-body">
      <aside className="course-rail">{chapterNavigation}</aside>
      <dialog ref={menu} className="course-dialog" aria-label="Chapter navigation" onClick={(event) => { if (event.target === event.currentTarget) menu.current?.close(); }}>
        <Button variant="ghost" size="icon" className="course-dialog-close" aria-label="Close chapters" onClick={() => menu.current?.close()}><X /></Button>
        {chapterNavigation}
      </dialog>
      <main className="course-main">
        {chapter && lesson ? <Tabs value={view} onValueChange={(value) => changeLessonQuery("view", value as AgentLessonView)} className="course-chapter-content">
          <div className="course-chapter-header">
            <p className="course-eyebrow">Chapter {String(chapterIndex + 1).padStart(2, "0")} / {String(AGENT_CHAPTERS.length).padStart(2, "0")}</p>
            <h1 ref={chapterHeading} tabIndex={-1}>{chapter.headline}</h1>
            <p className="course-summary">{chapter.summary}</p>
            <div className="course-view-row">
                <TabsList aria-label="Lesson view" className="course-tabs">
                  {views.map(({ id, label, Icon }) => <TabsTrigger key={id} value={id}><Icon size={19} />{label}</TabsTrigger>)}
                </TabsList>
              {chapter.lessons.length > 1 && <label className="course-sublesson"><span className="sr-only">Lesson</span><select aria-label="Lesson" value={lesson.id} onChange={(event) => changeLessonQuery("lesson", event.target.value)}>{chapter.lessons.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>}
            </div>
          </div>
          <TabsContent value={view} className="course-active-panel">
            <Suspense fallback={<div className="course-loading" role="status">Loading the lesson…</div>}>
              <LessonWorkspace key={`${chapter.id}/${lesson.id}`} builderConfig={builderConfig} onBuilderConfigChange={setBuilderConfig} lesson={lesson} view={view} onViewChange={(next) => changeLessonQuery("view", next)} />
            </Suspense>
          </TabsContent>
          <footer className="course-footer">
            <Button variant="outline" asChild><Link to={chapterIndex > 0 ? `${COURSE_ROOT}/${AGENT_CHAPTERS[chapterIndex - 1].slug}` : COURSE_ROOT}><ArrowLeft /><span>{chapterIndex > 0 ? `Previous: ${AGENT_CHAPTERS[chapterIndex - 1].title}` : "Course overview"}</span></Link></Button>
            {chapterIndex < AGENT_CHAPTERS.length - 1 ? <Button asChild><Link to={`${COURSE_ROOT}/${AGENT_CHAPTERS[chapterIndex + 1].slug}`}><span>Next: {AGENT_CHAPTERS[chapterIndex + 1].title}</span><ArrowRight /></Link></Button> : <Button asChild><Link to={COURSE_ROOT}>Back to the course<CheckCircle2 /></Link></Button>}
          </footer>
        </Tabs> : <div className="course-overview">
          <p className="course-eyebrow">Chapter Studio</p>
          <h1 ref={chapterHeading} tabIndex={-1}>{slug ? "This chapter does not exist." : "AI Agents & Tool Calling"}</h1>
          <p className="course-overview-intro">Follow an agent as it looks up orders, reads policies, and prepares a return draft. Then connect tools and run your own configuration with Luma Shop sample data.</p>
          <div className="course-overview-actions"><Button asChild><Link to={`${COURSE_ROOT}/agent-basics`}>Start chapter 1<ArrowRight /></Link></Button><Button variant="outline" asChild><Link to={`${COURSE_ROOT}/builder-lab?view=try`}>Open Agent Builder<Play /></Link></Button></div>
          <div className="course-overview-grid">{AGENT_CHAPTERS.map((item, index) => {
            const Icon = chapterIcons[index];
            return <Link key={item.id} to={`${COURSE_ROOT}/${item.slug}`} className="course-overview-card"><span className="course-eyebrow">{String(index + 1).padStart(2, "0")} <Icon size={19} /></span><h2>{item.title}</h2><p>{item.summary}</p><span className="course-card-link">{item.lessons.length} {item.lessons.length > 1 ? "short lessons" : "focused lesson"}<ArrowRight size={16} /></span></Link>;
          })}</div>
          <p className="course-overview-note">Runs offline. Agent decisions are authored simulations. Tool calls execute against sample data.</p>
          <Button variant="link" onClick={onBack}>Return to visualizations</Button>
        </div>}
      </main>
    </div>
  </div>;
}
