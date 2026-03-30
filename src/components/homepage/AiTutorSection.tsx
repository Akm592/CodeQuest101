import React from 'react';
import { Button } from '../ui/button';
import { MessageCircle, Terminal, Cpu, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export const AiTutorSection: React.FC = () => {
  const codeSnippet = `// AI-Powered Analysis
function optimizeAlgorithm(code) {
  const complexity = analyze(code);
  
  if (complexity > O(n)) {
    return suggestImprovements({
      strategy: "Dynamic Programming",
      confidence: 98.4%
    });
  }
  return "Optimal Solution";
}`;

  return (
    <section className="py-24 bg-gradient-to-b from-black to-[#050a14] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[800px] h-[800px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-16">

        {/* Text Content */}
        <div className="lg:w-1/2 z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 text-teal-400 mb-6 uppercase tracking-wider text-sm font-bold">
              <Zap className="w-4 h-4" />
              <span>Real-time Intelligence</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Your Personal <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">AI Coding Mentor</span>
            </h2>

            <p className="text-lg text-gray-400 mb-8 leading-relaxed">
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
                <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm">
                  {feature.icon}
                  {feature.text}
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="lg"
              className="mt-10 border-teal-500/50 text-teal-400 hover:bg-teal-500/10 hover:text-teal-300 h-12 px-8 rounded-full"
              onClick={() => window.location.href = "/chat"}
            >
              Start Chatting <MessageCircle className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>

        {/* Improved IDE Mockup */}
        <div className="lg:w-1/2 w-full relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40, rotateX: 10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ perspective: "1000px" }}
          >
            <div className="relative rounded-xl bg-[#0F1117] border border-white/10 shadow-2xl overflow-hidden glass-card-hover group">
              {/* IDE Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="text-xs text-gray-500 font-mono">analysis_engine.js</div>
                <div className="w-10" />
              </div>

              {/* IDE Body */}
              <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto">
                <pre>
                  <code className="text-gray-300">
                    {codeSnippet.split('\n').map((line, i) => (
                      <div key={i} className="table-row">
                        <span className="table-cell text-gray-700 select-none pr-4 text-right w-8">{i + 1}</span>
                        <span className="table-cell">
                          {line
                            .replace('function', 'FUNCTION_KEYWORD')
                            .replace('const', 'CONST_KEYWORD')
                            .replace('return', 'RETURN_KEYWORD')
                            .replace('if', 'IF_KEYWORD')
                            .split(' ').map((token, j) => {
                              if (token.includes('FUNCTION_KEYWORD')) return <span key={j} className="text-purple-400">function </span>;
                              if (token.includes('CONST_KEYWORD')) return <span key={j} className="text-purple-400">const </span>;
                              if (token.includes('RETURN_KEYWORD')) return <span key={j} className="text-purple-400">return </span>;
                              if (token.includes('IF_KEYWORD')) return <span key={j} className="text-purple-400">if </span>;
                              if (token.includes('//')) return <span key={j} className="text-gray-500">{token} </span>;
                              if (token.match(/"[^"]*"/)) return <span key={j} className="text-green-400">{token} </span>;
                              if (token.match(/[0-9]+/)) return <span key={j} className="text-orange-400">{token} </span>;
                              return <span key={j} className="text-gray-200">{token} </span>;
                            })}
                        </span>
                      </div>
                    ))}
                  </code>
                </pre>
              </div>

              {/* Scanning Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-teal-500/0 via-teal-500/5 to-teal-500/0 w-full h-full pointer-events-none animate-[scan_3s_ease-in-out_infinite]" />
            </div>

            {/* Decorative Elements around IDE */}
            <div className="absolute -z-10 -top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -z-10 -bottom-10 -left-10 w-32 h-32 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-700" />
          </motion.div>
        </div>

      </div>
    </section>
  );
};