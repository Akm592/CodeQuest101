import React from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const CallToActionSection: React.FC = () => {
  return (
    <section className="py-24 relative overflow-hidden">

      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass mx-auto max-w-4xl rounded-[2rem] p-6 sm:p-10 lg:p-14"
        >
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Ready when you are.
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Step through algorithms and data structures one frame at a time, and ask the
            AI tutor when a step does not click. No account required to start—completely free.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="/chat"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.35),0_8px_24px_-8px_hsl(var(--primary)/0.6)] transition-colors hover:bg-primary/90"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};