import React, { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';

const LoadingScreen: React.FC<{ onFinished: () => void }> = ({ onFinished }) => {
    const loadingScreenRef = useRef<HTMLDivElement>(null);
    const logoTextRef = useRef<HTMLSpanElement>(null);
    const gridRef = useRef<SVGSVGElement>(null);
    const mainRef = useRef<HTMLDivElement>(null);
    const progressBarContainerRef = useRef<HTMLDivElement>(null);

    const onFinishedRef = useRef(onFinished);
    useLayoutEffect(() => {
        onFinishedRef.current = onFinished;
    }, [onFinished]);

    useLayoutEffect(() => {
        const logoText = "CodeQuest101";
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/{};";

        const ctx = gsap.context(() => {
            const scrambleText = (element: HTMLElement) => {
                const originalText = element.textContent || '';
                let counter = 0;
                gsap.to(element, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
                const interval = setInterval(() => {
                    element.textContent = chars[Math.floor(Math.random() * chars.length)];
                    counter++;
                    if (counter > 8) {
                        clearInterval(interval);
                        element.textContent = originalText;
                    }
                }, 60);
            };

            const generateGrid = () => {
                const grid = gridRef.current;
                if (!grid) return;
                const gridSize = 50;
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight;
                let gridLinesHTML = '';
                for (let i = gridSize; i < screenWidth; i += gridSize) {
                    gridLinesHTML += `<path d="M${i},0 V${screenHeight}" />`;
                }
                for (let i = gridSize; i < screenHeight; i += gridSize) {
                    gridLinesHTML += `<path d="M0,${i} H${screenWidth}" />`;
                }
                grid.innerHTML = gridLinesHTML;
            };

            const logoTextContainer = logoTextRef.current;
            if (logoTextContainer) {
                logoTextContainer.innerHTML = '';
                logoText.split('').forEach(char => {
                    const span = document.createElement('span');
                    span.className = 'logo-char';
                    span.textContent = char;
                    logoTextContainer.appendChild(span);
                });
            }
            generateGrid();

            const tl = gsap.timeline({
                onComplete: () => {
                    gsap.to(loadingScreenRef.current, {
                        opacity: 0,
                        duration: 0.8,
                        ease: 'power2.in',
                        onComplete: () => {
                            if (loadingScreenRef.current) {
                                loadingScreenRef.current.style.display = 'none';
                            }
                            onFinishedRef.current();
                        }
                    });
                }
            });

            // Timing Calculation for Syncing
            const scrambleStart = 0.5;
            const scramblePerChar = 0.08;
            const scrambleExtraDelay = 0.5;
            const scrambleDuration = (logoText.length * scramblePerChar) + scrambleExtraDelay;
            const scrambleEnd = scrambleStart + scrambleDuration;
            const finalFadeStart = scrambleEnd + 0.25;

            // Initial animations
            tl.to(".binary-stream-1", { opacity: 0.3, x: -150, duration: 1, ease: 'power2.inOut' }, 0);
            tl.to(".binary-stream-2", { opacity: 0.3, x: 150, duration: 1, ease: 'power2.inOut' }, 0);
            tl.to([".binary-stream-1", ".binary-stream-2"], { opacity: 0, duration: 0.5, ease: 'power2.in' }, 1.8);
            tl.fromTo(".grid-lines path", { strokeDashoffset: 1000 }, { strokeDashoffset: 0, duration: 1.5, ease: 'power3.inOut', stagger: { amount: 1, from: "center" } }, 2);
            tl.to(".grid-lines", { opacity: 0.5, scale: 1.02, duration: 1, repeat: -1, yoyo: true, ease: 'sine.inOut' }, 3.5);

            // Synced Logo and Progress Bar Animation
            tl.to(progressBarContainerRef.current, { opacity: 1, duration: 0.3 }, scrambleStart);
            if (logoTextContainer) {
                Array.from(logoTextContainer.children).forEach((char, index) => {
                    tl.add(() => scrambleText(char as HTMLElement), scrambleStart + index * scramblePerChar);
                });
            }
            tl.call(() => {
                logoTextContainer?.classList.add('gradient-text');
            }, [], scrambleEnd);
            tl.to(".progress-bar", { width: '100%', duration: scrambleDuration, ease: 'power1.inOut' }, scrambleStart);
            tl.to([logoTextRef.current, progressBarContainerRef.current], { opacity: 0, scale: 0.95, duration: 0.7, ease: 'power2.in' }, finalFadeStart);

            // Event Listeners for Parallax and Resize
            const handleMouseMove = (e: MouseEvent) => {
                const { clientX, clientY } = e;
                const x = (clientX / window.innerWidth - 0.5) * 40;
                const y = (clientY / window.innerHeight - 0.5) * 40;
                gsap.to(logoTextRef.current, { duration: 1, x: -x, y: -y, ease: 'power2.out' });
                gsap.to(gridRef.current, { duration: 1, x: -x * 0.5, y: -y * 0.5, ease: 'power2.out' });
                gsap.to(progressBarContainerRef.current, { duration: 1, x: -x * 0.75, y: -y * 0.75, ease: 'power2.out' });
            };

            const handleResize = () => generateGrid();
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('resize', handleResize);
            
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('resize', handleResize);
            };
        }, mainRef);

        return () => ctx.revert();
    }, []);

    return (
        <div id="loading-screen" ref={loadingScreenRef} style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'radial-gradient(ellipse at center, #1a2a45 0%, #0a0a0a 70%)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999,
            color: '#e2e8f0', overflow: 'hidden', perspective: '1000px'
        }}>
            <div ref={mainRef} style={{position: 'absolute', width: '100%', height: '100%'}}>
                <div className="logo-container" style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    fontFamily: '"Roboto Mono", monospace', fontSize: '2.5rem', fontWeight: 700,
                    letterSpacing: '2px', textAlign: 'center', transformStyle: 'preserve-3d'
                }}>
                    <span className="logo-text" ref={logoTextRef}></span>
                    <div className="binary-stream binary-stream-1" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: '"Roboto Mono", monospace', fontSize: '1rem', color: '#475569', opacity: 0, whiteSpace: 'nowrap' }}>010110010110</div>
                    <div className="binary-stream binary-stream-2" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: '"Roboto Mono", monospace', fontSize: '1rem', color: '#475569', opacity: 0, whiteSpace: 'nowrap' }}>110100101101</div>
                </div>

                <svg className="grid-lines" ref={gridRef} style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    pointerEvents: 'none', transformStyle: 'preserve-3d'
                }}></svg>

                <div className="progress-bar-container" ref={progressBarContainerRef} style={{
                    position: 'absolute', bottom: '20%', left: '50%', transform: 'translateX(-50%)',
                    width: '200px', height: '3px', backgroundColor: '#1e293b',
                    borderRadius: '2px', overflow: 'hidden', opacity: 0,
                    transformStyle: 'preserve-3d'
                }}>
                    <div className="progress-bar" style={{
                        width: '0%', height: '100%',
                        background: 'linear-gradient(90deg, #38bdf8, #4ade80)',
                        borderRadius: '2px'
                    }}></div>
                </div>
            </div>
            <style>{`
                .logo-char { 
                    display: inline-block; 
                    opacity: 0; 
                    transform: translateY(20px); 
                }
                .gradient-text { 
                    background: linear-gradient(90deg, #38bdf8, #4ade80); 
                    -webkit-background-clip: text; 
                    -webkit-text-fill-color: transparent; 
                    background-clip: text; 
                    text-fill-color: transparent; 
                }
                .grid-lines path { 
                    stroke: #334155; 
                    stroke-width: 0.5; 
                    stroke-dasharray: 1000; 
                    stroke-dashoffset: 1000; 
                }

                /* --- Responsive Styles for Mobile --- */
                @media (max-width: 768px) {
                    .logo-container {
                        font-size: 1.5rem !important; /* Overrides inline style for smaller screens */
                        letter-spacing: 1px !important;
                    }
                    .binary-stream {
                        font-size: 0.8rem !important;
                    }
                    .progress-bar-container {
                        width: 150px !important; /* Make progress bar smaller on mobile */
                    }
                }
            `}</style>
        </div>
    );
};

export default LoadingScreen;
