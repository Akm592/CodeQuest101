import React from 'react';
import { ArrowRight, Code, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import { catalogStats } from './catalog';

// No glow blobs and no gradient text: the page's ambient light (index.css)
// sits behind everything, and the hierarchy comes from weight and tone. The
// second headline line is the same white at lower opacity.

export const HeroSection: React.FC = () => {
  return (
    <section className="relative flex min-h-[85vh] items-center justify-center pt-24 sm:pt-28">
      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-5xl text-center">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass-pill mb-8 inline-flex items-center gap-2 px-4 py-1.5 text-sm text-muted-foreground"
          >
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            Watch algorithms run. Ask the tutor.
          </motion.div>

          <motion.h1
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-6 text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            Interactive algorithm
            <br />
            <span className="text-foreground/55">and data structure visualizer.</span>
          </motion.h1>

          <motion.p
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            Learn sorting, searching, data structures, coding interview patterns and machine learning with free, step-by-step visualizations. Ask the AI tutor when a step doesn't click.
          </motion.p>

          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              to="/chat"
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.35),0_8px_24px_-8px_hsl(var(--primary)/0.6)] transition-colors hover:bg-primary/90 sm:w-auto"
            >
              Start learning
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/#visualizations"
              className="glass-pill glass-hover inline-flex h-12 w-full items-center justify-center gap-2 px-7 text-sm font-semibold text-foreground sm:w-auto"
            >
              <Code className="h-4 w-4" />
              Explore the library
            </Link>
          </motion.div>

          {/* Counted from the catalogue below, not asserted. See ./catalog.tsx. */}
          <motion.dl
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="glass mx-auto mt-16 grid max-w-4xl grid-cols-2 divide-white/10 rounded-3xl sm:grid-cols-3 md:grid-cols-5 md:divide-x"
          >
            {catalogStats.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse items-center px-4 py-5">
                <dt className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">{stat.label}</dt>
                <dd className="text-3xl font-semibold tracking-tight text-foreground">{stat.value}</dd>
              </div>
            ))}
          </motion.dl>
        </div>
      </div>
    </section>
  );
};
