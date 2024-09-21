import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
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
} from "lucide-react";

const visualizations = [
  {
    title: "Longest Subarray Sum K",
    description: "Find the longest subarray with sum K",
    icon: <Code2 className="h-6 w-6 text-primary" />,
    key: "longestSubarray",
  },
  {
    title: "Spiral Matrix",
    description: "Animate spiral traversal of a matrix",
    icon: <Grid className="h-6 w-6 text-primary" />,
    key: "spiralMatrix",
  },
  {
    title: "Binary Tree Traversal",
    description: "Visualize tree traversal algorithms",
    icon: <GitBranch className="h-6 w-6 text-primary" />,
    key: "binaryTree",
  },
  {
    title: "Rotate Image",
    description: "Rotate a square matrix in-place",
    icon: <RotateCw className="h-6 w-6 text-primary" />,
    key: "rotateImage",
  },
  {
    title: "Sorting Algorithms",
    description: "Visualize popular sorting algorithms",
    icon: <SortDesc className="h-6 w-6 text-primary" />,
    key: "sortingAlgorithms",
  },
  {
    title: "Binary Search",
    description: "Visualize the binary search algorithm",
    icon: <Search className="h-6 w-6 text-primary" />,
    key: "binarySearch",
  },
  {
    title: "Linked List",
    description: "Visualize linked list operations",
    icon: <GitBranch className="h-6 w-6 text-primary" />,
    key: "linkedList",
  },
  {
    title: "Stack and Queue",
    description: "Visualize stack and queue operations",
    icon: <GitBranch className="h-6 w-6 text-primary" />,
    key: "stack",
  },
  {
    title: " Hare-Tortoise",
    description: "Visualize Hare-Tortoise algorithm",
    icon: <GitBranch className="h-6 w-6 text-primary" />,
    key: "hareTortoise",
  },
  {
    title: "Tree Data Structure",
    description: "Visualize tree data structure",
    icon: <GitBranch className="h-6 w-6 text-primary" />,
    key: "tree",
  },
  {
    title:"Neural Network",
  description:"Visualize Neural Network",
  icon:<GitBranch className="h-6 w-6 text-primary" />,
  key:"neuralNetwork"
    
  }
];

interface Contributor {
  name: string;
  role: string;
  image: string;
  github?: string;
  linkedin?: string;
  email?: string;
}

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
    email:""
  
  },
  // Add more contributors as needed
];
interface HomePageProps {
  onSelectVisualization: (key: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onSelectVisualization }) => {
  return (
    <div className="min-h-screen flex flex-col w-screen">
      <main className="flex-grow w-full">
        <section className="w-full bg-gradient-to-b from-background to-background/80 py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Welcome to CodeQuest
            </h1>
            <p className="text-xl text-center mb-12 max-w-3xl mx-auto">
              Embark on an interactive journey through popular coding challenges
              and algorithmic visualizations.
            </p>
          </div>
        </section>

        <section className="w-full bg-secondary/5 py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visualizations.map((viz) => (
                <Card
                  key={viz.key}
                  className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-card"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="p-2 rounded-full bg-primary/10">
                        {viz.icon}
                      </div>
                      <span>{viz.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">
                      {viz.description}
                    </CardDescription>
                    <button
                      onClick={() => onSelectVisualization(viz.key)}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      Explore <Code2 className="h-4 w-4" />
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full bg-primary/5 py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-8">
              About CodeQuest
            </h2>
            <p className="text-lg text-center max-w-3xl mx-auto">
              CodeQuest is an innovative platform designed to help developers
              master complex algorithms and data structures through interactive
              visualizations. Our mission is to make learning engaging,
              intuitive, and accessible to coders of all levels.
            </p>
          </div>
        </section>

        <section className="w-full py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-8">
              Our Contributors
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {contributors.map((contributor, index) => (
                <Card key={index} className="flex flex-col items-center p-6">
                  {/* <img
                    src={contributor.image}
                    alt={contributor.name}
                    className="w-32 h-32 rounded-full mb-4"
                  /> */}
                  <h3 className="text-xl font-semibold">{contributor.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {contributor.role}
                  </p>
                  <div className="flex space-x-4">
                    {contributor.github && (
                      <a
                        href={contributor.github}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Github className="w-5 h-5" />
                      </a>
                    )}
                    {contributor.linkedin && (
                      <a
                        href={contributor.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {contributor.email && (
                      <a href={`mailto:${contributor.email}`}>
                        <Mail className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

      </main>

      <footer className="w-full bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p>&copy; 2024 CodeQuest. All rights reserved.</p>
            <nav className="mt-4 md:mt-0">
              <ul className="flex space-x-4">
                <li>
                  <a href="#" className="hover:underline">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    Contact
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
