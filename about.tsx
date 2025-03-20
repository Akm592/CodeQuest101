import { useState, useEffect } from "react"
import { Code, Cpu, GraduationCap, Github, Linkedin, Mail, ChevronRight, ExternalLink } from "lucide-react"
import { motion } from "framer-motion"
import Header from "./Header"
import Footer from "./Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
}

const About = () => {
  const [scrollY, setScrollY] = useState(0)

  // Handle scroll for parallax effects
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Skills data
  const skills = [
    { name: "React", level: 90 },
    { name: "Next.js", level: 85 },
    { name: "TypeScript", level: 80 },
    { name: "Node.js", level: 75 },
    { name: "Data Structures", level: 85 },
    { name: "Algorithms", level: 80 },
  ]

  // Projects data
  const projects = [
    {
      title: "CodeQuest",
      description: "An interactive platform for learning algorithms and data structures with visualizations",
      tags: ["Next.js", "React", "TypeScript", "Framer Motion"],
      link: "#",
    },
    {
      title: "Portfolio Website",
      description: "Personal portfolio showcasing projects and skills",
      tags: ["React", "Tailwind CSS", "Framer Motion"],
      link: "#",
    },
    {
      title: "Algorithm Visualizer",
      description: "Tool for visualizing common algorithms in real-time",
      tags: ["JavaScript", "Canvas API", "Data Structures"],
      link: "#",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 overflow-hidden">
      <Header />

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div
          className="absolute inset-0 z-0 opacity-10"
          style={{
            backgroundImage: "url('/placeholder.svg?height=800&width=1600')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            transform: `translateY(${scrollY * 0.1}px)`,
          }}
        />
        <div className="container relative z-10 px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <motion.div initial="hidden" animate="visible" variants={fadeIn}>
              <Badge className="mb-4" variant="outline">
                About Me
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                Ashish Kumar Mishra
              </h1>
              <p className="text-xl md:text-2xl font-medium text-muted-foreground mb-6">
                Final Year BTech Student & Developer
              </p>
              <p className="text-lg text-muted-foreground mb-8 max-w-md">
                Passionate about creating interactive learning experiences for algorithms and data structures through
                visualization.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg">
                  View Projects
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline">
                  Contact Me
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative hidden md:block"
            >
              <div className="relative w-full aspect-square max-w-md mx-auto">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 to-primary/40 blur-3xl" />
                <Avatar className="w-full h-full border-4 border-background">
                  <AvatarImage src="/placeholder.svg?height=400&width=400" alt="Ashish Kumar Mishra" />
                  <AvatarFallback className="text-6xl">AKM</AvatarFallback>
                </Avatar>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <Badge className="mb-4" variant="outline">
              My Journey
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">The Story Behind CodeQuest</h2>
            <p className="text-lg text-muted-foreground">
              As a final year BTech student, I created CodeQuest to address the challenges I faced when learning complex
              algorithms and data structures. I believe that visual learning can transform how we understand these
              fundamental concepts in computer science.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              custom={0}
              className="relative"
            >
              <Card className="h-full bg-gradient-to-b from-background to-background/90 border border-primary/10 hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 mt-4">
                    <Code className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Interactive Learning</h3>
                  <p className="text-muted-foreground">
                    Visualize algorithms in action with step-by-step animations that make complex concepts intuitive.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              custom={1}
              className="relative md:mt-12"
            >
              <Card className="h-full bg-gradient-to-b from-background to-background/90 border border-primary/10 hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 mt-4">
                    <Cpu className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Practical Application</h3>
                  <p className="text-muted-foreground">
                    Apply theoretical knowledge with hands-on exercises designed to reinforce learning.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              custom={2}
              className="relative"
            >
              <Card className="h-full bg-gradient-to-b from-background to-background/90 border border-primary/10 hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 mt-4">
                    <GraduationCap className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Structured Learning</h3>
                  <p className="text-muted-foreground">
                    Follow a carefully designed curriculum that builds knowledge progressively.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 md:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <Badge className="mb-4" variant="outline">
              Expertise
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Technical Skills</h2>
            <p className="text-lg text-muted-foreground">
              Through my academic journey and personal projects, I've developed proficiency in various technologies and
              concepts.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          >
            {skills.map((skill, index) => (
              <motion.div key={index} variants={fadeIn} className="relative">
                <div className="mb-2 flex justify-between">
                  <span className="font-medium">{skill.name}</span>
                  <span className="text-muted-foreground">{skill.level}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${skill.level}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <Badge className="mb-4" variant="outline">
              Portfolio
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Featured Projects</h2>
            <p className="text-lg text-muted-foreground">
              A selection of projects I've developed during my academic journey.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
          >
            {projects.map((project, index) => (
              <motion.div key={index} variants={fadeIn} whileHover={{ y: -10 }} className="relative">
                <Card className="h-full overflow-hidden border border-primary/10 hover:border-primary/30 transition-all duration-300">
                  <div className="h-48 bg-muted/50">
                    <img
                      src={`/placeholder.svg?height=300&width=500&text=${project.title}`}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                    <p className="text-muted-foreground mb-4">{project.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="font-normal">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <a href={project.link} target="_blank" rel="noopener noreferrer">
                        View Project
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 md:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <Badge className="mb-4" variant="outline">
              Get In Touch
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Let's Connect</h2>
            <p className="text-lg text-muted-foreground">
              I'm always open to discussing new projects, creative ideas, or opportunities to be part of your vision.
            </p>
          </motion.div>

          <div className="flex flex-col md:flex-row justify-center items-center gap-8 max-w-4xl mx-auto">
            <motion.a
              href="mailto:ashish@example.com"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 p-4 rounded-lg bg-background border border-primary/10 hover:border-primary/30 transition-all duration-300 w-full md:w-auto"
            >
              <Mail className="h-6 w-6 text-primary" />
              <span>ashish@example.com</span>
            </motion.a>

            <motion.a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 p-4 rounded-lg bg-background border border-primary/10 hover:border-primary/30 transition-all duration-300 w-full md:w-auto"
            >
              <Github className="h-6 w-6 text-primary" />
              <span>GitHub</span>
            </motion.a>

            <motion.a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 p-4 rounded-lg bg-background border border-primary/10 hover:border-primary/30 transition-all duration-300 w-full md:w-auto"
            >
              <Linkedin className="h-6 w-6 text-primary" />
              <span>LinkedIn</span>
            </motion.a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="max-w-4xl mx-auto text-center bg-gradient-to-r from-primary/10 to-primary/20 p-8 md:p-12 rounded-2xl border border-primary/20"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Explore CodeQuest?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start your journey into algorithms and data structures with interactive visualizations designed to make
              learning intuitive and engaging.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Get Started
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default About

