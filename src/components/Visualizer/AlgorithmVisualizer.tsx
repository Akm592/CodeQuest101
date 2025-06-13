// src/components/Visualizer/AlgorithmVisualizer.tsx

import React, { useEffect, useRef, useState } from "react";
import p5 from "p5";

// Enhanced interfaces for array visualizations
interface VisualizationStep {
  hashmap?: any;
  array?: any[];
  pointers?: { [key: string]: number };
  highlightedIndices?: number[];
  highlightedRanges?: Array<{ start: number; end: number; color?: string }>;
  windowStart?: number;
  windowEnd?: number;
  windowSum?: number;
  currentValue?: any;
  targetValue?: any;
  comparison?: { indices: number[]; operation: string; result: any };
  computedValues?: {
    prefixSum?: number[];
    maxSoFar?: number;
    minSoFar?: number;
    runningSum?: number;
    [key: string]: any;
  };
  annotations?: Array<{ index: number; text: string; position: 'above' | 'below' }>;
  transformations?: {
    rotated?: any[];
    reversed?: any[];
    sorted?: any[];
  };
  subarray?: { start: number; end: number; sum?: number; [key: string]: any };
  message?: string;
  compare?: number[];
  swap?: number[];
  visitedNodes?: string[];
  currentNode?: string;
  updatedCells?: [number, number, any][];
  distances?: { [key: string]: number };
  highlightedNodes?: string[];
  highlightedCells?: [number, number][];
  stack?: any[];
  queue?: any[];
}

interface VisualizationData {
  visualizationType: string;
  algorithm?: string;
  array?: any[];
  steps?: VisualizationStep[];
  nodes?: any[];
  edges?: any[];
  stack?: any[];
  queue?: any[];
  hashmap?: any;
  entries?: { key: string; value: any }[];
  rows?: number;
  columns?: number;
  data?: any[][];
  matrix?: any[][];
  structure?: string;
  layout?: string;
}

interface AlgorithmVisualizerProps {
  visualizationData: VisualizationData | null;
}

