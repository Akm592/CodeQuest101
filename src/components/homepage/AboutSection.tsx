import React from 'react';
import { Github, Linkedin, Mail } from 'lucide-react'; // Assuming you might want these later

// Example data for creator (replace with actual details)
const creator = {
  name: "Ashish Kumar Mishra",
  title: "Founder & Developer",
  bio: "Passionate Full Stack Developer with a vision to simplify complex coding concepts through interactive learning tools. Believes in the power of visualization for effective education.",
  image: "/profile.png", // Replace with actual image path or URL
  github: "https://github.com/Akm592",
  linkedin: "https://www.linkedin.com/in/ashish-kumar-mishra-a286a2224/",
  email: "ashishkumarmishra952@gmail.com",
};

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-16 sm:py-24 bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-6">
            Our Vision & Story
          </h2>
          <p className="text-base sm:text-lg text-gray-400 mb-12 leading-relaxed">
            CodeQuest101 transforms abstract coding concepts into tangible experiences. We aim to make learning algorithms and data structures intuitive and engaging for everyone, from beginners to seasoned developers, through dynamic visualizations and an intelligent AI companion.
          </p>

          {/* Creator Spotlight */}
          <div className="bg-gray-800 rounded-lg p-8 shadow-xl ring-1 ring-gray-700 flex flex-col md:flex-row items-center gap-8 text-left">
            <img
              src={creator.image}
              alt={`Portrait of ${creator.name}`}
              className="w-32 h-32 rounded-full object-cover ring-4 ring-teal-500/50 flex-shrink-0"
            />
            <div className="flex-grow">
              <h3 className="text-2xl font-semibold text-white mb-1">{creator.name}</h3>
              <p className="text-teal-400 font-medium mb-3">{creator.title}</p>
              <p className="text-gray-400 mb-4 text-sm sm:text-base">
                {creator.bio}
              </p>
              {/* Social Links */}
              <div className="flex space-x-4 items-center justify-center md:justify-start">
                {creator.github && (
                  <a
                    href={creator.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-teal-400 transition-colors duration-200"
                    aria-label={`${creator.name}'s Github Profile`}
                  >
                    <Github className="w-6 h-6" />
                  </a>
                )}
                {creator.linkedin && (
                  <a
                    href={creator.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-teal-400 transition-colors duration-200"
                    aria-label={`${creator.name}'s LinkedIn Profile`}
                  >
                    <Linkedin className="w-6 h-6" />
                  </a>
                )}
                {creator.email && (
                  <a
                    href={`mailto:${creator.email}`}
                    className="text-gray-400 hover:text-teal-400 transition-colors duration-200"
                    aria-label={`Email ${creator.name}`}
                  >
                    <Mail className="w-6 h-6" />
                  </a>
                )}
                 {/* Add other relevant links (Portfolio, etc.) here */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};