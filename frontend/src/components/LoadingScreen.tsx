import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { gsap } from 'gsap';

const LoadingScreen: React.FC<{ onFinished: () => void }> = ({ onFinished }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const logoRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const [percent, setPercent] = useState(0);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                onComplete: () => {
                    gsap.to(containerRef.current, {
                        opacity: 0,
                        duration: 0.6,
                        ease: "power2.inOut",
                        onComplete: onFinished
                    });
                }
            });

            // Entrance
            tl.fromTo(logoRef.current, 
                { opacity: 0, y: 20, scale: 0.9 },
                { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "back.out(1.7)" }
            );

            // Progress Bar Animation
            tl.to(progressRef.current, {
                width: "100%",
                duration: 1.2,
                ease: "power1.inOut",
            }, "-=0.4");

            // Glitch effect at the end
            tl.to(logoRef.current, {
                skewX: 20,
                duration: 0.1,
                repeat: 3,
                yoyo: true,
                ease: "power4.inOut"
            }, "-=0.2");
            tl.to(logoRef.current, { skewX: 0, duration: 0.05 });

        }, containerRef);

        return () => ctx.revert();
    }, [onFinished]);

    // Counter animation
    useEffect(() => {
        const interval = setInterval(() => {
            setPercent(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + Math.floor(Math.random() * 15) + 5;
            });
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <div ref={containerRef} data-loading-screen className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background overflow-hidden">
            {/* Background Aesthetic Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px] loader-breathe" />
                <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/10 blur-[80px] loader-breathe loader-breathe-delayed" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-8">
                {/* Logo */}
                <div ref={logoRef} className="text-4xl sm:text-6xl font-black tracking-tighter flex items-center gap-2">
                    <span className="text-foreground">CodeQuest</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary drop-shadow-[0_0_15px_hsl(var(--primary)/0.5)]">
                        101
                    </span>
                </div>

                {/* Progress Group */}
                <div className="w-64 sm:w-80 space-y-3">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">System Initializing</span>
                        <span className="text-xs font-mono text-primary">{Math.min(percent, 100)}%</span>
                    </div>
                    <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                            ref={progressRef}
                            className="h-full w-0 bg-gradient-to-r from-primary to-secondary shadow-[0_0_10px_hsl(var(--primary)/0.5)] transition-all duration-100"
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Tech Text */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 text-muted-foreground">
                <div className="h-[1px] w-8 bg-muted" />
                <span className="text-[9px] uppercase tracking-widest font-medium">Visualization Engine v2.0.4</span>
                <div className="h-[1px] w-8 bg-muted" />
            </div>

            {/* Scoped names. This block used to redefine @keyframes pulse and
                .animate-pulse unscoped, so while the loader was mounted every
                animate-pulse in the app — skeletons included — ran at 4s and
                scaled by 10%. */}
            <style>{`
                @keyframes loader-breathe {
                    0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
                    50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
                }
                .loader-breathe {
                    animation: loader-breathe 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                .loader-breathe-delayed {
                    animation-delay: 700ms;
                }
                @media (prefers-reduced-motion: reduce) {
                    .loader-breathe { animation: none; }
                }
            `}</style>
        </div>
    );
};

export default LoadingScreen;
