import React from 'react';
import { Button } from '../ui/button'; // Adjust path
import { MessageCircle } from 'lucide-react';

export const AiTutorSection: React.FC = () => {
  const codeExample = `class Node:
    def __init__(self, value):
        self.value = value
        self.left = self.right = None

class BinarySearchTree:
    def __init__(self):
        self.root = None

    def insert(self, value):
        def _insert(node, value):
            if not node:
                return Node(value)
            if value < node.value:
                node.left = _insert(node.left, value)
            else:
                node.right = _insert(node.right, value)
            return node

        self.root = _insert(self.root, value)

`; // Keep it concise for display

  const navigateToChat = () => {
    window.location.href = "/chat"; // Or use React Router's navigation
  };

  return (
    <section className="py-16 sm:py-24 bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-12 lg:gap-16">
        <div className="lg:w-1/2 text-center lg:text-left">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-5">
            Your AI Coding Tutor is Here
          </h2>
          <p className="text-base sm:text-lg text-gray-400 mb-8 leading-relaxed">
            Stuck on a coding problem? Our intelligent AI tutor provides
            instant explanations, code examples, and personalized guidance
            to help you learn faster and overcome challenges.
          </p>
          <Button
            variant="outline" // Assuming 'outline' variant is styled for dark mode
            size="lg"
            className="flex items-center gap-2 border-teal-500 text-teal-400 hover:bg-teal-900/30 hover:text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-900 mx-auto lg:mx-0" // Adjusted styling
            onClick={navigateToChat}
            aria-label="Try the AI Chatbot"
          >
            Try the AI Chatbot <MessageCircle className="h-5 w-5" />
          </Button>
        </div>
        <div className="lg:w-1/2 w-full max-w-2xl">
          {/* Terminal Window Mockup */}
          <div className="bg-gray-950 rounded-lg p-4 shadow-xl border border-gray-700">
            {/* Window Controls */}
            <div className="flex items-center mb-4 space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            {/* Chat Content */}
            <div className="space-y-4">
              <div className="bg-gray-800 rounded p-3 shadow-inner">
                <p className="text-gray-300 text-sm sm:text-base">
                  How do I implement a binary search tree in Python?
                </p>
              </div>
              <div className="bg-gradient-to-r from-blue-900/30 to-teal-900/30 rounded p-3 shadow-inner border border-teal-800/50">
                <p className="text-gray-300 text-sm sm:text-base mb-2">
                  Sure! Here's a basic structure:
                </p>
                <pre className="bg-black text-green-400 p-3 rounded mt-2 text-xs sm:text-sm overflow-x-auto font-mono ring-1 ring-gray-700">
                  {codeExample}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};