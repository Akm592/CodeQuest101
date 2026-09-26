import React from 'react';
import { ArrowRight, Code, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { motion } from 'framer-motion';

import { catalogStats } from './catalog';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative flex min-h-[85vh] items-center justify-center pt-20">
      {/* The glow reaches past the bottom of the section (-bottom-40) so it
          fades out instead of being sliced at the boundary — that slice was a
          large part of the seam under the hero. It stays at inset-x-0
          horizontally: overflow-hidden clips this layer's children, not its
          own box, so a negative inset-x here widens document.scrollWidth. */}
      <div className="pointer-events-none absolute inset-x-0 -bottom-40 top-0 z-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-[600px] w-[600px] animate-pulse rounded-full bg-primary/20 blur-[120px]" />
        <div className="delay-1000 absolute bottom-1/4 right-1/4 h-[600px] w-[600px] animate-pulse rounded-full bg-secondary/20 blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 z-10 relative">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-primary mb-8 backdrop-blur-md shadow-[0_0_20px_hsl(var(--primary)/0.1)]"
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">The Future of Coding Education</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8 text-4xl font-black leading-tight tracking-tighter sm:text-6xl lg:text-8xl"
          >
            Visualize Code, <br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent drop-shadow-[0_0_30px_hsl(var(--primary)/0.3)]">
              Master Concepts
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed font-medium"
          >
            CodeQuest101 transforms abstract algorithms into immersive, high-fidelity visualizations.
            Accelerate your learning path with our interactive playground.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Button
              size="lg"
              className="w-full sm:w-auto bg-primary hover:bg-primary/80 text-primary-foreground font-bold h-14 px-10 rounded-2xl shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.5)] transition-all duration-500 group"
              onClick={() => window.location.href = '/chat'}
            >
              Start Learning Now
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-14 px-10 rounded-2xl border-white/10 hover:bg-white/5 hover:border-primary/50 text-foreground transition-all duration-300 backdrop-blur-sm"
              onClick={() => document.getElementById('visualizations')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Code className="w-5 h-5 mr-2" />
              Explore Library
            </Button>
          </motion.div>

          {/* Stats / Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-20 pt-10 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {/* Counted from the catalogue below, not asserted. See ./catalog.tsx. */}
            {catalogStats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                <span className="mb-1 text-3xl font-bold text-foreground">{stat.value}</span>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground sm:text-sm">
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};