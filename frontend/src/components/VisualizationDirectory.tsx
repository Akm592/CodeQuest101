import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { categories, visualizations } from "./homepage/catalog";

export default function VisualizationDirectory() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="container mx-auto flex-1 space-y-12 px-4 pb-16 pt-28">
        <div className="max-w-3xl space-y-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Algorithm, data structure and ML visualizers</h1>
          <p className="text-lg text-muted-foreground">Choose a topic, explore its explanation and watch the steps unfold. These interactive learning tools are free to use.</p>
        </div>
        {categories.map((category) => (
          <section key={category.key} aria-labelledby={`directory-${category.key}`} className="space-y-5">
            <h2 id={`directory-${category.key}`} className="text-2xl font-semibold">{category.title}</h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visualizations[category.key].map((viz) => (
                <li key={viz.key}>
                  <Link to={`/visualize/${viz.key}`} className="glass glass-hover block h-full rounded-2xl p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                    <h3 className="mb-2 text-lg font-semibold">{viz.seoTitle ?? `${viz.title} Visualizer`}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{viz.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
      <Footer />
    </div>
  );
}
