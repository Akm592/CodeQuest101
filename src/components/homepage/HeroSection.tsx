import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/button'; // Adjust path if needed

export const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 flex items-center overflow-hidden text-gray-200">
      <div className="container mx-auto px-6 py-24 sm:py-32 md:py-48 lg:py-64 z-10"> {/* Added z-10 */}
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-cyan-400 mb-6 leading-tight">
            Visualize Code,
            <br />
            Master Concepts
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            CodeQuest101 makes learning to code easier and more engaging
            through dynamic animations and interactive visualizations.
          </p>

          <div className="flex justify-center gap-4 pt-8">
            {/* Use Button component if it supports styling, otherwise use button tag */}
            <Button
              size="lg"
              className="group flex items-center gap-2 bg-teal-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 hover:bg-teal-700 hover:gap-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label="Get Started for Free"
            >
              Get Started for Free
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Abstract decorative elements - Dark Theme Adjusted */}
      <div className="absolute top-1/4 left-10 w-60 h-60 sm:w-72 sm:h-72 bg-blue-900 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob z-0" />
      <div className="absolute top-1/4 right-10 w-60 h-60 sm:w-72 sm:h-72 bg-teal-900 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000 z-0" />
      <div className="absolute bottom-10 left-20 w-60 h-60 sm:w-72 sm:h-72 bg-indigo-900 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000 z-0" />
    </section>
  );
};