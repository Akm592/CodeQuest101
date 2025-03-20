import  { useState, useEffect } from 'react';
import { Code, MessageSquare,Github, ExternalLink, Coffee, Sparkles, BookOpen } from 'lucide-react';
import  Header from './Header';
import Footer from './Footer';
const AboutPage = () => {
  const [animateHeader, setAnimateHeader] = useState(false);
  
  useEffect(() => {
    setAnimateHeader(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden relative w-screen">
      {/* Abstract Background Elements */}
      < div className = "absolute inset-0 z-50" >
      <Header />
      </div>
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-400 rounded-full blur-3xl -translate-x-24 -translate-y-16"></div>
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl translate-x-24"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-sky-400 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 mt-10 py-16 relative z-10">
        {/* Header Section */}
        <div className={`text-center mb-16 transition-all duration-1000 ease-out transform ${animateHeader ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Code size={48} className="text-blue-600" />
              <Sparkles size={24} className="text-amber-500 absolute -top-2 -right-2" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-slate-800 mb-4">CodeQuest<span className="text-blue-600">101</span></h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">Transforming the way you understand programming concepts through interactive visualizations</p>
        </div>

        {/* Vision Section */}
        <section className="bg-white rounded-xl shadow-xl p-8 mb-12 transform transition hover:shadow-2xl duration-300">
          <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center">
            <BookOpen className="mr-3 text-blue-600" size={28} />
            Our Vision
          </h2>
          <p className="text-lg text-slate-700 mb-4">
            CodeQuest101 is an innovative learning hub designed to transform the way programming concepts are understood through visual aids. We believe that seeing is understanding, and our platform brings abstract coding concepts to life.
          </p>
          <p className="text-lg text-slate-700">
            Our mission is to make complex coding ideas accessible and interactive for everyone - from beginners taking their first steps into the world of programming to seasoned developers looking to solidify their understanding of fundamental concepts.
          </p>
        </section>

        {/* Features Section */}
        <section className="mb-12 grid md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-xl p-8 text-white transform transition hover:-translate-y-1 hover:shadow-2xl duration-300">
            <h3 className="text-2xl font-bold mb-4 flex items-center">
              <Code className="mr-3" size={24} />
              Interactive Visualizations
            </h3>
            <p className="text-white/90">
              See code come to life with our dynamic visualizations. Interact with visual representations of algorithms, data structures, and programming concepts that make learning intuitive and engaging. Watch as complex ideas transform into clear, understandable visual patterns.
            </p>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-xl p-8 text-white transform transition hover:-translate-y-1 hover:shadow-2xl duration-300">
            <h3 className="text-2xl font-bold mb-4 flex items-center">
              <MessageSquare className="mr-3" size={24} />
              Smart Chatbot Assistance
            </h3>
            <p className="text-white/90">
              Meet your coding companion! Our intelligent chatbot not only visualizes concepts but provides detailed explanations, dry runs, and step-by-step visualizations for LeetCode problems. Simply paste a LeetCode question link or number to get instant insights and solutions.
            </p>
          </div>
        </section>

        {/* Origin Section */}
        <section className="bg-white rounded-xl shadow-xl p-8 mb-12 transform transition hover:shadow-2xl duration-300">
  <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center">
    <Coffee className="mr-3 text-blue-600" size={28} />
    Our Story
  </h2>
  <div className="flex flex-col md:flex-row items-center">
    <div className="md:w-1/3 mb-6 md:mb-0 md:pr-8">
      <div className="w-48 h-48 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
        AM
      </div>
    </div>
    <div className="md:w-2/3">
      <h3 className="text-2xl font-bold text-slate-800 mb-2">Ashish Kumar Mishra</h3>
      <p className="text-slate-600 mb-1">Creator & Lead Developer</p>
      <p className="text-slate-600 mb-4">BTech, Information Technology</p>
      <p className="text-lg text-slate-700">
        CodeQuest101 was born from Ashish's passion for making programming more accessible. As a final-year BTech student, he recognized the challenges many face when learning abstract programming concepts. Driven by a desire to create tools that enhance learning and problem-solving, he developed CodeQuest101 as a platform where code becomes visual, interactive, and easier to comprehend.
      </p>
      <div className="mt-4">
        <a
          href="https://ashishmishra.site/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline mr-4"
        >
          Portfolio
        </a>
        <a
          href="https://www.linkedin.com/in/ashishkumarmishra952/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          LinkedIn
        </a>
      </div>
    </div>
  </div>
</section>


        {/* Open Source Section */}
        <section className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-xl shadow-xl p-8 mb-12 text-white transform transition hover:shadow-2xl duration-300">
          <h2 className="text-3xl font-bold mb-6 flex items-center">
            <Github className="mr-3" size={28} />
            Open Source & Community
          </h2>
          <p className="text-lg text-white/90 mb-6">
            CodeQuest101 thrives on community collaboration and contributions. As an open source project, we invite developers, educators, and enthusiasts to join us in enhancing the platform. Your insights, code contributions, and feedback are vital for our growth and evolution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-indigo-900 px-6 py-3 rounded-lg font-bold flex items-center justify-center transform transition hover:scale-105 duration-300"
              onClick={() => window.open('https://github.com/Akm592/CodeQuest101', '_blank')}>
              <Github className="mr-2" size={20} />
              Contribute on GitHub
            </button>
            {/* <button className="bg-indigo-700 text-white px-6 py-3 rounded-lg border border-indigo-500 font-bold flex items-center justify-center transform transition hover:scale-105 duration-300"
            onClick={() => window.open()}>
              <Users className="mr-2" size={20} />
              Join Our Community
            </button> */}
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-6">Begin Your CodeQuest Today</h2>
          <p className="text-lg text-slate-700 mb-8 max-w-3xl mx-auto">
            Ready to transform the way you understand and visualize code? Explore CodeQuest101's interactive features, solve problems with our smart assistant, and become part of our growing community of coding enthusiasts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold flex items-center justify-center transform transition hover:scale-105 duration-300"
            onClick = {() => window.open('https://codequest101.netlify.app/', '_blank')}>
              <ExternalLink className="mr-2" size={20} />
              Start Exploring
            </button>
            {/* <button className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-lg font-bold flex items-center justify-center transform transition hover:scale-105 duration-300">
              <Heart className="mr-2" size={20} />
              Support the Project
            </button> */}
          </div>
        </section>

       
    </div>
     {/* Footer */}
     <Footer />
      </div>
  );
};

export default AboutPage;