const AlgorithmVisualizer: React.FC<AlgorithmVisualizerProps> = ({ visualizationData }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  useEffect(() => {
    // Update dimensions on mount and resize
    const updateDimensions = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        const parentWidth = parent?.clientWidth || window.innerWidth;
        const parentHeight = parent?.clientHeight || window.innerHeight;
        
        // Calculate responsive dimensions
        const maxWidth = Math.min(parentWidth * 0.95, window.innerWidth * 0.9);
        const maxHeight = Math.min(parentHeight * 0.8, window.innerHeight * 0.7);
        
        // Maintain aspect ratio while being flexible
        let canvasWidth = maxWidth;
        let canvasHeight = maxWidth * 0.625; // 16:10 ratio
        
        if (canvasHeight > maxHeight) {
          canvasHeight = maxHeight;
          canvasWidth = maxHeight * 1.6;
        }
        
        // Set minimum dimensions
        canvasWidth = Math.max(canvasWidth, 320);
        canvasHeight = Math.max(canvasHeight, 200);
        
        // Set maximum dimensions
        canvasWidth = Math.min(canvasWidth, 1200);
        canvasHeight = Math.min(canvasHeight, 750);
        
        setDimensions({ width: canvasWidth, height: canvasHeight });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Clean up previous p5 instance
    if (p5InstanceRef.current) {
      p5InstanceRef.current.remove();
    }

    // Create new p5 instance with responsive dimensions
    const sketch = (p: p5) => {
      let currentStep = 0;
      let animationSpeed = 60;
      let frameCounter = 0;
      let isAnimating = false;
      
      // Responsive canvas dimensions
      let canvasWidth = dimensions.width;
      let canvasHeight = dimensions.height;
      
      // Responsive scaling function
      const getScaleFactor = () => Math.min(canvasWidth / 800, canvasHeight / 500);
      const scale = (value: number) => value * getScaleFactor();
      
      // Responsive colors
      const colors = {
        background: p.color(255),
        primary: p.color(70, 130, 180),
        secondary: p.color(255, 165, 0),
        highlight: p.color(255, 69, 0),
        success: p.color(34, 139, 34),
        warning: p.color(255, 215, 0),
        danger: p.color(220, 20, 60),
        text: p.color(44, 62, 80),
        border: p.color(52, 73, 94)
      };

      // Responsive pointer colors
      const pointerColors: { [key: string]: p5.Color } = {
        left: p.color(231, 76, 60),
        right: p.color(52, 152, 219),
        slow: p.color(243, 156, 18),
        fast: p.color(155, 89, 182),
        pivot: p.color(230, 126, 34),
        start: p.color(39, 174, 96),
        end: p.color(192, 57, 43),
        mid: p.color(142, 68, 173),
        windowStart: p.color(22, 160, 133),
        windowEnd: p.color(41, 128, 185)
      };

      p.setup = () => {
        p.createCanvas(canvasWidth, canvasHeight);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(scale(14));
        
        if (visualizationData?.steps && visualizationData.steps.length > 0) {
          isAnimating = true;
        }
      };

      p.draw = () => {
        p.background(colors.background);
        
        if (!visualizationData) {
          p.fill(colors.text);
          p.textSize(scale(16));
          p.text("No visualization data provided", canvasWidth / 2, canvasHeight / 2);
          return;
        }

        // Handle animation timing
        if (isAnimating && visualizationData.steps) {
          frameCounter++;
          if (frameCounter >= animationSpeed) {
            currentStep = (currentStep + 1) % visualizationData.steps.length;
            frameCounter = 0;
          }
        }

        // Render based on visualization type
        switch (visualizationData.visualizationType) {
          case "sorting":
            renderSorting();
            break;
          case "array":
            renderArray();
            break;
          case "graph":
            renderGraph();
            break;
          case "tree":
            renderTree();
            break;
          case "stack":
            renderStack();
            break;
          case "queue":
            renderQueue();
            break;
          case "hashmap":
            renderHashMap();
            break;
          case "table":
            renderTable();
            break;
          case "matrix":
            renderMatrix();
            break;
          case "linked_list":
            renderLinkedList();
            break;
          default:
            p.fill(colors.text);
            p.textSize(scale(16));
            p.text(`Unsupported visualization: ${visualizationData.visualizationType}`, 
                   canvasWidth / 2, canvasHeight / 2);
        }
      };

      // Enhanced Responsive Array Visualization
      const renderArray = () => {
        const data = visualizationData!;
        const array = data.array || [];
        const steps = data.steps || [];
        const currentStepData = steps[currentStep] || { array, message: "Initial Array State" };
        
        if (!array.length) {
          p.fill(colors.text);
          p.textSize(scale(16));
          p.text("Empty array", canvasWidth / 2, canvasHeight / 2);
          return;
        }

        // Responsive dimensions
        const boxHeight = scale(50);
        const minBoxWidth = scale(30);
        const maxBoxWidth = scale(80);
        const availableWidth = canvasWidth - scale(100);
        const boxWidth = Math.max(minBoxWidth, Math.min(maxBoxWidth, availableWidth / array.length));
        const spacing = scale(10);
        const totalWidth = array.length * (boxWidth + spacing) - spacing;
        const startX = (canvasWidth - totalWidth) / 2;
        const arrayY = canvasHeight / 2 - boxHeight / 2;

        // Draw algorithm indicator
        p.fill(colors.text);
        p.textSize(scale(14));
        p.textStyle(p.BOLD);
        p.text(`Algorithm: ${(data.algorithm || 'array').replace('_', ' ').toUpperCase()}`, 
               canvasWidth / 2, scale(50));

        // Draw step message
        p.textSize(scale(16));
        p.text(currentStepData.message || "Array Visualization", canvasWidth / 2, scale(80));

        // Get current array state
        let currentArray = array;
        if (currentStepData.transformations) {
          if (currentStepData.transformations.rotated) currentArray = currentStepData.transformations.rotated;
          else if (currentStepData.transformations.reversed) currentArray = currentStepData.transformations.reversed;
          else if (currentStepData.transformations.sorted) currentArray = currentStepData.transformations.sorted;
        } else if (currentStepData.array) {
          currentArray = currentStepData.array;
        }

        // Draw array boxes
        p.textSize(scale(14));
        p.textStyle(p.BOLD);
        for (let i = 0; i < currentArray.length; i++) {
          const x = startX + i * (boxWidth + spacing);
          
          // Determine box color
          let boxColor = colors.primary;
          
          if (currentStepData.swap?.includes(i)) {
            boxColor = colors.danger;
          } else if (currentStepData.compare?.includes(i)) {
            boxColor = colors.warning;
          } else if (currentStepData.highlightedIndices?.includes(i)) {
            boxColor = colors.secondary;
          } else if (currentStepData.subarray && 
                    i >= currentStepData.subarray.start && 
                    i <= currentStepData.subarray.end) {
            boxColor = colors.success;
          } else if (currentStepData.windowStart !== undefined && 
                    currentStepData.windowEnd !== undefined &&
                    i >= currentStepData.windowStart && 
                    i <= currentStepData.windowEnd) {
            boxColor = p.color(232, 245, 232);
            p.stroke(colors.success);
            p.strokeWeight(scale(3));
          }

          // Handle highlighted ranges
          if (currentStepData.highlightedRanges) {
            for (const range of currentStepData.highlightedRanges) {
              if (i >= range.start && i <= range.end) {
                boxColor = range.color ? p.color(range.color) : colors.secondary;
              }
            }
          }

          // Draw box
          p.fill(boxColor);
          if (!(currentStepData.windowStart !== undefined && 
                currentStepData.windowEnd !== undefined &&
                i >= currentStepData.windowStart && 
                i <= currentStepData.windowEnd)) {
            p.stroke(colors.border);
            p.strokeWeight(scale(2));
          }
          p.rect(x, arrayY, boxWidth, boxHeight, scale(4));

          // Draw value
          p.fill(255);
          p.noStroke();
          p.textSize(Math.max(scale(10), boxWidth * 0.25));
          p.text(currentArray[i], x + boxWidth / 2, arrayY + boxHeight / 2);

          // Draw index
          p.fill(colors.text);
          p.textSize(scale(12));
          p.textStyle(p.NORMAL);
          p.text(i, x + boxWidth / 2, arrayY + boxHeight + scale(20));
          p.textSize(scale(14));
          p.textStyle(p.BOLD);
        }

        // Draw pointers
        if (currentStepData.pointers) {
          Object.entries(currentStepData.pointers).forEach(([name, index]) => {
            if (index >= 0 && index < currentArray.length) {
              const x = startX + index * (boxWidth + spacing) + boxWidth / 2;
              const y = arrayY - scale(20);
              
              p.fill(pointerColors[name] || colors.danger);
              p.noStroke();
              p.textSize(scale(14));
              p.textStyle(p.BOLD);
              p.text(name.toUpperCase(), x, y);
            }
          });
        }

        // Draw annotations
        if (currentStepData.annotations) {
          currentStepData.annotations.forEach(annotation => {
            if (annotation.index >= 0 && annotation.index < currentArray.length) {
              const x = startX + annotation.index * (boxWidth + spacing) + boxWidth / 2;
              const y = annotation.position === "above" ? arrayY - scale(50) : arrayY + boxHeight + scale(50);
              
              p.fill(colors.text);
              p.textSize(scale(12));
              p.textStyle(p.BOLD);
              p.text(annotation.text, x, y);
            }
          });
        }

        // Draw computed values
        if (currentStepData.computedValues) {
          let yOffset = arrayY + boxHeight + scale(80);
          p.fill(colors.text);
          p.textSize(scale(14));
          p.textStyle(p.NORMAL);
          p.textAlign(p.LEFT, p.CENTER);
          
          Object.entries(currentStepData.computedValues).forEach(([key, value], index) => {
            const displayValue = Array.isArray(value) ? `[${value.join(', ')}]` : value;
            p.text(`${key}: ${displayValue}`, scale(20), yOffset + index * scale(25));
          });
          p.textAlign(p.CENTER, p.CENTER);
        }

        // Draw window sum
        if (currentStepData.windowSum !== undefined) {
          p.fill(colors.success);
          p.textSize(scale(14));
          p.textStyle(p.BOLD);
          p.textAlign(p.RIGHT, p.CENTER);
          p.text(`Window Sum: ${currentStepData.windowSum}`, canvasWidth - scale(20), arrayY - scale(20));
          p.textAlign(p.CENTER, p.CENTER);
        }

        // Draw target value
        if (currentStepData.targetValue !== undefined) {
          p.fill(colors.danger);
          p.textSize(scale(14));
          p.textStyle(p.BOLD);
          p.textAlign(p.LEFT, p.CENTER);
          p.text(`Target: ${currentStepData.targetValue}`, scale(20), arrayY - scale(20));
          p.textAlign(p.CENTER, p.CENTER);
        }

        // Draw comparison
        if (currentStepData.comparison) {
          p.fill(p.color(142, 68, 173));
          p.textSize(scale(14));
          p.textStyle(p.BOLD);
          p.text(`${currentStepData.comparison.operation}: ${currentStepData.comparison.result}`, 
                 canvasWidth / 2, arrayY + boxHeight + scale(50));
        }
      };

      // Responsive Sorting Visualization
      const renderSorting = () => {
        const data = visualizationData!;
        const steps = data.steps || [];
        const initialArray = data.array || steps[0]?.array || [];
        const currentStepData = steps[currentStep] || { array: initialArray, message: "Initial State" };
        
        if (!initialArray.length) {
          p.fill(colors.text);
          p.textSize(scale(16));
          p.text("Empty array for sorting", canvasWidth / 2, canvasHeight / 2);
          return;
        }

        const currentArray = currentStepData.array || initialArray;
        const minBarWidth = scale(8);
        const maxBarWidth = scale(50);
        const availableWidth = canvasWidth - scale(100);
        const barWidth = Math.max(minBarWidth, Math.min(maxBarWidth, availableWidth / currentArray.length));
        const barSpacing = barWidth * 0.1;
        const totalWidth = currentArray.length * (barWidth + barSpacing) - barSpacing;
        const startX = (canvasWidth - totalWidth) / 2;
        const maxValue = Math.max(...currentArray);
        const maxHeight = canvasHeight - scale(150);

        // Draw message
        p.fill(colors.text);
        p.textSize(scale(16));
        p.textStyle(p.BOLD);
        p.text(currentStepData.message || "Sorting Visualization", canvasWidth / 2, scale(30));

        // Draw bars
        p.textSize(scale(12));
        for (let i = 0; i < currentArray.length; i++) {
          const x = startX + i * (barWidth + barSpacing);
          const barHeight = (currentArray[i] / maxValue) * maxHeight;
          const y = canvasHeight - scale(50) - barHeight;
          
          // Determine bar color
          let barColor = colors.primary;
          if (currentStepData.swap?.includes(i)) {
            barColor = colors.danger;
          } else if (currentStepData.compare?.includes(i)) {
            barColor = colors.warning;
          }

          // Draw bar
          p.fill(barColor);
          p.stroke(colors.border);
          p.strokeWeight(scale(1));
          p.rect(x, y, barWidth, barHeight, scale(3));

          // Draw value on top of bar
          p.fill(colors.text);
          p.noStroke();
          p.textSize(Math.max(scale(8), barWidth * 0.25));
          p.text(currentArray[i], x + barWidth / 2, y - scale(10));
        }
      };

      // Responsive Graph Visualization
      const renderGraph = () => {
        const data = visualizationData!;
        const nodes = data.nodes || [];
        const edges = data.edges || [];
        const steps = data.steps || [];
        const currentStepData = steps[currentStep] || {};

        if (!nodes.length) {
          p.fill(colors.text);
          p.textSize(scale(16));
          p.text("No graph nodes provided", canvasWidth / 2, canvasHeight / 2);
          return;
        }

        // Simple force-directed layout simulation
        const nodePositions: { [key: string]: { x: number; y: number } } = {};
        
        // Initialize positions if not set
        nodes.forEach((node, index) => {
          if (!nodePositions[node.id]) {
            const angle = (index / nodes.length) * p.TWO_PI;
            const radius = Math.min(canvasWidth, canvasHeight) * 0.25;
            nodePositions[node.id] = {
              x: canvasWidth / 2 + Math.cos(angle) * radius,
              y: canvasHeight / 2 + Math.sin(angle) * radius
            };
          }
        });

        // Draw message
        p.fill(colors.text);
        p.textSize(scale(16));
        p.textStyle(p.BOLD);
        p.text(currentStepData.message || "Graph Visualization", canvasWidth / 2, scale(30));

        // Draw edges
        p.stroke(colors.border);
        p.strokeWeight(scale(2));
        edges.forEach(edge => {
          const sourcePos = nodePositions[edge.source];
          const targetPos = nodePositions[edge.target];
          if (sourcePos && targetPos) {
            p.line(sourcePos.x, sourcePos.y, targetPos.x, targetPos.y);
            
            // Draw weight if present
            if (edge.weight !== undefined) {
              const midX = (sourcePos.x + targetPos.x) / 2;
              const midY = (sourcePos.y + targetPos.y) / 2;
              p.fill(colors.text);
              p.noStroke();
              p.textSize(scale(12));
              p.text(edge.weight, midX, midY);
            }
          }
        });

        // Draw nodes
        const nodeRadius = scale(20);
        nodes.forEach(node => {
          const pos = nodePositions[node.id];
          if (pos) {
            // Determine node color
            let nodeColor = colors.primary;
            if (currentStepData.currentNode === node.id) {
              nodeColor = colors.danger;
            } else if (currentStepData.visitedNodes?.includes(node.id)) {
              nodeColor = colors.warning;
            }

            // Draw node
            p.fill(nodeColor);
            p.stroke(255);
            p.strokeWeight(scale(2));
            p.circle(pos.x, pos.y, nodeRadius * 2);

            // Draw label
            p.fill(255);
            p.noStroke();
            p.textSize(scale(14));
            p.textStyle(p.BOLD);
            p.text(node.label || node.id, pos.x, pos.y);
          }
        });
      };

      // Responsive Stack Visualization
      const renderStack = () => {
        const data = visualizationData!;
        const steps = data.steps || [];
        const initialStack = data.stack || data.array || [];
        const currentStepData = steps[currentStep] || { stack: initialStack };
        const currentStack = currentStepData.stack || currentStepData.array || initialStack;

        const boxWidth = scale(120);
        const boxHeight = scale(40);
        const spacing = scale(5);
        const startX = canvasWidth / 2 - boxWidth / 2;
        const startY = canvasHeight - scale(50);

        // Draw message
        p.fill(colors.text);
        p.textSize(scale(16));
        p.textStyle(p.BOLD);
        p.text(currentStepData.message || "Stack Visualization", canvasWidth / 2, scale(30));

        // Draw stack elements
        currentStack.forEach((item, index) => {
          const y = startY - (index + 1) * (boxHeight + spacing);
          
          p.fill(colors.primary);
          p.stroke(colors.border);
          p.strokeWeight(scale(2));
          p.rect(startX, y, boxWidth, boxHeight, scale(5));

          p.fill(255);
          p.noStroke();
          p.textSize(scale(14));
          p.text(item, startX + boxWidth / 2, y + boxHeight / 2);
        });

        // Draw "Top" indicator
        if (currentStack.length > 0) {
          p.fill(colors.text);
          p.textSize(scale(12));
          p.text("← Top", startX + boxWidth + scale(20), startY - currentStack.length * (boxHeight + spacing) + boxHeight / 2);
        }

        // Draw empty stack message
        if (currentStack.length === 0) {
          p.fill(colors.text);
          p.textSize(scale(14));
          p.text("Empty Stack", canvasWidth / 2, canvasHeight / 2);
        }
      };

      // Responsive Queue Visualization
      const renderQueue = () => {
        const data = visualizationData!;
        const steps = data.steps || [];
        const initialQueue = data.queue || data.array || [];
        const currentStepData = steps[currentStep] || { queue: initialQueue };
        const currentQueue = currentStepData.queue || currentStepData.array || initialQueue;

        const boxWidth = scale(80);
        const boxHeight = scale(40);
        const spacing = scale(10);
        const totalWidth = currentQueue.length * (boxWidth + spacing) - spacing;
        const startX = (canvasWidth - totalWidth) / 2;
        const queueY = canvasHeight / 2 - boxHeight / 2;

        // Draw message
        p.fill(colors.text);
        p.textSize(scale(16));
        p.textStyle(p.BOLD);
        p.text(currentStepData.message || "Queue Visualization", canvasWidth / 2, scale(30));

        // Draw queue elements
        currentQueue.forEach((item, index) => {
          const x = startX + index * (boxWidth + spacing);
          
          p.fill(colors.primary);
          p.stroke(colors.border);
          p.strokeWeight(scale(2));
          p.rect(x, queueY, boxWidth, boxHeight, scale(3));

          p.fill(255);
          p.noStroke();
          p.textSize(scale(14));
          p.text(item, x + boxWidth / 2, queueY + boxHeight / 2);
        });

        // Draw Front/Rear indicators
        if (currentQueue.length > 0) {
          p.fill(colors.text);
          p.textSize(scale(12));
          p.text("Front ↓", startX + boxWidth / 2, queueY - scale(20));
          p.text("↑ Rear", startX + (currentQueue.length - 1) * (boxWidth + spacing) + boxWidth / 2, queueY + boxHeight + scale(20));
        }

        // Draw empty queue message
        if (currentQueue.length === 0) {
          p.fill(colors.text);
          p.textSize(scale(14));
          p.text("Empty Queue", canvasWidth / 2, canvasHeight / 2);
        }
      };

      // Responsive HashMap Visualization
      const renderHashMap = () => {
        const data = visualizationData!;
        const steps = data.steps || [];
        let entries: { key: string; value: any }[] = [];
        
        if (data.entries) {
          entries = data.entries;
        } else if (data.hashmap && typeof data.hashmap === 'object') {
          entries = Object.entries(data.hashmap).map(([key, value]) => ({ key, value }));
        }

        const currentStepData = steps[currentStep] || {};
        let currentEntries = entries;
        if (currentStepData.hashmap) {
          currentEntries = Object.entries(currentStepData.hashmap).map(([key, value]) => ({ key, value }));
        }

        const bucketWidth = scale(150);
        const bucketHeight = scale(40);
        const spacing = scale(10);
        const itemsPerRow = Math.max(1, Math.floor((canvasWidth - scale(40)) / (bucketWidth + spacing)));

        // Draw message
        p.fill(colors.text);
        p.textSize(scale(16));
        p.textStyle(p.BOLD);
        p.text(currentStepData.message || "HashMap Visualization", canvasWidth / 2, scale(30));

        // Draw hashmap entries
        currentEntries.forEach((entry, index) => {
          const row = Math.floor(index / itemsPerRow);
          const col = index % itemsPerRow;
          const x = scale(20) + col * (bucketWidth + spacing);
          const y = scale(80) + row * (bucketHeight + spacing);

          p.fill(colors.primary);
          p.stroke(colors.border);
          p.strokeWeight(scale(2));
          p.rect(x, y, bucketWidth, bucketHeight, scale(3));

          p.fill(255);
          p.noStroke();
          p.textSize(scale(12));
          p.text(`${entry.key}: ${entry.value}`, x + bucketWidth / 2, y + bucketHeight / 2);
        });

        // Draw empty hashmap message
        if (currentEntries.length === 0) {
          p.fill(colors.text);
          p.textSize(scale(14));
          p.text("Empty HashMap", canvasWidth / 2, canvasHeight / 2);
        }
      };

      // Responsive Tree Visualization
      const renderTree = () => {
        const data = visualizationData!;
        const nodes = data.nodes || [];
        const steps = data.steps || [];
        const currentStepData = steps[currentStep] || {};

        if (!nodes.length) {
          p.fill(colors.text);
          p.textSize(scale(16));
          p.text("No tree data provided", canvasWidth / 2, canvasHeight / 2);
          return;
        }

        // Simple tree layout
        const nodePositions: { [key: string]: { x: number; y: number } } = {};
        const levels: { [key: string]: number } = {};
        
        // Build hierarchy and calculate positions
        const nodeMap = new Map(nodes.map(n => [n.id, n]));
        const children = new Set<string>();
        
        // Find children and root
        nodes.forEach(node => {
          if (node.children) {
            node.children.forEach((childId: string) => children.add(childId));
          }
        });
        
        const root = nodes.find(node => !children.has(node.id));
        if (!root) return;

        // Calculate levels using BFS
        const queue = [{ id: root.id, level: 0 }];
        levels[root.id] = 0;
        
        while (queue.length > 0) {
          const { id, level } = queue.shift()!;
          const node = nodeMap.get(id);
          if (node?.children) {
            node.children.forEach((childId: string) => {
              if (levels[childId] === undefined) {
                levels[childId] = level + 1;
                queue.push({ id: childId, level: level + 1 });
              }
            });
          }
        }

        // Position nodes
        const maxLevel = Math.max(...Object.values(levels));
        const levelHeight = (canvasHeight - scale(150)) / (maxLevel + 1);
        
        Object.entries(levels).forEach(([nodeId, level]) => {
          const nodesAtLevel = Object.entries(levels).filter(([_, l]) => l === level);
          const indexAtLevel = nodesAtLevel.findIndex(([id, _]) => id === nodeId);
          const levelWidth = canvasWidth - scale(100);
          const x = scale(50) + (indexAtLevel + 1) * levelWidth / (nodesAtLevel.length + 1);
          const y = scale(80) + level * levelHeight;
          
          nodePositions[nodeId] = { x, y };
        });

        // Draw message
        p.fill(colors.text);
        p.textSize(scale(16));
        p.textStyle(p.BOLD);
        p.text(currentStepData.message || "Tree Visualization", canvasWidth / 2, scale(30));

        // Draw edges
        p.stroke(colors.border);
        p.strokeWeight(scale(2));
        nodes.forEach(node => {
          if (node.children && nodePositions[node.id]) {
            const parentPos = nodePositions[node.id];
            node.children.forEach((childId: string) => {
              const childPos = nodePositions[childId];
              if (childPos) {
                p.line(parentPos.x, parentPos.y, childPos.x, childPos.y);
              }
            });
          }
        });

        // Draw nodes
        const nodeRadius = scale(20);
        nodes.forEach(node => {
          const pos = nodePositions[node.id];
          if (pos) {
            // Determine node color
            let nodeColor = colors.primary;
            if (currentStepData.visitedNodes?.includes(node.id)) {
              nodeColor = colors.warning;
            }

            // Draw node
            p.fill(nodeColor);
            p.stroke(255);
            p.strokeWeight(scale(2));
            p.circle(pos.x, pos.y, nodeRadius * 2);

            // Draw value
            p.fill(255);
            p.noStroke();
            p.textSize(scale(12));
            p.textStyle(p.BOLD);
            p.text(node.value || node.id, pos.x, pos.y);
          }
        });
      };

      // Responsive Table Visualization
      const renderTable = () => {
        const data = visualizationData!;
        const rows = data.rows || 0;
        const columns = data.columns || 0;
        const tableData = data.data || [];
        const steps = data.steps || [];
        const currentStepData = steps[currentStep] || {};

        if (!rows || !columns || !tableData.length) {
          p.fill(colors.text);
          p.textSize(scale(16));
          p.text("Invalid table data", canvasWidth / 2, canvasHeight / 2);
          return;
        }

        const maxCellSize = scale(60);
        const minCellSize = scale(25);
        const cellSize = Math.max(minCellSize, Math.min(maxCellSize, 
          Math.min((canvasWidth - scale(100)) / columns, (canvasHeight - scale(150)) / rows)));
        const tableWidth = columns * cellSize;
        const tableHeight = rows * cellSize;
        const startX = (canvasWidth - tableWidth) / 2;
        const startY = (canvasHeight - tableHeight) / 2;

        // Draw message
        p.fill(colors.text);
        p.textSize(scale(16));
        p.textStyle(p.BOLD);
        p.text(currentStepData.message || "Table Visualization", canvasWidth / 2, scale(30));

        // Draw table cells
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < columns; col++) {
            const x = startX + col * cellSize;
            const y = startY + row * cellSize;
            
            // Check if cell was updated
            let cellColor = p.color(255);
            if (currentStepData.updatedCells) {
              const isUpdated = currentStepData.updatedCells.some(([r, c, _]) => r === row && c === col);
              if (isUpdated) {
                cellColor = p.color(168, 218, 220);
              }
            }

            // Draw cell
            p.fill(cellColor);
            p.stroke(colors.border);
            p.strokeWeight(scale(1));
            p.rect(x, y, cellSize, cellSize);

            // Draw value
            p.fill(colors.text);
            p.noStroke();
            p.textSize(Math.max(scale(8), cellSize * 0.25));
            p.text(tableData[row][col], x + cellSize / 2, y + cellSize / 2);
          }
        }
      };

      // Responsive Matrix Visualization
      const renderMatrix = () => {
        const data = visualizationData!;
        const matrix = data.matrix || [];
        const steps = data.steps || [];
        const currentStepData = steps[currentStep] || {};

        if (!matrix.length || !matrix[0].length) {
          p.fill(colors.text);
          p.textSize(scale(16));
          p.text("Empty matrix", canvasWidth / 2, canvasHeight / 2);
          return;
        }

        const rows = matrix.length;
        const cols = matrix[0].length;
        const maxCellSize = scale(60);
        const minCellSize = scale(20);
        const cellSize = Math.max(minCellSize, Math.min(maxCellSize,
          Math.min((canvasWidth - scale(100)) / cols, (canvasHeight - scale(150)) / rows)));
        const matrixWidth = cols * cellSize;
        const matrixHeight = rows * cellSize;
        const startX = (canvasWidth - matrixWidth) / 2;
        const startY = (canvasHeight - matrixHeight) / 2;

        // Draw message
        p.fill(colors.text);
        p.textSize(scale(16));
        p.textStyle(p.BOLD);
        p.text(currentStepData.message || "Matrix Visualization", canvasWidth / 2, scale(30));

        // Draw matrix cells
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const x = startX + col * cellSize;
            const y = startY + row * cellSize;
            
            // Check if cell is highlighted
            let cellColor = p.color(255);
            if (currentStepData.highlightedCells) {
              const isHighlighted = currentStepData.highlightedCells.some(([r, c]) => r === row && c === col);
              if (isHighlighted) {
                cellColor = colors.warning;
              }
            }

            // Draw cell
            p.fill(cellColor);
            p.stroke(colors.border);
            p.strokeWeight(scale(1));
            p.rect(x, y, cellSize, cellSize);

            // Draw value
            p.fill(colors.text);
            p.noStroke();
            p.textSize(Math.max(scale(8), cellSize * 0.25));
            p.text(matrix[row][col], x + cellSize / 2, y + cellSize / 2);
          }
        }
      };

      // Responsive Linked List Visualization
      const renderLinkedList = () => {
        const data = visualizationData!;
        const nodes = data.nodes || [];
        const steps = data.steps || [];
        const currentStepData = steps[currentStep] || {};

        if (!nodes.length) {
          p.fill(colors.text);
          p.textSize(scale(16));
          p.text("Empty linked list", canvasWidth / 2, canvasHeight / 2);
          return;
        }

        const nodeWidth = scale(60);
        const nodeHeight = scale(40);
        const spacing = scale(80);
        const totalWidth = nodes.length * nodeWidth + (nodes.length - 1) * spacing;
        const startX = (canvasWidth - totalWidth) / 2;
        const nodeY = canvasHeight / 2 - nodeHeight / 2;

        // Draw message
        p.fill(colors.text);
        p.textSize(scale(16));
        p.textStyle(p.BOLD);
        p.text(currentStepData.message || "Linked List Visualization", canvasWidth / 2, scale(30));

        // Draw nodes and arrows
        nodes.forEach((node, index) => {
          const x = startX + index * (nodeWidth + spacing);
          
          // Determine node color
          let nodeColor = colors.primary;
          if (currentStepData.highlightedNodes?.includes(node.id)) {
            nodeColor = colors.danger;
          }

          // Draw node
          p.fill(nodeColor);
          p.stroke(colors.border);
          p.strokeWeight(scale(2));
          p.rect(x, nodeY, nodeWidth, nodeHeight, scale(5));

          // Draw value
          p.fill(255);
          p.noStroke();
          p.textSize(scale(14));
          p.textStyle(p.BOLD);
          p.text(node.value, x + nodeWidth / 2, nodeY + nodeHeight / 2);

          // Draw arrow to next node
          if (node.next && index < nodes.length - 1) {
            p.stroke(colors.border);
            p.strokeWeight(scale(2));
            const arrowStartX = x + nodeWidth;
            const arrowEndX = x + nodeWidth + spacing - scale(10);
            const arrowY = nodeY + nodeHeight / 2;
            
            // Draw line
            p.line(arrowStartX, arrowY, arrowEndX, arrowY);
            
            // Draw arrowhead
            p.fill(colors.border);
            p.noStroke();
            p.triangle(arrowEndX, arrowY, arrowEndX - scale(8), arrowY - scale(4), arrowEndX - scale(8), arrowY + scale(4));
          }
        });
      };

      // Mouse interaction for pausing/resuming animation
      p.mousePressed = () => {
        if (visualizationData?.steps && visualizationData.steps.length > 0) {
          isAnimating = !isAnimating;
        }
      };

      // Keyboard interaction for step control
      p.keyPressed = () => {
        if (visualizationData?.steps) {
          if (p.key === 'ArrowRight' || p.key === ' ') {
            currentStep = (currentStep + 1) % visualizationData.steps.length;
          } else if (p.key === 'ArrowLeft') {
            currentStep = (currentStep - 1 + visualizationData.steps.length) % visualizationData.steps.length;
          } else if (p.key === 'r' || p.key === 'R') {
            currentStep = 0;
          }
        }
      };
    };

    p5InstanceRef.current = new p5(sketch, canvasRef.current);

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
      }
    };
  }, [visualizationData, dimensions]);

return (
  <div className="algorithm-visualizer w-full h-full flex flex-col">
    <div 
      ref={canvasRef} 
      className="
        flex-1
        w-full 
        min-h-[250px] 
        sm:min-h-[300px] 
        md:min-h-[400px] 
        lg:min-h-[500px]
        max-w-full
        border 
        border-gray-300 
        rounded-lg
        flex 
        justify-center 
        items-center
        overflow-hidden
        bg-white
        shadow-sm
        hover:shadow-md
        transition-shadow
        duration-200
      " 
    />
    <div className="
      mt-2 
      sm:mt-3 
      px-2 
      sm:px-4 
      text-xs 
      sm:text-sm 
      md:text-base
      text-gray-600 
      text-center 
      break-words
      leading-relaxed
      max-w-full
    ">
      <span className="inline-block">
        Controls: Click to pause/resume • Arrow keys or Space to step • R to reset
      </span>
    </div>
  </div>
);
}

export default AlgorithmVisualizer;
