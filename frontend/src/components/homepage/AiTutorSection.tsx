import React from 'react';
import { Button } from '../ui/button';
import { MessageCircle, Terminal, Cpu, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export const AiTutorSection: React.FC = () => {
  const codeSnippet = `// AI-Powered Analysis
function optimizeAlgorithm(code) {
  const { order, hotspot } = analyze(code);

  if (order === "quadratic") {
    return suggestImprovements({
      strategy: "Dynamic Programming",
      target: hotspot
    });
  }
  return "Optimal Solution";
}`;

  return (
    <section className="relative overflow-hidden py-24">
      {/* Background glow. A radial gradient rather than a blurred circle: a
          blurred circle inside an overflow-hidden section is sliced flat at
          the section edge, and that straight line is the banding. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_70%_at_82%_50%,hsl(var(--primary)/0.10),transparent_70%)]" />

      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-16">

        {/* Text Content */}
        <div className="lg:w-1/2 z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 text-primary mb-6 uppercase tracking-wider text-sm font-bold">
              <Zap className="w-4 h-4" />
              <span>Real-time Intelligence</span>
            </div>

            <h2 className="mb-6 text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
              Your Personal <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">AI Coding Mentor</span>
            </h2>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Stuck on a bug? Need code optimization? Our advanced AI tutor understands context,
              offers real-time debugging suggestions, and explains complex concepts in simple terms.
              It's like pair programming with a senior engineer 24/7.
            </p>

            <div className="flex flex-wrap gap-4">
              {[
                { icon: <Terminal className="w-4 h-4" />, text: "Context Aware" },
                { icon: <Cpu className="w-4 h-4" />, text: "Instant Feedback" },
                { icon: <Zap className="w-4 h-4" />, text: "Performance Tips" }
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-muted-foreground text-sm">
                  {feature.icon}
                  {feature.text}
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="lg"
              className="mt-10 border-primary/50 text-primary hover:bg-primary/10 hover:text-primary h-12 px-8 rounded-full"
              onClick={() => window.location.href = "/chat"}
            >
              Start Chatting <MessageCircle className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>

        {/* Improved IDE Mockup */}
        <div className="relative z-10 w-full lg:w-1/2" style={{ perspective: "1000px" }}>
          <motion.div
            initial={{ opacity: 0, y: 40, rotateX: 10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="relative rounded-xl bg-card border border-white/10 shadow-2xl overflow-hidden transition-colors duration-300 hover:border-primary/30 group">
              {/* IDE Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="text-xs text-muted-foreground font-mono">analysis_engine.js</div>
                <div className="w-10" />
              </div>

              {/* IDE Body */}
              <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto">
                <pre>
                  <code className="text-muted-foreground">
                    {codeSnippet.split('\n').map((line, i) => (
                      <div key={i} className="table-row">
                        <span className="table-cell w-8 select-none pr-4 text-right text-muted-foreground/60">{i + 1}</span>
                        <span className="table-cell">
                          {line
                            .replace('function', 'FUNCTION_KEYWORD')
                            .replace('const', 'CONST_KEYWORD')
                            .replace('return', 'RETURN_KEYWORD')
                            .replace('if', 'IF_KEYWORD')
                            .split(' ').map((token, j) => {
                              if (token.includes('FUNCTION_KEYWORD')) return <span key={j} className="text-secondary-bright">function </span>;
                              if (token.includes('CONST_KEYWORD')) return <span key={j} className="text-secondary-bright">const </span>;
                              if (token.includes('RETURN_KEYWORD')) return <span key={j} className="text-secondary-bright">return </span>;
                              if (token.includes('IF_KEYWORD')) return <span key={j} className="text-secondary-bright">if </span>;
                              if (token.includes('//')) return <span key={j} className="text-muted-foreground">{token} </span>;
                              if (token.match(/"[^"]*"/)) return <span key={j} className="text-viz-found">{token} </span>;
                              if (token.match(/[0-9]+/)) return <span key={j} className="text-viz-compare">{token} </span>;
                              return <span key={j} className="text-foreground">{token} </span>;
                            })}
                        </span>
                      </div>
                    ))}
                  </code>
                </pre>
              </div>

              {/* Scanning Effect Overlay */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 animate-scan bg-gradient-to-b from-primary/0 via-primary/10 to-primary/0 motion-reduce:hidden" />
            </div>

            {/* Decorative Elements around IDE */}
            <div className="absolute -z-10 -top-10 -right-10 w-32 h-32 bg-secondary/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -z-10 -bottom-10 -left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse delay-700" />
          </motion.div>
        </div>

      </div>
    </section>
  );
};