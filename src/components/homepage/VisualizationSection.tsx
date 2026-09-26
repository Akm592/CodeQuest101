import React, { useState, useMemo } from 'react';
import { Input } from '../ui/input';
import { ArrowLeft, ArrowRight, Filter, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { allVisualizations, categories, visualizations } from './catalog';

interface VisualizationSectionProps {
  onSelectVisualization: (key: string) => void;
}

export const VisualizationSection: React.FC<VisualizationSectionProps> = ({ onSelectVisualization }) => {
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
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Interactive <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Playground</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Choose a domain to explore our extensive library of interactive visualizations.
          </p>

          <div className="max-w-md mx-auto relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                type="text"
                placeholder="Search algorithms or data structures..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border-white/10 pl-12 h-14 rounded-2xl focus:border-primary/50 focus:ring-primary/20 transition-all text-lg"
              />
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!selectedCategory && !isSearching ? (
            <motion.div
              key="categories"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {categories.map((category) => (
                <div
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`group relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br ${category.gradient} p-6 sm:p-8 cursor-pointer transition-all duration-300 hover:border-white/20 hover:shadow-2xl`}
                >
                  <div className="absolute inset-0 bg-background/40 backdrop-blur-3xl -z-10" />

                  <div className="mb-6 p-4 rounded-2xl bg-white/5 w-fit border border-white/10 group-hover:scale-110 transition-transform duration-300">
                    {category.icon}
                  </div>

                  <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-muted-foreground group-hover:text-foreground">
                    {category.description}
                  </p>

                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0">
                    <ArrowRight className="text-muted-foreground" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="visualizations"
              initial={{ opacity: 0, x: 20 }}
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
                  <div className="p-2 rounded-full bg-white/5 group-hover:bg-primary/20 transition-colors">
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
                    <motion.div
                      key={viz.key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => onSelectVisualization(viz.key)}
                      className="group flex flex-col justify-between bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-primary/5 p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.1)]"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 rounded-xl bg-background/60 text-primary ring-1 ring-white/10 group-hover:ring-primary/50 transition-all">
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

                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary mb-2">
                          {viz.title}
                        </h3>
                        <p className="text-sm text-muted-foreground group-hover:text-foreground line-clamp-2">
                          {viz.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
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