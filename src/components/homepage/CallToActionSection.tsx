import React from 'react';
import { Button } from '../ui/button';
import { ArrowRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export const CallToActionSection: React.FC = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-900/40 to-black z-0" />

      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-12 backdrop-blur-xl shadow-2xl"
        >
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            ))}
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Upgrade Your Skills?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join thousands of students and developers mastering algorithms with CodeQuest101.
            Start your journey today—completely free.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              size="lg"
              className="bg-teal-500 hover:bg-teal-400 text-black font-bold h-14 px-10 rounded-full shadow-lg shadow-teal-500/20 transition-all hover:scale-105"
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