// Every link here resolves. Before this pass the footer offered eleven links,
// of which nine went nowhere: six were `href="#"` placeholders (Documentation,
// Community, Blog, and three social icons) and two pointed at `/privacy` and
// `/terms`, which have no routes and fell through to the 404 page.
//
// Rather than invent destinations, the columns now list only what exists.

import { Link } from "react-router-dom";
import { Github, Linkedin } from "lucide-react";

const REPO_URL = "https://github.com/Akm592/CodeQuest101";

const social = [
  { icon: Github, href: REPO_URL, label: "Source on GitHub" },
  {
    icon: Linkedin,
    href: "https://www.linkedin.com/in/ashish-kumar-mishra-a286a2224/",
    label: "LinkedIn",
  },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 pb-8 pt-16 text-muted-foreground">
      <div className="container mx-auto px-4">
        <div className="mb-12 grid grid-cols-1 gap-12 sm:grid-cols-2 md:grid-cols-3">
          {/* Brand */}
          <div>
            <Link to="/" className="mb-4 block text-2xl font-bold text-foreground">
              CodeQuest<span className="text-primary">101</span>
            </Link>
            <p className="mb-6 text-sm leading-relaxed">
              Mastering algorithms through visualization. Built for the modern developer.
            </p>
            <div className="flex space-x-4">
              {social.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="rounded-lg bg-white/5 p-2 transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-6 font-semibold text-foreground">Platform</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to={{ pathname: "/", hash: "visualizations" }}
                  className="transition-colors hover:text-primary"
                >
                  Visualizations
                </Link>
              </li>
              <li>
                <Link to="/chat" className="transition-colors hover:text-primary">
                  AI Tutor
                </Link>
              </li>
              <li>
                <Link to="/about" className="transition-colors hover:text-primary">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 font-semibold text-foreground">Project</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  Source code
                </a>
              </li>
              <li>
                <a
                  href={`${REPO_URL}/issues`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  Report an issue
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 text-center text-sm">
          <p>© {currentYear} CodeQuest101. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
