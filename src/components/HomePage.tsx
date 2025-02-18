// HomePage.tsx
import React, { useState } from "react";
import { Button } from "./ui/button";
import {
  Code2,
  GitBranch,
  Grid,
  SortDesc,
  Search,
  RotateCw,
  Github,
  Linkedin,
  Mail,
  Brain,
  Database,
  AlignJustify,
  ExternalLink,
  MessageCircle,

  ArrowRight,
} from "lucide-react";

interface Contributor {
  name: string;
  role: string;
  image: string;
  github?: string;
  linkedin?: string;
  email?: string;
}

const categories = [
  {
    title: "Algorithms",
    description: "Explore various algorithmic visualizations",
    icon: <AlignJustify className="h-12 w-12 text-blue-600" />,
    key: "algorithms",
  },
  {
    title: "Data Structures",
    description: "Visualize common data structures",
    icon: <Database className="h-12 w-12 text-blue-600" />,
    key: "dataStructures",
  },
  {
    title: "Machine Learning",
    description: "Dive into machine learning concepts",
    icon: <Brain className="h-12 w-12 text-blue-600" />,
    key: "machineLearning",
  },
];

const visualizations = {
  algorithms: [
    {
      title: "Longest Subarray Sum K",
      description: "Find the longest subarray with sum K",
      icon: <Code2 className="h-6 w-6 text-blue-600" />,
      key: "longestSubarray",
    },
    {
      title: "Spiral Matrix",
      description: "Animate spiral traversal of a matrix",
      icon: <Grid className="h-6 w-6 text-blue-600" />,
      key: "spiralMatrix",
    },
    {
      title: "Rotate Image",
      description: "Rotate a square matrix in-place",
      icon: <RotateCw className="h-6 w-6 text-blue-600" />,
      key: "rotateImage",
    },
    {
      title: "Sorting Algorithms",
      description: "Visualize popular sorting algorithms",
      icon: <SortDesc className="h-6 w-6 text-blue-600" />,
      key: "sortingAlgorithms",
    },
    {
      title: "Binary Search",
      description: "Visualize the binary search algorithm",
      icon: <Search className="h-6 w-6 text-blue-600" />,
      key: "binarySearch",
    },
    {
      title: "Hare-Tortoise",
      description: "Visualize Hare-Tortoise algorithm",
      icon: <GitBranch className="h-6 w-6 text-blue-600" />,
      key: "hareTortoise",
    },
  ],
  dataStructures: [
    {
      title: "Binary Tree Traversal",
      description: "Visualize tree traversal algorithms",
      icon: <GitBranch className="h-6 w-6 text-blue-600" />,
      key: "binaryTree",
    },
    {
      title: "Linked List",
      description: "Visualize linked list operations",
      icon: <GitBranch className="h-6 w-6 text-blue-600" />,
      key: "linkedList",
    },
    {
      title: "Stack and Queue",
      description: "Visualize stack and queue operations",
      icon: <GitBranch className="h-6 w-6 text-blue-600" />,
      key: "stack",
    },
    {
      title: "Tree Data Structure",
      description: "Visualize tree data structure",
      icon: <GitBranch className="h-6 w-6 text-blue-600" />,
      key: "tree",
    },
    {
      title: "Graph Data Structure",
      description: "Visualize graph data structure",
      icon: <GitBranch className="h-6 w-6 text-blue-600" />,
      key: "graph",
    },
  ],
  machineLearning: [
    {
      title: "Neural Network",
      description: "Visualize Neural Network",
      icon: <Brain className="h-6 w-6 text-blue-600" />,
      key: "neuralNetwork",
    },
  ],
};

const contributors: Contributor[] = [
  {
    name: "Ashish Mishra",
    role: "FullStack Developer",
    image: "/path/to/john-doe-image.jpg",
    github: "https://github.com/Akm592",
    linkedin: "https://www.linkedin.com/in/ashish-kumar-mishra-a286a2224/",
    email: "ashishkumarmishra952@gmail.com",
  },
  {
    name: "Puneet Prashar",
    role: "Software Developer",
    image: "/path/to/jane-smith-image.jpg",
    github: "https://github.com/puneetprashar2003",
    email: "",
  },
  // Add more contributors as needed
];

interface HomePageProps {
  onSelectVisualization: (key: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onSelectVisualization }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col w-screen">
      {/* HEADER */}
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-4 py-4 flex flex-wrap justify-between items-center">
          <a href="#" className="text-2xl font-bold text-blue-600">
            CodeQuest101
          </a>
          <div className="space-x-4">
            <a href="#" className="text-gray-600 hover:text-blue-600">
              Visualizations
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600">
              AI Chatbot
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600">
              About
            </a>
            <Button variant="outline">Sign Up</Button>
          </div>
        </nav>
      </header>

