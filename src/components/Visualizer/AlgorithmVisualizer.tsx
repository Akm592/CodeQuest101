/* eslint-disable */
// src/components/Visualizer/AlgorithmVisualizer.tsx

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

// Define interfaces for clarity
interface VisualizationStep {
  hashmap?: any;
  array?: any[]; // Allow different types in array
  pointers?: { [key: string]: number };
  highlightedIndices?: number[];
  message?: string;
  compare?: number[];
  swap?: number[];
  // Add other potential step properties if needed by other types
  visitedNodes?: string[];
  currentNode?: string;
  updatedCells?: [number, number, any][];
}

interface VisualizationData {
  visualizationType: string;
  array?: any[]; // Base array for array/sorting types
  steps?: VisualizationStep[];
  // Add specific properties for other types
  nodes?: any[]; // For graph/tree
  edges?: any[]; // For graph
  stack?: any[]; // For stack
  queue?: any[]; // For queue
  hashmap?: any; // For hashmap (adjust structure as needed)
  entries?: { key: string; value: any }[]; // Alternative hashmap structure
  rows?: number; // For table
  columns?: number; // For table
  data?: any[][]; // For table
}

interface AlgorithmVisualizerProps {
  visualizationData: VisualizationData | null; // Allow null
}

// --- D3 Simulation Node/Link types (adjust if needed) ---
interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  x?: number; // d3 Simulation properties
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphEdge {
  source: string | GraphNode;
  target: string | GraphNode;
  weight?: number; // Optional weight
}

interface TreeNode {
  id: string;
  value: any;
  children?: TreeNode[]; // d3.hierarchy expects children array
}


