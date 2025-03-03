/* eslint-disable */



import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface AlgorithmVisualizerProps {
  visualizationData: any;
}

const AlgorithmVisualizer = ({ visualizationData }: AlgorithmVisualizerProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  // Cleanup timeouts on visualizationData change or component unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((id) => clearTimeout(id));
      timeoutsRef.current = [];
    };
  }, [visualizationData]);

  useEffect(() => {
    if (!visualizationData || !svgRef.current) return;

    // Clear previous timeouts and SVG content
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 400;
    svg.attr("width", width).attr("height", height);

    // Switch based on visualization type
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
        renderHashMap(svg, visualizationData, width);
        break;
      case "table":
        renderTable(svg, visualizationData, width, height);
        break;
      default:
        renderUnsupported(svg, width, height);
    }
  }, [visualizationData]);

  // ### Rendering Functions

  // #### 1. Sorting Animation
  interface SortingStep {
    array?: number[];
    message?: string;
  }

  interface SortingData {
    steps?: SortingStep[];
  }

  const renderSortingAnimation = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    data: SortingData,
    width: number,
    height: number
  ): void => {
    const steps: SortingStep[] = data.steps || [];
    const barWidth = 40;
    const barPadding = 10;

    const updateBars = (step: SortingStep): void => {
      const arr: number[] = step.array || [];
      const maxValue = Math.max(...arr);
      const scale = d3
        .scaleLinear()
        .domain([0, maxValue])
        .range([0, height - 100]);

      const bars = svg.selectAll<SVGRectElement, number>("rect").data(arr);
      bars.exit().remove();
      bars
        .enter()
        .append("rect")
        .merge(bars)
        .attr("x", (_d: number, i: number) => i * (barWidth + barPadding) + 50)
        .attr("y", (d: number) => height - scale(d) - 50)
        .attr("width", barWidth)
        .attr("height", (d: number) => scale(d))
        .attr("fill", "steelblue")
        .transition()
        .duration(500);

      svg
        .selectAll(".value-label")
        .data(arr)
        .join("text")
        .attr("class", "value-label")
        .attr("x", (_: number, i: number) => i * (barWidth + barPadding) + 50 + barWidth / 2)
        .attr("y", (d: number) => height - scale(d) - 55)
        .attr("text-anchor", "middle")
        .text((d: number) => d);

      svg.selectAll(".step-message").remove();
      svg
        .append("text")
        .attr("class", "step-message")
        .attr("x", width / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .text(step.message || "");
    };

    steps.forEach((step: SortingStep, idx: number) => {
      const timeoutId = window.setTimeout(() => updateBars(step), idx * 1000);
      timeoutsRef.current.push(timeoutId);
    });
  };

  // #### 2. Graph Visualization
  interface GraphNode extends d3.SimulationNodeDatum {
    id: string;
  }

  interface GraphEdge {
    source: string | GraphNode;
    target: string | GraphNode;
  }

  const renderGraph = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, data: any, width: number, height: number) => {
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`).style("overflow", "visible");

    let nodes: GraphNode[] = data.nodes || [];
    let edges: GraphEdge[] = data.edges || [];

    edges = edges.map((link: GraphEdge) => ({
      source:
        typeof link.source === "string"
          ? nodes.find((n) => n.id === link.source) || link.source
          : link.source,
      target:
        typeof link.target === "string"
          ? nodes.find((n) => n.id === link.target) || link.target
          : link.target,
    }));

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
        d.fx = null;
        d.fy = null;
      });

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(edges)
          .id((d) => (d as unknown as GraphNode).id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    const linkGroup = svg.append("g").attr("class", "edges");
    const nodeGroup = svg.append("g").attr("class", "nodes");

    const link = linkGroup
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2);

    const node = nodeGroup.selectAll<SVGGElement, GraphNode>("g").data(nodes).join("g").call(drag);

    node.append("circle").attr("r", 20).attr("fill", "#69b3a2");

    node
      .append("text")
      .text((d) => d.id)
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("fill", "white");

    linkGroup.lower();

    simulation.on("tick", () => {
      nodes.forEach((d) => {
        d.x = Math.max(20, Math.min(width - 20, d.x ?? 0));
        d.y = Math.max(20, Math.min(height - 20, d.y ?? 0));
      });

      link
        .attr("x1", (d: GraphEdge) => (typeof d.source === "string" ? 0 : d.source.x!))
        .attr("y1", (d: GraphEdge) => (typeof d.source === "string" ? 0 : d.source.y!))
        .attr("x2", (d: GraphEdge) => (typeof d.target === "string" ? 0 : d.target.x!))
        .attr("y2", (d: GraphEdge) => (typeof d.target === "string" ? 0 : d.target.y!));

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    if (data.steps && data.steps.length > 0) {
      data.steps.forEach((step: any, idx: number) => {
        const timeoutId = setTimeout(() => {
          node.select("circle").attr("fill", "#69b3a2");
          if (step.visitedNodes?.length > 0) {
            node
              .select("circle")
              .filter((d) => step.visitedNodes.includes(d.id))
              .attr("fill", "orange");
          }
          if (step.currentNode) {
            node
              .select("circle")
              .filter((d) => d.id === step.currentNode)
              .attr("fill", "red");
          }
          svg.selectAll(".graph-step-message").remove();
          svg
            .append("text")
            .attr("class", "graph-step-message")
            .attr("x", width / 2)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .text(step.message || "");
        }, idx * 1000);
    
        timeoutsRef.current.push(timeoutId as unknown as number);
      });
    }
  };

  // #### 3. Tree Visualization
  interface TreeNode {
    id: string;
    value: any;
    children?: string[];
  }
  const renderTree = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, data: any, width: number, height: number) => {
    if (!data || typeof data !== "object") {
      svg
        .append("text")
        .attr("x", 10)
        .attr("y", 30)
        .text("Invalid tree data structure");
      return;
    }

    let nodes =
      data.visualization_data?.nodes || data.nodes || (Array.isArray(data) ? data : null);
    if (!nodes) {
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

    const transformToHierarchy = (nodes: TreeNode[]) => {
      const nodeMap = new Map();
      nodes.forEach((node) =>
        nodeMap.set(node.id, { id: node.id, value: node.value, children: [] })
      );
      nodes.forEach((node) => {
        if (node.children) {
          node.children.forEach((childId) => {
            const childNode = nodeMap.get(childId);
            if (childNode) nodeMap.get(node.id).children.push(childNode);
          });
        }
      });
      const childIds = new Set(nodes.flatMap((node) => node.children || []));
      const rootNode = nodes.find((node) => !childIds.has(node.id));
      return rootNode ? nodeMap.get(rootNode.id) : null;
    };

    const rootData = transformToHierarchy(nodes);
    if (!rootData) {
      svg
        .append("text")
        .attr("x", 10)
        .attr("y", 30)
        .text("Error processing tree data");
      return;
    }

    const root = d3.hierarchy(rootData);
    const treeLayout = d3.tree().size([innerWidth, innerHeight]);
    treeLayout(root);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

      g.selectAll<SVGPathElement, d3.HierarchyPointLink<any>>(".link")
      .data(root.links() as d3.HierarchyPointLink<any>[])
      .join("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#999")
      .attr("stroke-width", 2)
      .attr("d", (d3.linkVertical() as unknown) as (d: d3.HierarchyPointLink<any>) => string)

    const node = g
      .selectAll(".node")
      .data(root.descendants())
      .join("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x},${d.y})`);

    node
      .append("circle")
      .attr("r", 25)
      .attr("fill", "#69b3a2")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    node
      .append("text")
      .text((d) => d.data.value)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .style("font-size", "16px")
      .style("font-weight", "bold");
  };

  // #### 4. Stack Visualization
  const renderStack = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    data: any,
    width: number,
    height: number
  ): void => {
    let stack =
      Array.isArray(data) || data.visualization_data?.stack || data.stack || data.array || [];
    if (!stack.length) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .text("Empty Stack");
      return;
    }

    const boxHeight = 50;
    const boxWidth = 100;
    const spacing = 10;

    svg.selectAll("*").remove();

    const stackGroup = svg
      .append("g")
      .attr("class", "stack-group");

    stackGroup
      .selectAll("rect")
      .data(stack)
      .join("rect")
      .attr("x", width / 2 - boxWidth / 2)
      .attr("y", (_: any, i: number) => i * (boxHeight + spacing))
      .attr("width", boxWidth)
      .attr("height", boxHeight)
      .attr("fill", "#69b3a2")
      .attr("stroke", "#234d45")
      .attr("rx", 5)
      .attr("ry", 5);

    stackGroup
      .selectAll(".stack-text")
      .data(stack)
      .join("text")
      .attr("class", "stack-text")
      .attr("x", width / 2)
      .attr("y", (_: any, i: number) => i * (boxHeight + spacing) + boxHeight / 2)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "white")
      .text((d: any) => d);

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .attr("class", "stack-title")
      .text("Stack");

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

  // #### 5. Queue Visualization
  const renderQueue = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    data: any,
    width: number,
    height: number
  ) => {
    const queue = data.elements || [];
    const boxHeight = 50;
    const boxWidth = 100;
    const spacing = 10;

    svg
      .selectAll("rect")
      .data(queue)
      .join("rect")
      .attr("x", (_d: any, i: number) => spacing + i * (boxWidth + spacing))
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
      .attr("x", (_d: any, i: number) => spacing + i * (boxWidth + spacing) + boxWidth / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "white")
      .text((_d: any) => _d);

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .text("Queue");
  };

  // #### 6. HashMap Visualization
  const renderHashMap = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, data: { entries?: { key: string; value: any }[] }, width: number): void => {
    const entries = data.entries || [];
    const bucketHeight = 50;
    const bucketWidth = 150;
    const spacing = 10;

    entries.forEach((entry: { key: string; value: any }, i: number) => {
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

  // #### 7. Table Visualization
  const renderTable = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    data: {
      rows: number;
      columns: number;
      data: any[][];
      steps?: { updatedCells?: [number, number, any][]; message?: string }[];
    },
    width: number,
    height: number
  ): void => {
    const rows: number = data.rows || 0;
    const columns: number = data.columns || 0;
    const tableData: any[][] = data.data || [];
    const steps: { updatedCells?: [number, number, any][]; message?: string }[] = data.steps || [];

    if (!rows || !columns || !tableData.length) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .text("Invalid table data");
      return;
    }

    const cellWidth: number = 50;
    const cellHeight: number = 50;

    const tableGroup = svg
      .append("g")
      .attr("transform", `translate(${(width - columns * cellWidth) / 2}, 50)`);

    const cells: { rowIndex: number; colIndex: number; value: any }[] = [];
    tableData.forEach((row: any[], rowIndex: number) => {
      row.forEach((value: any, colIndex: number) => {
        cells.push({ rowIndex, colIndex, value });
      });
    });

    const cellGroups = tableGroup
      .selectAll(".cell")
      .data(cells)
      .join("g")
      .attr("class", "cell")
      .attr("transform", (d: { rowIndex: number; colIndex: number; value: any }) =>
        `translate(${d.colIndex * cellWidth}, ${d.rowIndex * cellHeight})`
      );

    cellGroups
      .append("rect")
      .attr("width", cellWidth)
      .attr("height", cellHeight)
      .attr("fill", "white")
      .attr("stroke", "black");

    cellGroups
      .append("text")
      .attr("class", (d: { rowIndex: number; colIndex: number; value: any }) => `cell-text row-${d.rowIndex} col-${d.colIndex}`)
      .attr("x", cellWidth / 2)
      .attr("y", cellHeight / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .text((d: { rowIndex: number; colIndex: number; value: any }) => d.value)
      .style("font-weight", (d: { rowIndex: number; colIndex: number; value: any }) =>
        d.rowIndex === 0 || d.colIndex === 0 ? "bold" : "normal"
      )
      .style("fill", (d: { rowIndex: number; colIndex: number; value: any }) =>
        d.rowIndex === 0 || d.colIndex === 0 ? "blue" : "black"
      );

    const messageText = svg
      .append("text")
      .attr("class", "step-message")
      .attr("x", width / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .text("Initial table");

    steps.forEach((step: { updatedCells?: [number, number, any][]; message?: string }, idx: number) => {
      const timeoutId: number = window.setTimeout(() => {
        step.updatedCells?.forEach(([row, col, newValue]: [number, number, any]) => {
          svg.select(`.cell-text.row-${row}.col-${col}`).text(newValue);
        });
        messageText.text(step.message || "");
      }, idx * 1000);
      timeoutsRef.current.push(timeoutId);
    });
  };

  // #### Fallback for Unsupported Types
  const renderUnsupported = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, width: number, height: number): void => {
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .text("Unsupported visualization type");
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-0 bg-white rounded-lg shadow-lg">
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
};

export default AlgorithmVisualizer;