      <main className="flex-grow">
        {/* HERO SECTION */}
        <section className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 flex items-center">
          <div className="container mx-auto px-6 py-24">
            <div className="max-w-5xl mx-auto text-center space-y-8">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 mb-6 leading-tight">
                Visualize Code,
                <br />
                Master Concepts
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                CodeQuest101 makes learning to code easier and more engaging
                through dynamic animations and interactive visualizations.
              </p>

              <div className="flex justify-center gap-4 pt-8">
                <button className="group flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 hover:bg-gray-800 hover:gap-3">
                  Get Started for Free
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              {/* Abstract decorative elements */}
              <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
              <div className="absolute top-20 right-10 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />
              <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000" />
            </div>
          </div>
        </section>

        {/* AI CODING TUTOR SECTION */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 mb-10 lg:mb-0">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Your AI Coding Tutor is Here
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Stuck on a coding problem? Our intelligent AI tutor provides
                instant explanations, code examples, and personalized guidance
                to help you learn faster and overcome challenges.
              </p>
              <Button
                variant="outline"
                size="lg"
                className="flex items-center"
                onClick={() => onSelectVisualization("chatbot")}
              >
                Try the AI Chatbot <MessageCircle className="ml-2" />
              </Button>
            </div>
            <div className="lg:w-1/2 lg:pl-10">
              <div className="bg-gray-100 rounded-lg p-6 shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white rounded p-3 shadow">
                    <p className="text-gray-800">
                      How do I implement a binary search tree in Python?
                    </p>
                  </div>
                  <div className="bg-blue-100 rounded p-3 shadow">
                    <p className="text-gray-800">
                      Here's an example of a binary search tree implementation
                      in Python:
                    </p>
                    <pre className="bg-gray-800 text-green-400 p-2 rounded mt-2 text-sm overflow-x-auto">
                      {`class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None

class BinarySearchTree:
    def __init__(self):
        self.root = None

    def insert(self, value):
        if not self.root:
            self.root = Node(value)
        else:
            self._insert_recursive(self.root, value)

    def _insert_recursive(self, node, value):
        if value < node.value:
            if node.left is None:
                node.left = Node(value)
            else:
                self._insert_recursive(node.left, value)
        else:
            if node.right is None:
                node.right = Node(value)
            else:
                self._insert_recursive(node.right, value)`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* VISUALIZATION SECTION */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Visualize Code in Action
            </h2>
            {!selectedCategory ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {categories.map((category) => (
                  <div
                    key={category.key}
                    className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300"
                    onClick={() => setSelectedCategory(category.key)}
                  >
                    <div className="mb-4">
                      <div className="p-4 rounded-full bg-blue-50 inline-block">
                        {category.icon}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">
                      {category.title}
                    </h3>
                    <p className="text-gray-600">{category.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="mb-6 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-md transition-colors duration-200"
                >
                  Back to Categories
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {visualizations[
                    selectedCategory as keyof typeof visualizations
                  ].map((viz) => (
                    <div
                      key={viz.key}
                      className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="mb-4">
                        <div className="p-2 rounded-full bg-blue-50 inline-block">
                          {viz.icon}
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-900">
                        {viz.title}
                      </h3>
                      <p className="text-gray-600 mb-4">{viz.description}</p>
                      <Button
                        onClick={() => onSelectVisualization(viz.key)}
                        className="w-full bg-black hover:bg-black-800 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        Explore <Code2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              About CodeQuest
            </h2>
            <p className="text-lg text-center text-gray-600 max-w-3xl mx-auto">
              CodeQuest is an innovative platform designed to help developers
              master complex algorithms and data structures through interactive
              visualizations. Our mission is to make learning engaging,
              intuitive, and accessible to coders of all levels.
            </p>
          </div>
        </section>

        {/* CONTRIBUTORS SECTION */}
        {/* <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Our Contributors
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {contributors.map((contributor, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center transition-all duration-300 hover:shadow-xl"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {contributor.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {contributor.role}
                  </p>
                  <div className="flex space-x-4">
                    {contributor.github && (
                      <a
                        href={contributor.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 transition-colors duration-200"
                      >
                        <Github className="w-5 h-5" />
                      </a>
                    )}
                    {contributor.linkedin && (
                      <a
                        href={contributor.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 transition-colors duration-200"
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {contributor.email && (
                      <a
                        href={`mailto:${contributor.email}`}
                        className="hover:text-blue-600 transition-colors duration-200"
                      >
                        <Mail className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section> */}

        {/* CALL TO ACTION SECTION */}
        <section className="bg-blue-600 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Start Your Coding Journey?
            </h2>
            <p className="text-xl mb-8">
              Join CodeQuest101 today and transform the way you learn to code.
            </p>
            <Button
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Get Started for Free
            </Button>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p>&copy; 2025 CodeQuest101. All rights reserved.</p>
            </div>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-blue-400">
                Terms of Service
              </a>
              <a href="#" className="hover:text-blue-400">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-blue-400">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
