import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const AlgorithmVisualizer = ({ visualizationData }) => {
  const svgRef = useRef(null);
  const timeoutsRef = useRef([]);

  // Clean up any timeouts when visualizationData changes or on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((id) => clearTimeout(id));
      timeoutsRef.current = [];
    };
  }, [visualizationData]);

  useEffect(() => {
    if (!visualizationData || !svgRef.current) return;

    // Clear previous timeouts and svg content
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 400;
    svg.attr("width", width).attr("height", height);

    switch (visualizationData.visualizationType) {
      case "sorting":
        renderSortingAnimation(svg, visualizationData, width, height);
        break;
      case "graph":
        renderGraph(svg, visualizationData, width, height);
        break;
      case "tree":
        renderTree(svg, visualizationData, width, height);
        break;
      case "stack":
        renderStack(svg, visualizationData, width, height);
        break;
      case "queue":
        renderQueue(svg, visualizationData, width, height);
        break;
      case "hashmap":
        renderHashMap(svg, visualizationData, width, height);
        break;
      default:
        renderUnsupported(svg, width, height);
    }
  }, [visualizationData]);

  // ----------------- Renderers -----------------

  // 1. Sorting Animation
  const renderSortingAnimation = (svg, data, width, height) => {
    const steps = data.steps || [];
    const barWidth = 40;
    const barPadding = 10;

    const updateBars = (step) => {
      const arr = step.array || [];
      const maxValue = Math.max(...arr);
      const scale = d3
        .scaleLinear()
        .domain([0, maxValue])
        .range([0, height - 100]);

      const bars = svg.selectAll("rect").data(arr);
      bars.exit().remove();
      bars
        .enter()
        .append("rect")
        .merge(bars)
        .attr("x", (d, i) => i * (barWidth + barPadding) + 50)
        .attr("y", (d) => height - scale(d) - 50)
        .attr("width", barWidth)
        .attr("height", (d) => scale(d))
        .attr("fill", "steelblue")
        .transition()
        .duration(500);

      svg
        .selectAll(".value-label")
        .data(arr)
        .join("text")
        .attr("class", "value-label")
        .attr("x", (d, i) => i * (barWidth + barPadding) + 50 + barWidth / 2)
        .attr("y", (d) => height - scale(d) - 55)
        .attr("text-anchor", "middle")
        .text((d) => d);

      svg.selectAll(".step-message").remove();
      svg
        .append("text")
        .attr("class", "step-message")
        .attr("x", width / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .text(step.message);
    };

    steps.forEach((step, idx) => {
      const timeoutId = window.setTimeout(() => updateBars(step), idx * 1000);
      timeoutsRef.current.push(timeoutId);
    });
  };

  // 2. Graph Rendering & Traversal Animation
const renderGraph = (svg, data, width, height) => {
  // Clear any existing content
  svg.selectAll("*").remove();

  // Set up the SVG
  svg.attr("viewBox", `0 0 ${width} ${height}`).style("overflow", "visible");

  let nodes = data.nodes || [];
  let edges = data.edges || [];

  // Convert string IDs to object references
  edges = edges.map((link) => ({
    source:
      typeof link.source === "string"
        ? nodes.find((n) => n.id === link.source)
        : link.source,
    target:
      typeof link.target === "string"
        ? nodes.find((n) => n.id === link.target)
        : link.target,
  }));

  // Create drag behavior
  const drag = d3
    .drag()
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
      d.fx = null;
      d.fy = null;
    });

  // Create force simulation
  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink(edges)
        .id((d) => d.id)
        .distance(100)
    )
    .force("charge", d3.forceManyBody().strength(-200))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(30));

  // Create container groups
  const linkGroup = svg.append("g").attr("class", "edges");
  const nodeGroup = svg.append("g").attr("class", "nodes");

  // Create edges
  const link = linkGroup
    .selectAll("line")
    .data(edges)
    .join("line")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .attr("stroke-width", 2);

  // Create nodes
  const node = nodeGroup.selectAll("g").data(nodes).join("g").call(drag);

  // Add circles to nodes
  node.append("circle").attr("r", 20).attr("fill", "#69b3a2");

  // Add labels to nodes
  node
    .append("text")
    .text((d) => d.id)
    .attr("text-anchor", "middle")
    .attr("dy", ".35em")
    .attr("fill", "white");

  // Ensure edges are behind nodes
  linkGroup.lower();

  // Update positions on each tick
  simulation.on("tick", () => {
    // Constrain nodes within boundaries
    nodes.forEach((d) => {
      d.x = Math.max(20, Math.min(width - 20, d.x));
      d.y = Math.max(20, Math.min(height - 20, d.y));
    });

    // Update link positions
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    // Update node positions
    node.attr("transform", (d) => `translate(${d.x},${d.y})`);
  });

  // Handle animation steps
  if (data.steps && data.steps.length > 0) {
    const timeoutsRef = [];

    data.steps.forEach((step, idx) => {
      const timeoutId = setTimeout(() => {
        // Reset colors
        node.select("circle").attr("fill", "#69b3a2");

        // Highlight visited nodes
        if (step.visitedNodes?.length > 0) {
          node
            .select("circle")
            .filter((d) => step.visitedNodes.includes(d.id))
            .attr("fill", "orange");
        }

        // Highlight current node
        if (step.currentNode) {
          node
            .select("circle")
            .filter((d) => d.id === step.currentNode)
            .attr("fill", "red");
        }

        // Update step message
        svg.selectAll(".graph-step-message").remove();
        svg
          .append("text")
          .attr("class", "graph-step-message")
          .attr("x", width / 2)
          .attr("y", 30)
          .attr("text-anchor", "middle")
          .text(step.message || "");
      }, idx * 1000);

      timeoutsRef.push(timeoutId);
    });

    // Cleanup function
    return () => timeoutsRef.forEach((id) => clearTimeout(id));
  }
};

  // 3. Tree Visualization (Handles nested or flat structures)
