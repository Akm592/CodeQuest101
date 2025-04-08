import { useState, useEffect } from 'react';
import { Code, MessageSquare, Github, ExternalLink, Coffee, Sparkles, BookOpen, Linkedin, Link } from 'lucide-react';
// Import the DARK THEMED Header and Footer
import Header from './Header'; // Assumes Header.tsx is the updated dark version
import Footer from './Footer'; // Assumes Footer.tsx is the updated dark version

const AboutPage = () => {
  const [animateHeader, setAnimateHeader] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    const timer = setTimeout(() => setAnimateHeader(true), 100);
    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, []);

  return (
    // Use dark base background for the page
    <div className="min-h-screen bg-gray-950 text-gray-300 overflow-x-hidden relative w-screen flex flex-col">
      {/* Header */}
      <Header /> {/* Renders the dark theme header */}

      {/* Main Content Area */}
      <main className="flex-grow relative z-10">
          {/* Abstract Background Elements - Adjusted for Dark Mode */}
          <div className="absolute inset-0 overflow-hidden opacity-10 z-0"> {/* Reduced opacity, check blend mode */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-900 rounded-full filter blur-3xl -translate-x-24 -translate-y-16 mix-blend-screen"></div>
            <div className="absolute top-1/3 right-0 w-96 h-96 bg-teal-900 rounded-full filter blur-3xl translate-x-24 mix-blend-screen"></div>
            <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-900 rounded-full filter blur-3xl mix-blend-screen"></div>
          </div>

        <div className="container mx-auto px-4 pt-16 pb-24 relative z-10"> {/* Add padding top below header */}

          {/* Page Header Section */}
          <div className={`text-center mb-16 transition-all duration-1000 ease-out transform ${animateHeader ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Code size={48} className="text-teal-400" /> {/* Accent color */}
                <Sparkles size={24} className="text-yellow-400 absolute -top-2 -right-2" /> {/* Keep sparkles bright */}
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-100 mb-4">
              CodeQuest<span className="text-teal-400">101</span> {/* Accent color */}
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Transforming the way you understand programming concepts through interactive visualizations
            </p>
          </div>

          {/* Vision Section */}
          <section className="bg-gray-900 rounded-xl shadow-lg ring-1 ring-gray-700/50 p-8 mb-12 transform transition hover:shadow-teal-900/30 duration-300 hover:-translate-y-1">
            <h2 className="text-3xl font-bold text-gray-100 mb-6 flex items-center">
              <BookOpen className="mr-3 text-teal-400" size={28} /> {/* Accent color */}
              Our Vision
            </h2>
            <p className="text-lg text-gray-300 mb-4 leading-relaxed">
              CodeQuest101 is an innovative learning hub designed to transform the way programming concepts are understood through visual aids. We believe that seeing is understanding, and our platform brings abstract coding concepts to life.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed">
              Our mission is to make complex coding ideas accessible and interactive for everyone - from beginners taking their first steps into the world of programming to seasoned developers looking to solidify their understanding of fundamental concepts.
            </p>
          </section>

          {/* Features Section */}
          <section className="mb-12 grid md:grid-cols-2 gap-8">
            {/* Interactive Visualizations Card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-lg ring-1 ring-teal-600/30 p-8 text-gray-200 transform transition hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-800/20 duration-300">
              <h3 className="text-2xl font-bold mb-4 flex items-center text-gray-100">
                <Code className="mr-3 text-teal-400" size={24} /> {/* Accent color */}
                Interactive Visualizations
              </h3>
              <p className="text-gray-300 leading-relaxed">
                See code come to life with our dynamic visualizations. Interact with visual representations of algorithms, data structures, and programming concepts that make learning intuitive and engaging. Watch as complex ideas transform into clear, understandable visual patterns.
              </p>
            </div>
            {/* Smart Chatbot Card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-lg ring-1 ring-blue-600/30 p-8 text-gray-200 transform transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-800/20 duration-300">
              <h3 className="text-2xl font-bold mb-4 flex items-center text-gray-100">
                <MessageSquare className="mr-3 text-blue-400" size={24} /> {/* Different accent for variety */}
                Smart Chatbot Assistance
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Meet your coding companion! Our intelligent chatbot not only visualizes concepts but provides detailed explanations, dry runs, and step-by-step visualizations for LeetCode problems. Simply paste a LeetCode question link or number to get instant insights and solutions.
              </p>
            </div>
          </section>

          {/* Origin Section */}
          <section className="bg-gray-900 rounded-xl shadow-lg ring-1 ring-gray-700/50 p-8 mb-12 transform transition hover:shadow-indigo-900/30 duration-300 hover:-translate-y-1">
            <h2 className="text-3xl font-bold text-gray-100 mb-8 flex items-center">
              <Coffee className="mr-3 text-amber-400" size={28} /> {/* Different accent */}
              Our Story
            </h2>
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div className="flex-shrink-0">
                {/* Placeholder image or initials circle */}
                <div className="w-40 h-40 md:w-48 md:h-48 mx-auto bg-gradient-to-br from-teal-600 to-indigo-700 rounded-full flex items-center justify-center text-white text-5xl font-bold ring-4 ring-gray-700 shadow-lg">
                  AM
                </div>
              </div>
              <div className="flex-grow text-center md:text-left">
                <h3 className="text-2xl font-semibold text-gray-100 mb-1">Ashish Kumar Mishra</h3>
                <p className="text-teal-400 mb-1">Creator & Lead Developer</p>
                <p className="text-gray-400 text-sm mb-4">BTech, Information Technology</p>
                <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                  CodeQuest101 was born from Ashish's passion for making programming more accessible. As a final-year BTech student, he recognized the challenges many face when learning abstract programming concepts. Driven by a desire to create tools that enhance learning and problem-solving, he developed CodeQuest101 as a platform where code becomes visual, interactive, and easier to comprehend.
                </p>
                <div className="flex gap-4 justify-center md:justify-start">
                  <a
                    href="https://ashishmishra.site/" // Replace with actual portfolio link
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-teal-400 hover:text-teal-300 hover:underline transition-colors"
                  >
                    <ExternalLink size={16} /> Portfolio
                  </a>
                  <a
                    href="https://www.linkedin.com/in/ashish-kumar-mishra-a286a2224/" // Replace with actual LinkedIn link
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-teal-400 hover:text-teal-300 hover:underline transition-colors"
                  >
                     <Linkedin size={16} /> LinkedIn
                  </a>
                   <a
                    href="https://github.com/Akm592" // Replace with actual GitHub link
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-teal-400 hover:text-teal-300 hover:underline transition-colors"
                  >
                    <Github size={16} /> GitHub
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Open Source Section */}
          <section className="bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-xl ring-1 ring-gray-700 p-8 mb-12 text-gray-200 transform transition hover:shadow-lg hover:shadow-gray-800/40 duration-300">
            <h2 className="text-3xl font-bold mb-6 flex items-center text-gray-100">
              <Github className="mr-3" size={28} />
              Open Source & Community
            </h2>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              CodeQuest101 thrives on community collaboration and contributions. As an open source project, we invite developers, educators, and enthusiasts to join us in enhancing the platform. Your insights, code contributions, and feedback are vital for our growth and evolution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                 className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transform transition hover:scale-105 duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-950"
                 onClick={() => window.open('https://github.com/Akm592/CodeQuest101', '_blank')}
                 aria-label="Contribute on GitHub"
               >
                <Github size={20} />
                Contribute on GitHub
              </button>
              {/* Add other community links/buttons here if needed */}
            </div>
          </section>

          {/* Call to Action */}
          <section className="text-center mt-16">
            <h2 className="text-3xl font-bold text-gray-100 mb-6">Begin Your CodeQuest Today</h2>
            <p className="text-lg text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              Ready to transform the way you understand and visualize code? Explore CodeQuest101's interactive features, solve problems with our smart assistant, and become part of our growing community of coding enthusiasts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* Changed link to internal navigation for consistency, assuming '/' is the main viz page */}
              <Link to="/" className="inline-block">
                  <button className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transform transition hover:scale-105 duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-950">
                    <Sparkles size={20} /> {/* Changed icon */}
                    Start Exploring
                  </button>
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer /> {/* Renders the dark theme footer */}
    </div>
  );
};

export default AboutPage;