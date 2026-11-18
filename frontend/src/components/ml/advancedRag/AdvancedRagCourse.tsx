import { lazy, Suspense, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowDownUp, ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, Code2, FileText, GitFork, Layers, Menu, Network, Play, Search, X } from "lucide-react";
import { ADVANCED_CHAPTERS, getChapter, getLesson, type LessonView } from "../../../lib/advancedRag/curriculum";
import { Button } from "../../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { COURSE_ROOT, readLessonView } from "./courseState";
import "./course.css";

const LessonWorkspace = lazy(() => import("./LessonWorkspace"));
const chapterIcons = [FileText, Layers, GitFork, ArrowDownUp, Search, Network, ClipboardCheck, Play];
const views = [{ id: "understand", label: "Understand", Icon: BookOpen }, { id: "watch", label: "Watch", Icon: Play }, { id: "try", label: "Try", Icon: Code2 }, { id: "check", label: "Check", Icon: CheckCircle2 }] as const;

export default function AdvancedRagCourse({ onBack }: { onBack: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const slug = location.pathname.slice(COURSE_ROOT.length).replace(/^\/+|\/+$/g, "");
  const chapter = getChapter(slug);
  const chapterIndex = chapter ? ADVANCED_CHAPTERS.indexOf(chapter) : -1;
  const params = new URLSearchParams(location.search);
  const lesson = chapter ? getLesson(chapter, params.get("lesson") ?? undefined) : undefined;
  const view = readLessonView(location.search);
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
      <Link className="course-rail-title" to={COURSE_ROOT} onClick={() => menu.current?.close()}>Advanced RAG</Link>
      <p className="course-muted">8 chapters · Learn by building</p>
      <nav aria-label="Advanced RAG chapters" className="course-chapters">
        {ADVANCED_CHAPTERS.map((item, index) => {
          const Icon = chapterIcons[index];
          return <Link key={item.id} to={`${COURSE_ROOT}/${item.slug}`} onClick={() => menu.current?.close()} aria-current={item.id === chapter?.id ? "page" : undefined}>
            <span className="course-chapter-number">{index + 1}</span><Icon size={19} aria-hidden="true" /><span>{item.title}</span>
          </Link>;
        })}
      </nav>
      <Link className="course-basics" to="/visualize/rag" onClick={() => menu.current?.close()}><BookOpen size={19} />RAG basics</Link>
    </>
  );

  return <div className="advanced-course">
    <header className="course-topbar">
      <Button className="course-menu-toggle" variant="ghost" size="icon" aria-label="Open chapters" onClick={() => menu.current?.showModal()}><Menu /></Button>
      <Button variant="ghost" className="course-back" onClick={() => navigate("/visualizations#directory-machineLearning")}><ArrowLeft /><span>Machine Learning & AI</span></Button>
      <Link className="course-brand" to="/">CodeQuest<span>101</span></Link>
      <Link className="course-title-link" to={COURSE_ROOT}>Advanced RAG</Link>
      <span className="course-badge">Chapter Studio</span>
    </header>
    <div className="course-body">
      <aside className="course-rail">{chapterNavigation}</aside>
      <dialog ref={menu} className="course-dialog" aria-label="Chapter navigation" onClick={(event) => { if (event.target === event.currentTarget) menu.current?.close(); }}>
        <Button variant="ghost" size="icon" className="course-dialog-close" aria-label="Close chapters" onClick={() => menu.current?.close()}><X /></Button>
        {chapterNavigation}
      </dialog>
      <main className="course-main">
        {chapter && lesson ? <Tabs value={view} onValueChange={(value) => changeLessonQuery("view", value as LessonView)} className="course-chapter-content">
          <div className="course-chapter-header">
            <p className="course-eyebrow">Chapter {String(chapterIndex + 1).padStart(2, "0")} / 08</p>
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
          <Suspense fallback={<div className="course-loading" role="status">Loading the recorded experiment…</div>}>
            <LessonWorkspace key={`${chapter.id}/${lesson.id}`} chapter={chapter} lesson={lesson} view={view} onViewChange={(next) => changeLessonQuery("view", next)} />
          </Suspense>
          </TabsContent>
          <footer className="course-footer">
            <Button variant="outline" asChild><Link to={chapterIndex > 0 ? `${COURSE_ROOT}/${ADVANCED_CHAPTERS[chapterIndex - 1].slug}` : COURSE_ROOT}><ArrowLeft /><span>{chapterIndex > 0 ? `Previous: ${ADVANCED_CHAPTERS[chapterIndex - 1].title}` : "Course overview"}</span></Link></Button>
            {chapterIndex < ADVANCED_CHAPTERS.length - 1 ? <Button asChild><Link to={`${COURSE_ROOT}/${ADVANCED_CHAPTERS[chapterIndex + 1].slug}`}><span>Next: {ADVANCED_CHAPTERS[chapterIndex + 1].title}</span><ArrowRight /></Link></Button> : <Button asChild><Link to={COURSE_ROOT}>Back to the course<CheckCircle2 /></Link></Button>}
          </footer>
        </Tabs> : <div className="course-overview">
          <p className="course-eyebrow">Beyond the basic pipeline</p>
          <h1 ref={chapterHeading} tabIndex={-1}>{slug ? "This chapter does not exist." : "Better retrieval. Clearer decisions."}</h1>
          <p className="course-overview-intro">Build an advanced RAG pipeline one decision at a time. Short explanations, moving data, and real retrieval results—all in the same Luma Shop example.</p>
          <div className="course-overview-actions"><Button asChild><Link to={`${COURSE_ROOT}/prepare-text`}>Start chapter 1<ArrowRight /></Link></Button><Button variant="outline" asChild><Link to={`${COURSE_ROOT}/hybrid-search?view=watch`}>Preview hybrid search<Play /></Link></Button></div>
          <div className="course-overview-grid">{ADVANCED_CHAPTERS.map((item, index) => {
            const Icon = chapterIcons[index];
            return <Link key={item.id} to={`${COURSE_ROOT}/${item.slug}`} className="course-overview-card"><span className="course-eyebrow">{String(index + 1).padStart(2, "0")} <Icon size={19} /></span><h2>{item.title}</h2><p>{item.summary}</p><span className="course-card-link">{item.lessons.length} {item.lessons.length > 1 ? "short lessons" : "focused lesson"}<ArrowRight size={16} /></span></Link>;
          })}</div>
          <p className="course-overview-note">Runs offline with recorded MiniLM embeddings and cross-encoder scores. Search, fusion, graph traversal, and context packing run here. Answers are labeled teaching simulations.</p>
          <Button variant="link" onClick={onBack}>Return to visualizations</Button>
        </div>}
      </main>
    </div>
  </div>;
}