const renderTree = (svg, data, width, height) => {
  // Validate input data
  if (!data || typeof data !== "object") {
    console.error("Invalid data provided to renderTree:", data);
    return;
  }

  // Extract nodes from different possible data structures
  let nodes;
  if (data.visualization_data && data.visualization_data.nodes) {
    nodes = data.visualization_data.nodes;
  } else if (data.nodes) {
    nodes = data.nodes;
  } else if (Array.isArray(data)) {
    nodes = data;
  } else {
    console.error("No valid nodes data found in:", data);
    svg
      .append("text")
      .attr("x", 10)
      .attr("y", 30)
      .text("Invalid tree data structure");
    return;
  }

  const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Transform adjacency list to hierarchical structure
  const transformToHierarchy = (nodes) => {
    try {
      // Create a map of all nodes
      const nodeMap = new Map();
      nodes.forEach((node) => {
        nodeMap.set(node.id, {
          id: node.id,
          value: node.value,
          children: [],
        });
      });

      // Connect nodes based on children arrays
      nodes.forEach((node) => {
        if (node.children) {
          node.children.forEach((childId) => {
            const childNode = nodeMap.get(childId);
            if (childNode) {
              nodeMap.get(node.id).children.push(childNode);
            }
          });
        }
      });

      // Find root node (node that's not a child of any other node)
      const childIds = new Set(nodes.flatMap((node) => node.children || []));
      const rootNode = nodes.find((node) => !childIds.has(node.id));

      if (!rootNode) {
        throw new Error("No root node found in the tree data");
      }

      return nodeMap.get(rootNode.id);
    } catch (error) {
      console.error("Error transforming data to hierarchy:", error);
      return null;
    }
  };

  // Transform the data
  const rootData = transformToHierarchy(nodes);

  if (!rootData) {
    svg
      .append("text")
      .attr("x", 10)
      .attr("y", 30)
      .text("Error processing tree data");
    return;
  }

  // Create hierarchy and apply tree layout
  const root = d3.hierarchy(rootData);
  const treeLayout = d3.tree().size([innerWidth, innerHeight]);
  treeLayout(root);

  // Create container group with margin
  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Draw links
  g.selectAll(".link")
    .data(root.links())
    .join("path")
    .attr("class", "link")
    .attr("fill", "none")
    .attr("stroke", "#999")
    .attr("stroke-width", 2)
    .attr(
      "d",
      d3
        .linkVertical()
        .x((d) => d.x)
        .y((d) => d.y)
    );

  // Draw nodes
  const node = g
    .selectAll(".node")
    .data(root.descendants())
    .join("g")
    .attr("class", "node")
    .attr("transform", (d) => `translate(${d.x},${d.y})`);

  // Add circles for nodes
  node
    .append("circle")
    .attr("r", 25)
    .attr("fill", "#69b3a2")
    .attr("stroke", "#fff")
    .attr("stroke-width", 2);

  // Add text labels
  node
    .append("text")
    .text((d) => d.data.value)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .style("font-size", "16px")
    .style("font-weight", "bold");
};
  // 4. Stack Visualization
