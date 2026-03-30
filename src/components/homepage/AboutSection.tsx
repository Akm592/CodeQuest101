import React from 'react';
import { Github, Linkedin, Mail } from 'lucide-react';

const creator = {
  name: "Ashish Kumar Mishra",
  title: "Founder & Lead Developer",
  bio: "Passionate Full Stack Developer with a vision to simplify complex coding concepts. Specialized in building interactive educational tools that bridge the gap between theory and practice.",
  image: "https://github.com/Akm592.png", // Using GitHub avatar as placeholder, can be replaced
  github: "https://github.com/Akm592",
  linkedin: "https://www.linkedin.com/in/ashish-kumar-mishra-a286a2224/",
  email: "ashishkumarmishra952@gmail.com",
};

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-24 relative overflow-hidden bg-[#050a14]">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.02]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Mission</span>
            </h2>
            <p className="text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto">
              CodeQuest101 exists to democratize computer science education. We believe that seeing is understanding,
              and our interactive tools are designed to make the invisible logic of algorithms visible and intuitive.
            </p>
          </div>

          {/* Creator Card */}
          <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 rounded-2xl opacity-25 blur group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>

            <div className="relative bg-[#0F1117] border border-white/10 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">

              <div className="relative shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-br from-teal-400 to-blue-500">
                  <img
                    src={creator.image}
                    alt={creator.name}
                    className="w-full h-full rounded-full object-cover border-4 border-[#0F1117]"
                  />
                </div>
              </div>

              <div className="text-center md:text-left flex-grow">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{creator.name}</h3>
                <div className="inline-block px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium mb-4">
                  {creator.title}
                </div>

                <p className="text-gray-400 mb-6 leading-relaxed">
                  {creator.bio}
                </p>

                <div className="flex items-center justify-center md:justify-start gap-4">
                  {[
                    { icon: <Github className="w-5 h-5" />, href: creator.github, label: "GitHub" },
                    { icon: <Linkedin className="w-5 h-5" />, href: creator.linkedin, label: "LinkedIn" },
                    { icon: <Mail className="w-5 h-5" />, href: `mailto:${creator.email}`, label: "Email" },
                  ].map((social, i) => (
                    <a
                      key={i}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 hover:scale-110 transition-all duration-300"
                      aria-label={social.label}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};