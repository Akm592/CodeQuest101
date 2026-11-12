import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../ui/input';
import { ArrowLeft, ArrowRight, Filter, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { allVisualizations, categories, visualizations } from './catalog';

const MotionLink = motion.create(Link);

export const VisualizationSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVisualizations = useMemo(() => {
    if (searchQuery) {
      return allVisualizations.filter(v => 
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return selectedCategory ? visualizations[selectedCategory as keyof typeof visualizations] : [];
  }, [searchQuery, selectedCategory]);

  const isSearching = searchQuery.length > 0;

  return (
    <section id="visualizations" className="relative py-24 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
            Interactive playground
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Choose a domain to explore our extensive library of interactive visualizations.
          </p>
          <Link to="/visualizations" className="mb-6 inline-flex min-h-11 items-center gap-2 text-primary underline underline-offset-4">
            Browse all algorithm, data structure and ML visualizers <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>

          <div className="max-w-md mx-auto relative group">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                type="text"
                placeholder="Search algorithms or data structures..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-pill h-14 w-full rounded-full border-white/10 pl-12 text-base focus:border-primary/50 focus:ring-2 focus:ring-primary/25 sm:text-lg"
              />
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!selectedCategory && !isSearching ? (
            <motion.div
              key="categories"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4"
            >
              {categories.map((category) => (
                <button
                  type="button"
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className="glass glass-hover group relative rounded-3xl p-6 text-left hover:-translate-y-0.5 sm:p-8"
                >
                  <div className="mb-6 w-fit rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.12)]">
                    {category.icon}
                  </div>

                  <h3 className="mb-2 text-2xl font-semibold tracking-tight">
                    {category.title}
                  </h3>
                  <p className="text-muted-foreground group-hover:text-foreground">
                    {category.description}
                  </p>

                  <div className="absolute bottom-6 right-6 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="visualizations"
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchQuery("");
                  }}
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground group"
                >
                  <div className="glass-pill p-2">
                    <ArrowLeft className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{isSearching ? "Clear Search" : "Back to Categories"}</span>
                </button>
                
                {isSearching && (
                  <div className="text-sm text-muted-foreground">
                    Found {filteredVisualizations.length} results for "{searchQuery}"
                  </div>
                )}
              </div>

              {filteredVisualizations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredVisualizations.map((viz, idx) => (
                    <MotionLink
                      key={viz.key}
                      initial={false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      to={`/visualize/${viz.key}`}
                      className="glass glass-hover group flex cursor-pointer flex-col justify-between rounded-2xl p-6 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3 text-primary">
                            {React.cloneElement(viz.icon as React.ReactElement, { className: 'w-5 h-5' })}
                          </div>
                          <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                            viz.level === "Easy" ? "bg-viz-found/10 text-viz-found" :
                            viz.level === "Medium" ? "bg-viz-compare/10 text-viz-compare" :
                            "bg-destructive/10 text-destructive"
                          }`}>
                            {viz.level}
                          </div>
                        </div>

                        <h3 className="mb-2 text-lg font-semibold text-foreground">
                          {viz.title}
                        </h3>
                        <p className="text-sm text-muted-foreground group-hover:text-foreground line-clamp-2">
                          {viz.description}
                        </p>
                      </div>
                    </MotionLink>
                  ))}
                </div>
              ) : (
                <div className="glass rounded-3xl py-20 text-center">
                   <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                   <h3 className="text-xl font-bold text-muted-foreground">No visualizations found</h3>
                   <p className="text-muted-foreground">Try searching for something else or browse categories.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
