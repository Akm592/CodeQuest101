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
    <section id="about" className="relative overflow-hidden py-24 scroll-mt-20">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-16">
            <h2 className="mb-6 text-3xl font-bold text-foreground md:text-5xl">
              Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Mission</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              CodeQuest101 exists to democratize computer science education. We believe that seeing is understanding,
              and our interactive tools are designed to make the invisible logic of algorithms visible and intuitive.
            </p>
          </div>

          {/* Creator Card */}
          <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl opacity-25 blur group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>

            <div className="relative bg-card border border-white/10 flex flex-col items-center gap-8 rounded-2xl p-6 sm:p-10 md:flex-row md:gap-12">

              <div className="relative shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-br from-primary to-secondary">
                  <img
                    src={creator.image}
                    alt={creator.name}
                    className="w-full h-full rounded-full object-cover border-4 border-card"
                  />
                </div>
              </div>

              <div className="text-center md:text-left flex-grow">
                <h3 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">{creator.name}</h3>
                <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
                  {creator.title}
                </div>

                <p className="text-muted-foreground mb-6 leading-relaxed">
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
                      className="p-2 rounded-full bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground hover:scale-110 transition-all duration-300"
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