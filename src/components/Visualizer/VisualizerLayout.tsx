import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MoveLeftIcon, 
  ChevronRight, 
  ChevronLeft,
  BookOpen
} from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface VisualizerLayoutProps {
  title: string;
  description: React.ReactNode;
  controls: React.ReactNode;
  children: React.ReactNode;
  onBack: () => void;
  pseudocode?: string;
  complexity?: {
    time: string;
    space: string;
  };
}

const VisualizerLayout: React.FC<VisualizerLayoutProps> = ({
  title,
  description,
  controls,
  children,
  onBack,
  pseudocode,
  complexity
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default closed on mobile

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground relative">
      {/* Sidebar for Info & Pseudocode */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed lg:relative w-[280px] sm:w-80 h-full glass-panel border-r border-white/10 z-40 lg:z-20 flex flex-col"
            >
              <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                  Algorithm Info
                </h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsSidebarOpen(false)}
                  className="hover:bg-white/5"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="flex-grow">
                <div className="p-4 sm:p-6">
                  <Tabs defaultValue="guide" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-white/5 mb-6">
                      <TabsTrigger value="guide" className="data-[state=active]:bg-primary/20 text-xs">Guide</TabsTrigger>
                      <TabsTrigger value="code" className="data-[state=active]:bg-secondary/20 text-xs">Code</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="guide" className="space-y-6">
                      <div>
                        <h3 className="text-xs font-semibold text-primary mb-2 flex items-center gap-2">
                          <BookOpen className="h-4 w-4" /> Description
                        </h3>
                        <div className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                          {description}
                        </div>
                      </div>

                      {complexity && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                            <p className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">Time</p>
                            <p className="font-mono text-xs text-primary">{complexity.time}</p>
                          </div>
                          <div className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                            <p className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">Space</p>
                            <p className="font-mono text-xs text-secondary">{complexity.space}</p>
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="code">
                      <div className="rounded-xl bg-black/40 border border-white/10 p-3 overflow-x-auto">
                        <pre className="text-[10px] sm:text-xs font-mono text-gray-300 leading-relaxed">
                          <code>{pseudocode || "// Pseudocode coming soon..."}</code>
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-white/10 mt-auto">
                <Button 
                  onClick={onBack}
                  variant="outline"
                  className="w-full text-xs border-white/10 hover:bg-white/5 hover:text-primary transition-all flex items-center justify-center gap-2"
                >
                  <MoveLeftIcon className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Visualizer Area */}
      <main className="flex-grow flex flex-col relative h-full w-full min-w-0">
        {/* Top Header */}
        <header className="h-14 sm:h-16 px-4 sm:px-8 flex items-center justify-between border-b border-white/10 glass-panel shrink-0">
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
            {!isSidebarOpen && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSidebarOpen(true)}
                className="hover:bg-white/5 shrink-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate">{title}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden sm:block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-widest text-primary animate-pulse">
              Interactive Simulation
            </div>
            <div className="sm:hidden w-2 h-2 rounded-full bg-primary animate-pulse" />
          </div>
        </header>

        {/* Canvas Area */}
        <div className="flex-grow p-4 sm:p-8 flex items-center justify-center overflow-auto bg-black/20">
           <div className="w-full h-full flex items-center justify-center min-h-[300px]">
              {children}
           </div>
        </div>

        {/* Controls Bar */}
        <footer className="h-auto p-4 sm:p-6 border-t border-white/10 glass-panel shrink-0">
           <div className="container mx-auto max-w-7xl">
              {controls}
           </div>
        </footer>
      </main>
    </div>
  );
};

export default VisualizerLayout;
