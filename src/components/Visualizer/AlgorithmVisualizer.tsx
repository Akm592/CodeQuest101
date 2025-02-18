// src/components/chatbot/AlgorithmVisualizer.tsx
import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

interface AlgorithmVisualizerProps {
  visualizationData: any; // Type this more specifically based on your data structure
}

const AlgorithmVisualizer: React.FC<AlgorithmVisualizerProps> = ({
  visualizationData,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  // Ref to store timeouts for bubble sort animation cleanup
  const timeoutsRef = useRef<number[]>([]);

  // Cleanup any pending timeouts when visualizationData changes or on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutsRef.current = [];
    };
  }, [visualizationData]);

  useEffect(() => {
    if (!visualizationData || !svgRef.current) return;

    // Clear any pending timeouts from previous animations
    timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutsRef.current = [];

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous visualization

    if (
      visualizationData.visualizationType === "sorting" &&
      visualizationData.algorithm === "bubble_sort"
    ) {
      renderBubbleSort(svg, visualizationData);
    } else if (
      visualizationData.visualizationType === "tree" &&
      visualizationData.structure === "binary_tree"
    ) {
      renderBinaryTree(svg, visualizationData);
    }
    // ... add more conditions for other visualization types ...
  }, [visualizationData]);

  const renderBubbleSort = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    data: any
  ) => {
    // --- D3.js Bubble Sort Visualization Logic ---
    const steps = data.steps;
    const width = 600;
    const height = 200;
    const barWidth = 50;
    const barPadding = 10;

    svg.attr("width", width).attr("height", height);

    const updateBars = (stepData: any) => {
      // Use a key function (here, using the index) for proper data binding
      const bars = svg
        .selectAll("rect")
        .data(stepData.array, (_d: any, i: number) => i);

      bars.exit().remove();

      bars
        .enter()
        .append("rect")
        .attr("x", (d, i) => i * (barWidth + barPadding))
        .attr("y", height) // Start from bottom and animate up
        .attr("width", barWidth)
        .attr("height", 0)
        .attr("fill", "steelblue")
        .merge(bars)
        .transition()
        .duration(750)
        .attr("x", (d, i) => i * (barWidth + barPadding))
        .attr("y", (d: number) => height - d * 20) // Scale height based on value (example scaling)
        .attr("height", (d: number) => d * 20);

      // Display step message (optional)
      svg.selectAll(".message").remove();
      svg
        .append("text")
        .attr("class", "message")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .text(stepData.message);
    };

    // Animate through steps (simple sequential animation)
    steps.forEach((stepData: any, index: number) => {
      const timeoutId = window.setTimeout(() => {
        updateBars(stepData);
      }, index * 1500); // Delay between steps
      timeoutsRef.current.push(timeoutId);
    });
  };

  const renderBinaryTree = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    data: any
  ) => {
    // --- D3.js Binary Tree Visualization Logic ---
    const nodes = data.nodes;
    const width = 600;
    const height = 400;

    svg.attr("width", width).attr("height", height);

    const treeLayout = d3.tree().size([height, width - 100]);

    // Build the hierarchy by mapping child IDs to full node objects
    const root = d3.hierarchy(nodes[0], (d: any) => {
      const node = nodes.find((n: any) => n.id === d.id);
      return node && Array.isArray(node.children)
        ? node.children.map((childId: any) =>
            nodes.find((n: any) => n.id === childId)
          )
        : [];
    });

    treeLayout(root);

    // Draw links
    svg
      .selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr(
        "d",
        d3
          .linkVertical()
          .x((d: any) => d.y)
          .y((d: any) => d.x)
      );

    // Draw nodes
    const node = svg
      .selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.y},${d.x})`);

    node
      .append("circle")
      .attr("r", 20)
      .attr("fill", "lightgreen")
      .attr("stroke", "green")
      .attr("stroke-width", 2);

    node
      .append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      // Use the node's value if available; otherwise fall back to the node id
      .text((d) => d.data.value || d.data.id);
  };

  return (
    <div className="algorithm-visualizer">
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default AlgorithmVisualizer;