const renderStack = (svg, data, width, height) => {
  // Validate input data
  if (!svg || !data || !width || !height) {
    console.error("Missing required parameters");
    return;
  }

  // Extract the stack data - handle both direct array and nested structure
  let stack = [];
  let message = "";

  if (Array.isArray(data)) {
    stack = data;
  } else if (data.visualization_data && data.visualization_data.stack) {
    stack = data.visualization_data.stack;
  } else if (data.stack) {
    stack = data.stack;
  } else if (data.array) {
    stack = data.array;
  } else {
    console.error("Invalid data structure");
    return;
  }

  // Configuration
  const boxHeight = 50;
  const boxWidth = 100;
  const spacing = 10;

  // Clear any existing elements
  svg.selectAll("*").remove();

  // Create stack elements
  const stackGroup = svg
    .append("g")
    .attr("class", "stack-group")
    .attr(
      "transform",
      `translate(0, ${height - stack.length * (boxHeight + spacing)})`
    );

  // Add rectangles for stack elements
  stackGroup
    .selectAll("rect")
    .data(stack)
    .join("rect")
    .attr("x", width / 2 - boxWidth / 2)
    .attr("y", (d, i) => i * (boxHeight + spacing))
    .attr("width", boxWidth)
    .attr("height", boxHeight)
    .attr("fill", "#69b3a2")
    .attr("stroke", "#234d45")
    .attr("rx", 5)
    .attr("ry", 5);

  // Add text labels for stack elements
  stackGroup
    .selectAll(".stack-text")
    .data(stack)
    .join("text")
    .attr("class", "stack-text")
    .attr("x", width / 2)
    .attr("y", (d, i) => i * (boxHeight + spacing) + boxHeight / 2)
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .attr("fill", "white")
    .text((d) => d);

  // Add "Stack" title
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("class", "stack-title")
    .text("Stack");

  // Add top pointer if stack is not empty
  if (stack.length > 0) {
    svg
      .append("text")
      .attr("x", width / 2 + boxWidth / 2 + 20)
      .attr("y", height - stack.length * (boxHeight + spacing) + boxHeight / 2)
      .attr("text-anchor", "start")
      .attr("dy", "0.35em")
      .text("← Top");
  }
};

  // 5. Queue Visualization
  const renderQueue = (svg, data, width, height) => {
    const queue = data.elements || [];
    const boxHeight = 50;
    const boxWidth = 100;
    const spacing = 10;

    svg
      .selectAll("rect")
      .data(queue)
      .join("rect")
      .attr("x", (d, i) => spacing + i * (boxWidth + spacing))
      .attr("y", height / 2 - boxHeight / 2)
      .attr("width", boxWidth)
      .attr("height", boxHeight)
      .attr("fill", "#69b3a2")
      .attr("stroke", "#234d45");

    svg
      .selectAll(".queue-text")
      .data(queue)
      .join("text")
      .attr("class", "queue-text")
      .attr("x", (d, i) => spacing + i * (boxWidth + spacing) + boxWidth / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "white")
      .text((d) => d);

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .text("Queue");
  };

  // 6. Hash Map Visualization
  const renderHashMap = (svg, data, width, height) => {
    const entries = data.entries || [];
    const bucketHeight = 50;
    const bucketWidth = 150;
    const spacing = 10;

    entries.forEach((entry, i) => {
      const g = svg
        .append("g")
        .attr(
          "transform",
          `translate(${spacing},${spacing + i * (bucketHeight + spacing)})`
        );

      g.append("rect")
        .attr("width", bucketWidth)
        .attr("height", bucketHeight)
        .attr("fill", "#69b3a2")
        .attr("stroke", "#234d45");

      g.append("text")
        .attr("x", bucketWidth / 2)
        .attr("y", bucketHeight / 2)
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("fill", "white")
        .text(`${entry.key}: ${entry.value}`);
    });

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .text("HashMap");
  };

  // Fallback for unsupported types
  const renderUnsupported = (svg, width, height) => {
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .text("Unsupported visualization type");
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-lg">
      <svg ref={svgRef} className="w-full"></svg>
    </div>
  );
};

export default AlgorithmVisualizer;
