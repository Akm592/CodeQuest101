import React from 'react';
import { Button } from '../ui/button'; // Adjust path

export const CallToActionSection: React.FC = () => {
  const navigateToChat = () => {
    window.location.href = "/chat"; // Or use React Router
  };

  return (
    <section className="bg-gradient-to-r from-teal-800 to-blue-900 text-white py-16 sm:py-20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          Ready to Start Your Coding Quest?
        </h2>
        <p className="text-lg sm:text-xl mb-8 text-gray-300 max-w-2xl mx-auto">
          Join CodeQuest101 today and transform the way you learn complex code concepts. It's free to get started!
        </p>
        <Button
          size="lg"
          className="bg-white text-teal-700 font-semibold hover:bg-gray-200 transition-colors duration-300 px-8 py-3 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-teal-800" // High contrast CTA
          onClick={navigateToChat}
          aria-label="Get Started for Free"
        >
          Get Started for Free
        </Button>
      </div>
    </section>
  );
};