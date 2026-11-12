import React from 'react';
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

      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-16">

        {/* Text Content */}
        <div className="lg:w-1/2 z-10">
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6 flex items-center gap-2 text-sm font-medium text-primary">
              <Zap className="w-4 h-4" />
              <span>AI tutor</span>
            </div>

            <h2 className="mb-6 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Your personal <br />
              <span className="text-foreground/55">AI coding mentor.</span>
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
                <div key={i} className="glass-pill flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
                  {feature.icon}
                  {feature.text}
                </div>
              ))}
            </div>

            <a
              href="/chat"
              className="glass-pill glass-hover mt-10 inline-flex h-12 items-center gap-2 px-7 text-sm font-semibold text-foreground"
            >
              Start chatting <MessageCircle className="h-4 w-4 text-primary" />
            </a>
          </motion.div>
        </div>

        {/* Improved IDE Mockup */}
        <div className="relative z-10 w-full lg:w-1/2" style={{ perspective: "1000px" }}>
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="glass relative overflow-hidden rounded-2xl">
              {/* IDE Header */}
              <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3">
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

            </div>

          </motion.div>
        </div>

      </div>
    </section>
  );
};