const AlgorithmVisualizer: React.FC<AlgorithmVisualizerProps> = ({ visualizationData }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  // Cleanup timeouts on visualizationData change or component unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((id) => clearTimeout(id));
      timeoutsRef.current = [];
    };
  }, []); // Run cleanup only on unmount

  useEffect(() => {
    // Clear previous timeouts before starting new animation
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];

    if (!visualizationData || !svgRef.current) {
      // Optionally clear SVG if data becomes null
      if (svgRef.current) {
        d3.select(svgRef.current).selectAll("*").remove();
      }
      return;
    }


    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous SVG content

    // Standard dimensions, adjust as needed
    const width = 800;
    const height = 400; // Increased height for pointers/indices
    const margin = { top: 60, right: 30, bottom: 60, left: 30 }; // Add margins
    const innerWidth = width - margin.left - margin.right;
    // const innerHeight = height - margin.top - margin.bottom; // Not always needed directly

    svg.attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`) // Use viewBox for responsiveness
      .style("overflow", "visible"); // Allow elements outside main bounds if needed


    // Main container group with margins
    const mainGroup = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Switch based on visualization type
    switch (visualizationData.visualizationType) {
      case "sorting":
        renderSortingAnimation(mainGroup, visualizationData, innerWidth, height - margin.top - margin.bottom);
        break;
      case "graph":
        // Graph might need full SVG area, adjust call if needed
        renderGraph(svg, visualizationData, width, height); // Pass full svg/dims
        break;
      case "tree":
        renderTree(mainGroup, visualizationData, innerWidth, height - margin.top - margin.bottom);
        break;
      case "stack":
        renderStack(mainGroup, visualizationData, innerWidth, height - margin.top - margin.bottom);
        break;
      case "queue":
        renderQueue(mainGroup, visualizationData, innerWidth, height - margin.top - margin.bottom);
        break;
      case "hashmap":
        renderHashMap(mainGroup, visualizationData, innerWidth);
        break;
      case "table":
        renderTable(mainGroup, visualizationData, innerWidth, height - margin.top - margin.bottom);
        break;
      // --- ADD CASE FOR ARRAY ---
      case "array":
        renderArray(mainGroup, visualizationData, innerWidth, height - margin.top - margin.bottom);
        break;
      default:
        console.warn("Unsupported visualization type:", visualizationData.visualizationType);
        renderUnsupported(svg, width, height); // Pass full svg/dims
    }
  }, [visualizationData]); // Rerun effect when data changes

  // ### Rendering Functions ###
  // Takes main group (g element) with margins applied

  // #### 1. Sorting Animation (Modified slightly for main group)
  const renderSortingAnimation = (
    mainGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: VisualizationData,
    width: number,
    height: number
  ): void => {
    const steps: VisualizationStep[] = data.steps || [];
    const initialArray = data.array || steps[0]?.array || [];
    if (!initialArray.length) {
      mainGroup.append("text").text("Empty array for sorting").attr("x", width / 2).attr("y", 50).attr("text-anchor", "middle");
      return;
    }

    const barWidth = Math.max(10, Math.min(50, width / initialArray.length * 0.6)); // Responsive width
    const barPadding = barWidth * 0.25;
    const totalWidth = initialArray.length * (barWidth + barPadding) - barPadding;
    const startX = (width - totalWidth) / 2; // Center the bars

    const maxValue = d3.max(initialArray as number[]);
    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue || 1]) // Handle empty or all-zero array
      .range([0, height - 50]); // Leave space below

    // Add step message area (outside the loop)
    const messageText = mainGroup.append("text")
      .attr("class", "step-message")
      .attr("x", width / 2)
      .attr("y", -20) // Position above the bars (within margin.top)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text(steps[0]?.message || "Initial State");

    const updateBars = (step: VisualizationStep): void => {
      const arr: any[] = step.array || [];
      const currentMaxValue = d3.max(arr as number[]);
      yScale.domain([0, currentMaxValue || 1]); // Update scale domain if max value changes

      messageText.text(step.message || ""); // Update message

      const bars = mainGroup.selectAll<SVGRectElement, number>("rect.bar")
        .data(arr, (_d, i) => i); // Key by index

      bars.exit().remove();

      const enterBars = bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (_d, i) => startX + i * (barWidth + barPadding))
        .attr("y", height) // Start from bottom for enter animation
        .attr("width", barWidth)
        .attr("height", 0)
        .attr("fill", "steelblue")
        .attr("rx", 3) // Rounded corners
        .attr("ry", 3);

      const mergedBars = enterBars.merge(bars);

      mergedBars.transition()
        .duration(500)
        .attr("x", (_d, i) => startX + i * (barWidth + barPadding))
        .attr("y", (d) => height - yScale(d))
        .attr("height", (d) => Math.max(0, yScale(d))) // Ensure non-negative height
        .attr("fill", (_d, i) => {
          if (step.swap?.includes(i)) return "red";
          if (step.compare?.includes(i)) return "orange";
          return "steelblue";
        });


      // Value labels above bars
      const valueLabels = mainGroup.selectAll<SVGTextElement, number>(".value-label")
        .data(arr, (_d, i) => i);

      valueLabels.exit().remove();

      const enterLabels = valueLabels.enter()
        .append("text")
        .attr("class", "value-label")
        .attr("x", (_d, i) => startX + i * (barWidth + barPadding) + barWidth / 2)
        .attr("y", height + 15) // Initial position below
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("opacity", 0); // Start invisible

      enterLabels.merge(valueLabels)
        .transition()
        .duration(500)
        .attr("x", (_d, i) => startX + i * (barWidth + barPadding) + barWidth / 2)
        .attr("y", (d) => height - yScale(d) - 8) // Position above the bar
        .text((d) => d)
        .attr("opacity", 1);
    };

    // Initial render
    if (steps.length > 0) {
      updateBars(steps[0]);
    } else if (initialArray.length > 0) {
      updateBars({ array: initialArray, message: "Initial State" }); // Render initial if no steps
    }

    // Animation loop
    steps.forEach((step, idx) => {
      // Skip first step if already rendered initially
      if (idx === 0 && initialArray.length > 0) return;
      const delay = (idx + (initialArray.length > 0 ? 0 : 1)) * 1000; // Adjust delay if rendering initial state separately
      const timeoutId = window.setTimeout(() => updateBars(step), delay);
      timeoutsRef.current.push(timeoutId as unknown as number);
    });
  };


  // #### 2. Graph Visualization (Keep similar, maybe adjust margins)
  const renderGraph = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, // Use full SVG for force layout
    data: VisualizationData,
    width: number,
    height: number
  ) => {
    svg.selectAll("*").remove(); // Clear specific SVG area if needed
    svg.attr("viewBox", `0 0 ${width} ${height}`).style("overflow", "visible");

    let nodes: GraphNode[] = (data.nodes || []).map((n: any) => ({ ...n })); // Clone nodes
    let edges: GraphEdge[] = (data.edges || []).map((e: any) => ({ ...e })); // Clone edges

    if (!nodes.length) {
      svg.append("text").attr("x", width / 2).attr("y", height / 2).text("No graph nodes provided").attr("text-anchor", "middle");
      return;
    }

    // Create a map for quick node lookup
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Resolve string IDs to node objects in edges
    edges = edges.map((link) => ({
      source: typeof link.source === 'string' ? nodeMap.get(link.source) || link.source : link.source,
      target: typeof link.target === 'string' ? nodeMap.get(link.target) || link.target : link.target,
      weight: link.weight
    })).filter(link =>
      // Filter out links where source or target couldn't be resolved to an object
      typeof link.source !== 'string' && typeof link.target !== 'string'
    ) as GraphEdge[]; // Type assertion after filtering


    const drag = d3
      .drag<SVGGElement, GraphNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null; // Clear fixed position
        d.fy = null;
      });

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphEdge>(edges)
          .id((d) => d.id) // Use node id
          .distance((d: any) => d.weight ? 100 + d.weight * 2 : 100) // Adjust distance based on weight
          .strength(0.5) // Adjust link strength
      )
      .force("charge", d3.forceManyBody().strength(-250)) // Adjust charge strength
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(35)); // Increase collision radius


    const linkGroup = svg.append("g").attr("class", "edges");
    const nodeGroup = svg.append("g").attr("class", "nodes");

    const link = linkGroup
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", "#aaa") // Lighter stroke
      .attr("stroke-opacity", 0.7)
      .attr("stroke-width", d => d.weight ? 1 + Math.sqrt(d.weight) : 2); // Width based on weight

    const node = nodeGroup
      .selectAll<SVGGElement, GraphNode>("g.node") // More specific selector
      .data(nodes, d => d.id) // Key nodes by ID
      .join("g")
      .attr("class", "node") // Add class for styling
      .call(drag as any); // Apply drag handler

    node.append("circle")
      .attr("r", 20)
      .attr("fill", "#69b3a2")
      .attr("stroke", "#fff") // White border
      .attr("stroke-width", 1.5);

    node
      .append("text")
      .text((d) => d.id) // Display node ID
      .attr("text-anchor", "middle")
      .attr("dy", ".35em") // Center vertically
      .attr("fill", "white")
      .style("font-size", "12px")
      .style("pointer-events", "none"); // Prevent text from interfering with drag

    // Ensure links are behind nodes
    linkGroup.lower();

    // Add step message area
    const messageText = svg.append("text")
      .attr("class", "graph-step-message")
      .attr("x", width / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text(data.steps?.[0]?.message || "Initial Graph State");


    simulation.on("tick", () => {
      // Boundary checks
      nodes.forEach((d) => {
        const radius = 20;
        d.x = Math.max(radius, Math.min(width - radius, d.x ?? width / 2));
        d.y = Math.max(radius, Math.min(height - radius, d.y ?? height / 2));
      });

      link
        .attr("x1", d => (d.source as GraphNode).x!) // Assert source/target are GraphNode after filtering
        .attr("y1", d => (d.source as GraphNode).y!)
        .attr("x2", d => (d.target as GraphNode).x!)
        .attr("y2", d => (d.target as GraphNode).y!);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // --- Animation Steps for Graph ---
    if (data.steps && data.steps.length > 0) {
      const updateStepVisuals = (step: VisualizationStep) => {
        messageText.text(step.message || "");

        node.select("circle")
          .transition().duration(300)
          .attr("fill", (d) => {
            if (step.currentNode === d.id) return "red"; // Highlight current node
            if (step.visitedNodes?.includes(d.id)) return "orange"; // Highlight visited nodes
            return "#69b3a2"; // Default color
          })
          .attr("r", (d) => step.currentNode === d.id ? 25 : 20); // Slightly larger current node

        // Add more visual changes based on step data (e.g., link colors)
      }

      // Initial state if first step has visuals
      if (data.steps?.[0]?.visitedNodes || data.steps?.[0]?.currentNode) {
        updateStepVisuals(data.steps[0]);
      }

      data.steps.forEach((step, idx) => {
        if (idx === 0 && (data.steps?.[0]?.visitedNodes || data.steps?.[0]?.currentNode)) return; // Skip if already rendered

        const timeoutId = setTimeout(() => {
          updateStepVisuals(step);
        }, (idx + 1) * 1500); // Longer delay for graph steps

        timeoutsRef.current.push(timeoutId as unknown as number);
      });
    }
  };

  // #### 3. Tree Visualization (Using d3.hierarchy)
  const renderTree = (
    mainGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: VisualizationData,
    width: number,
    height: number
  ) => {
    const rawNodes: any[] = data.nodes || []; // Expecting nodes with id, value, children (ids)
    if (!rawNodes.length) {
      mainGroup.append("text").text("No tree data provided").attr("x", width / 2).attr("y", 50).attr("text-anchor", "middle");
      return;
    }

    // Helper to build the hierarchy structure d3 needs
    const buildHierarchy = (nodes: any[]): TreeNode | null => {
      const nodeMap = new Map<string, TreeNode>();
      let rootId: string | null = null;
      const childIds = new Set<string>();

      // First pass: create nodes and track children
      nodes.forEach(node => {
        if (!node.id) {
          console.warn("Node missing ID:", node);
          return; // Skip nodes without ID
        }
        nodeMap.set(node.id, { id: node.id, value: node.value ?? node.id, children: [] });
        if (node.children) {
          node.children.forEach((childId: string) => childIds.add(childId));
        }
      });

      // Second pass: link children and find root
      nodes.forEach(node => {
        if (!node.id || !nodeMap.has(node.id)) return; // Skip missing or invalid nodes

        if (node.children) {
          node.children.forEach((childId: string) => {
            const childNode = nodeMap.get(childId);
            const parentNode = nodeMap.get(node.id);
            if (childNode && parentNode) {
              parentNode.children?.push(childNode); // Add child object
            } else {
              console.warn(`Could not link child ${childId} to parent ${node.id}`);
            }
          });
        }
        // Potential root is one not listed as a child of any other node
        if (!childIds.has(node.id)) {
          // Basic root finding (might need improvement for multi-root forests)
          if (rootId === null) {
            rootId = node.id;
          } else {
            console.warn("Multiple potential root nodes found. Using the first one:", rootId);
          }
        }
      });

      if (rootId === null && nodes.length > 0) {
        console.warn("Could not determine root node. Using first node as root.");
        rootId = nodes[0]?.id; // Fallback: use the first node if no clear root
      }


      return rootId ? nodeMap.get(rootId) || null : null;
    };


    const rootData = buildHierarchy(rawNodes);

    if (!rootData) {
      mainGroup.append("text").attr("x", 10).attr("y", 30).text("Error processing tree data or no root found.");
      return;
    }

    const root = d3.hierarchy(rootData, d => d.children); // Use children accessor

    // Use d3.tree layout
    const treeLayout = d3.tree<TreeNode>().size([width, height]); // Use inner dimensions
    treeLayout(root);


    // --- Draw Links ---
    mainGroup.append("g")
    .attr("class", "tree-links")
    .selectAll<SVGPathElement, d3.HierarchyLink<TreeNode>>("path")
    .data(root.links())
    .join("path")
    .attr("fill", "none")
    .attr("stroke", "#ccc")
    .attr("stroke-width", 1.5)
    .attr("d", d => {
      // Create a link generator
      const linkGenerator = d3.linkVertical();
      
      // Ensure x and y coordinates exist with default values if undefined
      const source = {x: d.source.x || 0, y: d.source.y || 0};
      const target = {x: d.target.x || 0, y: d.target.y || 0};
      
      // Return the path with source and target as tuples [number, number]
      return linkGenerator({source: [source.x, source.y], target: [target.x, target.y]});
    });
  
    
  
    // --- Draw Nodes ---
    const nodeGroup = mainGroup.append("g")
      .attr("class", "tree-nodes")
      .selectAll<SVGGElement, d3.HierarchyPointNode<TreeNode>>("g")
      .data(root.descendants()) // Get all nodes in hierarchy
      .join("g")
      .attr("transform", d => `translate(${d.x},${d.y})`); // Position node group

    nodeGroup.append("circle")
      .attr("r", 20) // Smaller radius
      .attr("fill", "#69b3a2")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    nodeGroup.append("text")
      .text(d => d.data.value) // Display node value
      .attr("dy", "0.35em") // Vertical centering
      .attr("text-anchor", "middle") // Horizontal centering
      .attr("fill", "white")
      .style("font-size", "12px")
      .style("font-weight", "bold");

    // --- Tree Animation Steps (Placeholder - Adapt based on needed step data) ---
    if (data.steps && data.steps.length > 0) {
      const messageText = mainGroup.append("text")
        .attr("class", "tree-step-message")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px");

      const updateTreeStep = (step: VisualizationStep) => {
        messageText.text(step.message || "");
        // Example: Highlight visited nodes
        nodeGroup.select("circle")
          .transition().duration(300)
          .attr("fill", d => step.visitedNodes?.includes(d.data.id) ? "orange" : "#69b3a2");
      }

      // Initial state
      updateTreeStep(data.steps[0]);

      data.steps.forEach((step, idx) => {
        if (idx === 0) return; // Skip initial
        const timeoutId = setTimeout(() => updateTreeStep(step), (idx + 1) * 1000);
        timeoutsRef.current.push(timeoutId as unknown as number);
      });
    }

  };

  // #### 4. Stack Visualization
  const renderStack = (
    mainGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: VisualizationData,
    width: number,
    height: number
  ): void => {
    // Prefer explicit stack property, fallback to array
    const stack: any[] = data.stack || data.array || [];
    const steps: VisualizationStep[] = data.steps || [];

    const boxHeight = 40;
    const boxWidth = 100;
    const spacing = 5;
    const stackBaseY = height - 10; // Start drawing from bottom up
    const stackCenterX = width / 2;

    // Add step message area
    const messageText = mainGroup.append("text")
      .attr("class", "step-message")
      .attr("x", stackCenterX)
      .attr("y", -20) // Position above
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text(steps[0]?.message || (stack.length ? "Initial Stack" : "Empty Stack"));

    // Function to draw the stack at a given state
    const drawStackState = (currentStack: any[], message?: string): void => {
      messageText.text(message || "");

      const stackItems = mainGroup.selectAll("g.stack-item")
        .data(currentStack, (_d, i) => i); // Key by index

      // Remove items that are popped
      stackItems.exit()
        .transition().duration(300)
        .attr("transform", `translate(${stackCenterX}, ${stackBaseY + boxHeight})`) // Animate downwards
        .style("opacity", 0)
        .remove();

      // Add new items (pushed)
      const enterGroup = stackItems.enter()
        .append("g")
        .attr("class", "stack-item")
        // Initial position below the view for animation
        .attr("transform", `translate(${stackCenterX - boxWidth / 2}, ${stackBaseY + boxHeight})`)
        .style("opacity", 0);

      enterGroup.append("rect")
        .attr("width", boxWidth)
        .attr("height", boxHeight)
        .attr("fill", "#69b3a2")
        .attr("stroke", "#234d45")
        .attr("rx", 5)
        .attr("ry", 5);

      enterGroup.append("text")
        .attr("class", "stack-text")
        .attr("x", boxWidth / 2)
        .attr("y", boxHeight / 2)
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("fill", "white")
        .text(d => d);

      // Update existing and newly entered items to their correct position
      const mergedGroup = enterGroup.merge(stackItems as any); // Merge enter and update selections

      mergedGroup.select('text').text(d => d); // Update text in case value changed (unlikely for stack)

      mergedGroup.transition().duration(500)
        .attr("transform", (_d, i) => `translate(${stackCenterX - boxWidth / 2}, ${stackBaseY - (i + 1) * (boxHeight + spacing)})`)
        .style("opacity", 1);

      // Update Top indicator
      mainGroup.selectAll(".stack-top-indicator").remove();
      if (currentStack.length > 0) {
        mainGroup.append("text")
          .attr("class", "stack-top-indicator")
          .attr("x", stackCenterX + boxWidth / 2 + 10) // Position to the right of the top element
          .attr("y", stackBaseY - (currentStack.length * (boxHeight + spacing)) + boxHeight / 2)
          .attr("text-anchor", "start")
          .attr("dy", "0.35em")
          .text("← Top");
      }
    };


    // Initial Draw or First Step
    const initialState = steps.length > 0 ? (steps[0].array || []) : stack;
    drawStackState(initialState, steps[0]?.message || (initialState.length ? "Initial Stack" : "Empty Stack"));

    // Animation loop for subsequent steps
    steps.forEach((step, idx) => {
      if (idx === 0) return; // Already drew the first step/initial state
      const timeoutId = window.setTimeout(() => {
        // Use step.array if provided, otherwise assume no change (only message)
        // In a real scenario, step should ALWAYS contain the state (`step.stack` or `step.array`)
        drawStackState(step.array || initialState /* fallback might be wrong */, step.message);
      }, idx * 1000); // Delay subsequent steps
      timeoutsRef.current.push(timeoutId);
    });
  };


  // #### 5. Queue Visualization
  const renderQueue = (
    mainGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: VisualizationData,
    width: number,
    height: number
  ) => {
    // Prefer explicit queue property, fallback to array or elements
    const queue: any[] = data.queue || data.array || (data as any).elements || [];
    const steps: VisualizationStep[] = data.steps || [];

    const boxHeight = 40;
    const boxWidth = 80;
    const spacing = 10;
    const queueStartY = height / 2 - boxHeight / 2; // Center vertically
    const queueStartX = spacing;

    // Add step message area
    const messageText = mainGroup.append("text")
      .attr("class", "step-message")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text(steps[0]?.message || (queue.length ? "Initial Queue" : "Empty Queue"));

    // Function to draw the queue at a given state
    const drawQueueState = (currentQueue: any[], message?: string): void => {
      messageText.text(message || "");

      const queueItems = mainGroup.selectAll("g.queue-item")
        .data(currentQueue, (_d, i) => i); // Key by index or a unique ID if available

      // Items being removed (dequeued) - animate off to the left
      queueItems.exit()
        .transition().duration(500)
        .attr("transform", `translate(${-boxWidth * 2}, ${queueStartY})`)
        .style("opacity", 0)
        .remove();

      // Items being added (enqueued) - animate in from the right
      const enterGroup = queueItems.enter()
        .append("g")
        .attr("class", "queue-item")
        .attr("transform", `translate(${width + boxWidth}, ${queueStartY})`) // Start off-screen right
        .style("opacity", 0);

      enterGroup.append("rect")
        .attr("width", boxWidth)
        .attr("height", boxHeight)
        .attr("fill", "#69b3a2")
        .attr("stroke", "#234d45")
        .attr("rx", 3).attr("ry", 3);

      enterGroup.append("text")
        .attr("class", "queue-text")
        .attr("x", boxWidth / 2)
        .attr("y", boxHeight / 2)
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("fill", "white")
        .text(d => d);

      // Update existing and newly entered items to their correct position
      const mergedGroup = enterGroup.merge(queueItems as any);

      mergedGroup.select('text').text(d => d); // Update text if needed

      mergedGroup.transition().duration(500)
        .attr("transform", (_d, i) => `translate(${queueStartX + i * (boxWidth + spacing)}, ${queueStartY})`)
        .style("opacity", 1);

      // Update Front/Rear indicators
      mainGroup.selectAll(".queue-indicator").remove();
      if (currentQueue.length > 0) {
        // Front indicator
        mainGroup.append("text")
          .attr("class", "queue-indicator")
          .attr("x", queueStartX + boxWidth / 2)
          .attr("y", queueStartY - 15) // Above the first element
          .attr("text-anchor", "middle")
          .text("Front ↓");
        // Rear indicator
        mainGroup.append("text")
          .attr("class", "queue-indicator")
          .attr("x", queueStartX + (currentQueue.length - 1) * (boxWidth + spacing) + boxWidth / 2)
          .attr("y", queueStartY + boxHeight + 15) // Below the last element
          .attr("text-anchor", "middle")
          .text("↑ Rear");
      }
    };

    // Initial Draw or First Step
    const initialState = steps.length > 0 ? (steps[0].array || []) : queue;
    drawQueueState(initialState, steps[0]?.message || (initialState.length ? "Initial Queue" : "Empty Queue"));

    // Animation loop for subsequent steps
    steps.forEach((step, idx) => {
      if (idx === 0) return;
      const timeoutId = window.setTimeout(() => {
        // Assume step.array or step.queue contains the state
        const currentStepState = step.array || (step as any).queue || initialState;
        drawQueueState(currentStepState, step.message);
      }, idx * 1000);
      timeoutsRef.current.push(timeoutId);
    });
  };


  // #### 6. HashMap Visualization
  const renderHashMap = (
    mainGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: VisualizationData,
    width: number
  ): void => {
    // Use entries if provided, otherwise try to convert hashmap object
    let entries: { key: string; value: any }[] = [];
    if (data.entries) {
      entries = data.entries;
    } else if (data.hashmap && typeof data.hashmap === 'object') {
      entries = Object.entries(data.hashmap).map(([key, value]) => ({ key, value }));
    }
    const steps: VisualizationStep[] = data.steps || [];


    const bucketHeight = 40;
    const bucketWidth = 150;
    const spacingY = 10;
    const spacingX = 10; // Add X spacing for grid layout
    const itemsPerRow = Math.floor(width / (bucketWidth + spacingX));

    // Add step message area
    const messageText = mainGroup.append("text")
      .attr("class", "step-message")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text(steps[0]?.message || (entries.length ? "Initial HashMap" : "Empty HashMap"));


    const drawHashMapState = (currentEntries: { key: string; value: any }[], message?: string) => {
      messageText.text(message || "");

      const mapItems = mainGroup.selectAll<SVGGElement, { key: string; value: any }>("g.map-item")
        .data(currentEntries, d => d.key); // Key by entry key

      mapItems.exit()
        .transition().duration(300)
        .style("opacity", 0)
        .remove();

      const enterGroup = mapItems.enter()
        .append("g")
        .attr("class", "map-item")
        .style("opacity", 0);

      enterGroup.append("rect")
        .attr("width", bucketWidth)
        .attr("height", bucketHeight)
        .attr("fill", "#69b3a2")
        .attr("stroke", "#234d45")
        .attr("rx", 3).attr("ry", 3);

      enterGroup.append("text")
        .attr("class", "map-text")
        .attr("x", bucketWidth / 2)
        .attr("y", bucketHeight / 2)
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("fill", "white")
        .style("font-size", "12px");


      const mergedGroup = enterGroup.merge(mapItems as any);

      // Update text content for existing/entering items
      mergedGroup.select("text")
        .text(d => `${d.key}: ${d.value}`);

      // Update positions with transition
      mergedGroup.transition().duration(500)
        .attr("transform", (_d, i) => {
          const col = i % itemsPerRow;
          const row = Math.floor(i / itemsPerRow);
          return `translate(${col * (bucketWidth + spacingX)}, ${row * (bucketHeight + spacingY)})`;
        })
        .style("opacity", 1);
    }

    // Initial Draw or First Step
    let initialStateEntries: { key: string; value: any }[] = [];
    if (steps.length > 0 && steps[0].hashmap) {
      initialStateEntries = Object.entries(steps[0].hashmap).map(([key, value]) => ({ key, value }));
    } else {
      initialStateEntries = entries;
    }
    drawHashMapState(initialStateEntries, steps[0]?.message || (initialStateEntries.length ? "Initial HashMap" : "Empty HashMap"));


    // Animation loop for subsequent steps
    steps.forEach((step, idx) => {
      if (idx === 0) return;
      const timeoutId = window.setTimeout(() => {
        let currentStepEntries: { key: string; value: any }[] = [];
        if (step.hashmap) {
          currentStepEntries = Object.entries(step.hashmap).map(([key, value]) => ({ key, value }));
        } else {
          currentStepEntries = initialStateEntries; // Fallback might be wrong
        }
        drawHashMapState(currentStepEntries, step.message);
      }, idx * 1000);
      timeoutsRef.current.push(timeoutId);
    });
  };


  // #### 7. Table Visualization
  const renderTable = (
    mainGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: VisualizationData,
    width: number,
    height: number
  ): void => {
    const rows: number = data.rows || 0;
    const columns: number = data.columns || 0;
    const tableData: any[][] = data.data || [];
    const steps: VisualizationStep[] = data.steps || [];

    if (!rows || !columns || !tableData.length || tableData.length !== rows || tableData[0].length !== columns) {
      mainGroup.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .text("Invalid or inconsistent table data");
      return;
    }

    // Calculate cell size based on available space
    const maxCellWidth = Math.max(40, Math.floor(width / columns) - 5);
    const maxCellHeight = Math.max(30, Math.floor((height - 30) / rows) - 5); // Leave space for message
    const cellWidth = Math.min(maxCellWidth, maxCellHeight, 60); // Limit max size
    const cellHeight = cellWidth;

    const tableWidth = columns * cellWidth;
    const startX = (width - tableWidth) / 2; // Center table
    const startY = 0; // Start drawing from top of group

    const tableGroup = mainGroup.append("g")
      .attr("transform", `translate(${startX}, ${startY})`);


    // Flatten data for D3 join
    const cells: { rowIndex: number; colIndex: number; value: any }[] = [];
    tableData.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        cells.push({ rowIndex, colIndex, value });
      });
    });

    const cellGroups = tableGroup
      .selectAll<SVGGElement, { rowIndex: number; colIndex: number; value: any }>("g.cell")
      .data(cells, d => `${d.rowIndex}-${d.colIndex}`) // Key by row-col
      .join("g")
      .attr("class", "cell")
      .attr("transform", d => `translate(${d.colIndex * cellWidth}, ${d.rowIndex * cellHeight})`);

    cellGroups.append("rect")
      .attr("width", cellWidth)
      .attr("height", cellHeight)
      .attr("fill", "white")
      .attr("stroke", "#ccc");

    cellGroups.append("text")
      .attr("class", d => `cell-text row-${d.rowIndex} col-${d.colIndex}`)
      .attr("x", cellWidth / 2)
      .attr("y", cellHeight / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .style("font-size", `${Math.max(10, cellWidth * 0.3)}px`) // Adjust font size
      .text(d => d.value);
    // Add styles for header rows/cols if needed

    // Add step message area
    const messageText = mainGroup.append("text")
      .attr("class", "step-message")
      .attr("x", width / 2)
      .attr("y", -20) // Above the table
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text(steps[0]?.message || "Initial Table");

    // --- Animation Steps ---
    const updateTableStep = (step: VisualizationStep) => {
      messageText.text(step.message || "");

      // Reset highlights/colors first
      tableGroup.selectAll("rect")
        .transition().duration(200)
        .attr("fill", "white");
      tableGroup.selectAll("text")
        .transition().duration(200)
        .attr("fill", "black");


      // Apply updates
      step.updatedCells?.forEach(([row, col, newValue]) => {
        tableGroup.select(`.cell-text.row-${row}.col-${col}`)
          .text(newValue); // Update text directly
        // Optionally highlight the updated cell
        tableGroup.select(`g.cell:has(.cell-text.row-${row}.col-${col}) rect`) // Find parent g and then rect
          .transition().duration(300)
          .attr("fill", "#a8dadc"); // Highlight color
      });

      // Add other highlights if provided (e.g., step.highlightedCells)
      // step.highlightedCells?.forEach(([row, col]) => { ... });
    }

    // Initial state (apply first step visuals if any)
    if (steps.length > 0) {
      updateTableStep(steps[0]);
    }


    steps.forEach((step, idx) => {
      if (idx === 0) return; // Skip initial
      const timeoutId: number = window.setTimeout(() => {
        updateTableStep(step);
      }, idx * 1000);
      timeoutsRef.current.push(timeoutId);
    });
  };

  // #### 8. Array Visualization (NEW)
  const renderArray = (
    mainGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: VisualizationData,
    width: number,
    height: number
  ): void => {
    const array: any[] = data.array || [];
    const steps: VisualizationStep[] = data.steps || [];

    if (!array.length) {
      mainGroup.append("text").text("Empty array").attr("x", width / 2).attr("y", 50).attr("text-anchor", "middle");
      return;
    }

    const boxHeight = 50;
    const boxWidth = Math.max(40, Math.min(80, width / array.length * 0.7)); // Responsive width
    const spacing = 10;
    const totalArrayWidth = array.length * (boxWidth + spacing) - spacing;
    const startX = (width - totalArrayWidth) / 2; // Center the array
    const arrayY = height / 2 - boxHeight / 2 - 20; // Position array vertically, leave space for pointers

    // Add step message area
    const messageText = mainGroup.append("text")
      .attr("class", "step-message")
      .attr("x", width / 2)
      .attr("y", -20) // Position above
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text(steps[0]?.message || "Initial Array State");

    // Draw Array Structure (Boxes, Values, Indices)
    const arrayGroup = mainGroup.append("g").attr("class", "array-structure");

    const arrayBoxes = arrayGroup.selectAll("g.array-box")
      .data(array)
      .join("g")
      .attr("class", "array-box")
      .attr("transform", (_d, i) => `translate(${startX + i * (boxWidth + spacing)}, ${arrayY})`);

    // Box rectangle
    arrayBoxes.append("rect")
      .attr("width", boxWidth)
      .attr("height", boxHeight)
      .attr("fill", "steelblue")
      .attr("stroke", "#2c3e50")
      .attr("rx", 3).attr("ry", 3);

    // Value text inside box
    arrayBoxes.append("text")
      .attr("class", "value-text")
      .attr("x", boxWidth / 2)
      .attr("y", boxHeight / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("fill", "white")
      .style("font-size", "14px")
      .text(d => d);

    // Index text below box
    arrayBoxes.append("text")
      .attr("class", "index-text")
      .attr("x", boxWidth / 2)
      .attr("y", boxHeight + 15) // Position below
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text((_d, i) => i); // Display index


    // Pointer Group (for animating pointers)
    const pointerGroup = mainGroup.append("g").attr("class", "pointers");

    // Function to update visuals for a given step
    const updateArrayStep = (step: VisualizationStep) => {
      messageText.text(step.message || "");

      const pointersData = step.pointers ? Object.entries(step.pointers) : []; // [key, index] pairs

      const pointers = pointerGroup.selectAll<SVGTextElement, [string, number]>("text.pointer")
        .data(pointersData, d => d[0]); // Key pointers by their name (e.g., "left")

      // Remove old pointers
      pointers.exit().transition().duration(300).style("opacity", 0).remove();

      // Add new pointers
      const enterPointers = pointers.enter()
        .append("text")
        .attr("class", "pointer")
        .attr("y", arrayY - 15) // Position above the array boxes
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("fill", "#e74c3c") // Pointer color
        .style("opacity", 0); // Start invisible

      // Update existing and new pointers
      enterPointers.merge(pointers)
        .text(d => d[0]) // Pointer name (e.g., "L", "R", "i")
        .transition().duration(500)
        .attr("x", d => {
          const index = d[1]; // Get the index the pointer points to
          // Calculate center x of the target box
          return startX + index * (boxWidth + spacing) + boxWidth / 2;
        })
        .style("opacity", 1);


      // Handle Highlights
      arrayBoxes.select("rect") // Select the rectangles within the boxes
        .transition().duration(300)
        .attr("fill", (_d, i) => {
          if (step.highlightedIndices?.includes(i)) {
            return "orange"; // Highlight color
          }
          return "steelblue"; // Default color
        });
    };


    // Initial State (apply first step visuals)
    if (steps.length > 0) {
      updateArrayStep(steps[0]);
    } else {
      // Draw pointers if initial state defined them (less common)
      // updateArrayStep({ pointers: data.pointers || {}, message: "Initial Array" });
    }

    // Animate subsequent steps
    steps.forEach((step, idx) => {
      if (idx === 0) return; // Skip first step if already rendered
      const timeoutId = window.setTimeout(() => {
        updateArrayStep(step);
      }, idx * 1000); // Adjust timing as needed
      timeoutsRef.current.push(timeoutId);
    });
  };


  // #### Fallback for Unsupported Types
  const renderUnsupported = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    width: number,
    height: number
  ): void => {
    svg.selectAll("*").remove(); // Clear first
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .text("Unsupported or Invalid Visualization Data");
  };


  // --- Component Return ---
  return (
    <div className="w-full h-[450px] max-w-4xl mx-auto p-2 bg-gray-50 rounded-lg shadow-inner overflow-hidden">
      {/* Increased height */}
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
};

export default AlgorithmVisualizer;