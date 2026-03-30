import React from 'react';
import { ArrowRight, Code, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { motion } from 'framer-motion';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" />
      </div>

      <div className="container mx-auto px-4 z-10 relative">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-teal-400 mb-8 backdrop-blur-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">The Future of Coding Education</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-5xl sm:text-7xl font-bold tracking-tight mb-8"
          >
            Visualize Code, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-blue-400 to-purple-400 text-glow">
              Master Concepts
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            CodeQuest101 transforms abstract algorithms into immersive visualizations.
            Watch your code come to life in real-time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              className="w-full sm:w-auto bg-teal-500 hover:bg-teal-400 text-black font-semibold h-12 px-8 rounded-full shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_30px_rgba(45,212,191,0.5)] transition-all duration-300 group"
              onClick={() => window.location.href = '/chat'}
            >
              Start Learning Now
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="w-full sm:w-auto h-12 px-8 rounded-full border border-white/10 hover:bg-white/5 hover:text-white transition-all duration-300"
              onClick={() => document.getElementById('visualizations')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Code className="w-4 h-4 mr-2" />
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
            {[
              { label: "Algorithms", value: "20+" },
              { label: "Data Structures", value: "15+" },
              { label: "Active Users", value: "10k+" },
              { label: "Visualizations", value: "50+" },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-3xl font-bold text-white mb-1">{stat.value}</span>
                <span className="text-sm text-gray-500 font-medium uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};