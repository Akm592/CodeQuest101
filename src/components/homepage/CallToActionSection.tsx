import React from 'react';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const CallToActionSection: React.FC = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background wash. A linear gradient across an inset-0 box is at full
          strength on the section's top edge, which reads as a band; a radial
          one is already transparent by the time it reaches any edge. */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(75%_75%_at_50%_55%,hsl(var(--primary)/0.14),transparent_70%)]" />

      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-10 lg:p-12 backdrop-blur-xl shadow-2xl"
        >
          <h2 className="mb-6 text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">
            Ready to Upgrade Your Skills?
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Step through algorithms and data structures one frame at a time, and ask the
            AI tutor when a step does not click. No account required to start—completely free.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-14 px-10 rounded-full shadow-lg shadow-primary/20 transition-all hover:scale-105"
              onClick={() => window.location.href = "/chat"}
            >
              Get Started Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};