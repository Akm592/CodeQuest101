import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"; // Adjust path
import { Button } from "./ui/button"; // Adjust path
import { Label } from "./ui/label"; // Adjust path
import { Slider } from "./ui/slider"; // Adjust path
import { Switch } from "./ui/switch"; // Adjust path
import NeuralNetworkExplanation from "./NeuralNetworkExplanation"; // Import explanation component
import { Info, Loader2, Network, SlidersHorizontal, Eye, Play, Target } from "lucide-react"; // Icons

const MAX_LAYERS = 8;
const MAX_NEURONS_PER_LAYER = 10; // Limit neurons per hidden layer for viz clarity
const MAX_OUTPUTS = 8;
const NODE_RADIUS = 8; // Smaller radius for potentially more nodes
const ANIMATION_DURATION = 400; // Faster animation

const NeuralNetworkVisualizer: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverExplanation, setHoverExplanation] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  // Structure: [inputLayerSize, hidden1Size, ..., hiddenNSize, outputLayerSize]
  const [layers, setLayers] = useState([3, 5, 5, 2]); // Default structure
  const [numHiddenLayers, setNumHiddenLayers] = useState(2); // Control hidden layers specifically
  const [neuronsPerHiddenLayer, setNeuronsPerHiddenLayer] = useState(5); // Control neurons in hidden layers
  const [numOutputs, setNumOutputs] = useState(2);
  const [showPopup, setShowPopup] = useState(false);
  const [activeLayerInfo, setActiveLayerInfo] = useState({ index: -1, explanation: "" });
  const [showExplanationComponent, setShowExplanationComponent] = useState(false);

   // Update layers array when controls change
   useEffect(() => {
     const inputLayerSize = layers[0]; // Keep input size fixed or make it configurable too
     const hiddenLayersArray = Array(numHiddenLayers).fill(neuronsPerHiddenLayer);
     const newLayers = [inputLayerSize, ...hiddenLayersArray, numOutputs];
     setLayers(newLayers);
   }, [numHiddenLayers, neuronsPerHiddenLayer, numOutputs, layers[0]]);


  const drawNeuralNetwork = useCallback(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous drawing

    const width = svgRef.current.clientWidth || 800; // Get dynamic width
    const height = 400; // Fixed height
    const margin = { top: 30, right: 30, bottom: 30, left: 30 };

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const layerCount = layers.length;
    if (layerCount < 2) return; // Need at least input and output

    const layerSpacing = (width - margin.left - margin.right) / (layerCount - 1);
    const maxNeuronsInAnyLayer = Math.max(...layers);

    const nodeData: { x: number; y: number; layerIndex: number; neuronIndex: number }[] = [];
    const lineData: { source: { x: number; y: number }; target: { x: number; y: number }; key: string }[] = [];

    // Calculate positions
    layers.forEach((numNeurons, layerIndex) => {
      const layerHeight = (numNeurons - 1) * (NODE_RADIUS * 3.5); // Spacing based on radius
      const startY = (height - layerHeight) / 2;
      const x = margin.left + layerIndex * layerSpacing;

      for (let neuronIndex = 0; neuronIndex < numNeurons; neuronIndex++) {
          const y = startY + neuronIndex * (numNeurons === 1 ? 0 : layerHeight / (numNeurons - 1));
          nodeData.push({ x, y, layerIndex, neuronIndex });

           // Calculate connections to next layer
          if (layerIndex < layerCount - 1) {
                const nextLayerNumNeurons = layers[layerIndex + 1];
                const nextLayerHeight = (nextLayerNumNeurons - 1) * (NODE_RADIUS * 3.5);
                const nextLayerStartY = (height - nextLayerHeight) / 2;
                const nextX = margin.left + (layerIndex + 1) * layerSpacing;

                for (let nextNeuronIndex = 0; nextNeuronIndex < nextLayerNumNeurons; nextNeuronIndex++) {
                     const nextY = nextLayerStartY + nextNeuronIndex * (nextLayerNumNeurons === 1 ? 0 : nextLayerHeight / (nextLayerNumNeurons - 1));
                     lineData.push({
                          source: { x, y },
                          target: { x: nextX, y: nextY },
                          key: `l${layerIndex}n${neuronIndex}-l${layerIndex+1}n${nextNeuronIndex}`
                     });
                }
          }
      }
    });

    // Draw Connections (as paths for animation)
     const lineGroup = svg.append("g").attr("class", "connections");
     lineGroup.selectAll("path")
         .data(lineData)
         .join("path")
         .attr("d", d => `M ${d.source.x} ${d.source.y} L ${d.target.x} ${d.target.y}`)
         .attr("stroke", "rgb(55 65 81)") // gray-700
         .attr("stroke-width", 0.5)
         .attr("fill", "none")
         .attr("class", d => d.key.replace(/[.-]/g,'')) // Class based on key for selection
         .style("opacity", 0.7); // Slightly transparent lines

    // Draw Neurons
    const neuronGroup = svg.append("g").attr("class", "neurons");
    neuronGroup.selectAll("circle")
        .data(nodeData)
        .join("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", NODE_RADIUS)
        .attr("fill", "rgb(31 41 55)") // gray-800
        .attr("stroke", "rgb(75 85 99)") // gray-600
        .attr("stroke-width", 1)
        .attr("class", d => `neuron layer-${d.layerIndex} neuron-${d.neuronIndex}`)
        .style("cursor", "pointer")
        .on("mouseover", (event, d) => handleNeuronHover(d.layerIndex, d.neuronIndex))
        .on("mouseout", handleNeuronMouseOut)
        .on("click", (event, d) => handleLayerClick(d.layerIndex));

  // Initial animation (optional fade-in)
   svg.style("opacity", 0).transition().duration(500).style("opacity", 1);

  }, [layers]); // Redraw when layers structure changes

   // Effect to draw on mount and layer changes
   useEffect(() => {
     drawNeuralNetwork();
     // Add resize listener if needed for dynamic SVG width
     const handleResize = () => drawNeuralNetwork();
     window.addEventListener('resize', handleResize);
     return () => window.removeEventListener('resize', handleResize);
   }, [layers, drawNeuralNetwork]);


  const handleNeuronHover = (layerIndex: number, neuronIndex: number) => {
    setHoverExplanation(getNeuronExplanation(layerIndex, neuronIndex));
    // Highlight neuron and connections (optional)
    d3.selectAll(`.layer-${layerIndex}.neuron-${neuronIndex}`).attr("fill", "rgb(20 184 166)"); // teal-500
  };

  const handleNeuronMouseOut = () => {
    setHoverExplanation("");
     // Reset highlight
    d3.selectAll(".neuron").attr("fill", "rgb(31 41 55)"); // gray-800
  };

  const handleLayerClick = (layerIndex: number) => {
    setActiveLayerInfo({ index: layerIndex, explanation: getLayerExplanation(layerIndex) });
    setShowPopup(true);
  };

  const getNeuronExplanation = (layerIndex: number, neuronIndex: number): string => {
    if (layerIndex === 0) return `Input Neuron ${neuronIndex + 1}: Receives raw input feature.`;
    if (layerIndex === layers.length - 1) return `Output Neuron ${neuronIndex + 1}: Produces final network output/prediction.`;
    return `Hidden Neuron ${neuronIndex + 1} (Layer ${layerIndex}): Processes information, applies activation function.`;
  };

  const getLayerExplanation = (layerIndex: number): string => {
     if (layerIndex === 0) return "Input Layer: Receives the initial data features for the network to process.";
     if (layerIndex === layers.length - 1) return "Output Layer: Produces the final prediction or classification result based on the processed information from hidden layers.";
     return `Hidden Layer ${layerIndex}: Performs computations on the data received from the previous layer. These layers extract increasingly complex features and patterns. Activation functions introduce non-linearity here.`;
  };


  const animateDataFlow = async () => {
      if (isAnimating) return;
      setIsAnimating(true);
      const svg = d3.select(svgRef.current);
      const duration = ANIMATION_DURATION;

      // Reset styles
      svg.selectAll(".neuron").attr("fill", "rgb(31 41 55)"); // gray-800
      svg.selectAll(".connections path").attr("stroke", "rgb(55 65 81)").attr("stroke-width", 0.5); // gray-700

      for (let i = 0; i < layers.length; i++) {
          // Highlight current layer neurons
          const currentLayerNeurons = svg.selectAll(`.neuron.layer-${i}`);
          currentLayerNeurons
              .transition().duration(duration / 2)
              .attr("fill", "rgb(20 184 166)") // teal-500
              .attr("r", NODE_RADIUS * 1.2) // Slightly larger
              .transition().duration(duration / 2)
              .attr("fill", "rgb(16 185 129)") // green-500 (processed state)
              .attr("r", NODE_RADIUS);

          if (i < layers.length - 1) {
                // Highlight outgoing connections from current layer
                const outgoingConnections = svg.selectAll(".connections path")
                   .filter((d: any, idx, nodes) => d3.select(nodes[idx]).attr('class').includes(`l${i}n`)); // Select based on class structure

                 outgoingConnections
                     .transition().delay(duration / 3).duration(duration / 1.5)
                     .attr("stroke", "rgb(253 186 116)") // orange-300
                     .attr("stroke-width", 1.5)
                     .transition().duration(duration / 2)
                     .attr("stroke", "rgb(55 65 81)") // gray-700
                     .attr("stroke-width", 0.5);
           }
           await sleep(duration * 0.8); // Wait for layer animation + part of connection
      }

       // Final state highlight output layer briefly
        svg.selectAll(`.neuron.layer-${layers.length - 1}`)
            .transition().duration(duration / 2)
            .attr("fill", "rgb(217 119 6)") // amber-600
            .transition().delay(duration).duration(duration)
            .attr("fill", "rgb(31 41 55)"); // Back to default gray-800

      setIsAnimating(false);
  };

   const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  return (
     // Dark theme page container
    <div className="min-h-screen w-screen bg-gradient-to-br from-gray-950 to-black p-4 text-gray-300 flex flex-col items-center">
        {/* Dark Card */}
        <Card className="w-full max-w-6xl mx-auto bg-gray-900 border border-gray-700/50 shadow-xl rounded-lg overflow-hidden mb-6">
            <CardHeader className="bg-gray-800 border-b border-gray-700/50 text-gray-100 p-4 sm:p-5">
                <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-center flex items-center justify-center gap-2">
                    <Network size={28}/> Neural Network Visualizer
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
                 {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 border-b border-gray-700/50 pb-5">
                    {/* Hidden Layers Control */}
                    <div className="space-y-1">
                         <Label htmlFor="numHiddenLayers" className="text-sm font-medium text-gray-400 flex items-center gap-1">
                              <SlidersHorizontal size={14} /> Hidden Layers: <span className="font-bold text-teal-400">{numHiddenLayers}</span>
                         </Label>
                        <Slider
                            id="numHiddenLayers" min={1} max={MAX_LAYERS - 2} step={1}
                            value={[numHiddenLayers]}
                            onValueChange={(val) => setNumHiddenLayers(val[0])}
                             className="w-full [&>span:first-child]:h-2 [&>span>span]:bg-teal-500 [&>span:first-child]:bg-gray-700"
                        />
                    </div>
                     {/* Neurons per Hidden Layer */}
                    <div className="space-y-1">
                         <Label htmlFor="neuronsPerHidden" className="text-sm font-medium text-gray-400 flex items-center gap-1">
                            <Network size={14} /> Neurons/Hidden: <span className="font-bold text-teal-400">{neuronsPerHiddenLayer}</span>
                         </Label>
                        <Slider
                            id="neuronsPerHidden" min={1} max={MAX_NEURONS_PER_LAYER} step={1}
                            value={[neuronsPerHiddenLayer]}
                            onValueChange={(val) => setNeuronsPerHiddenLayer(val[0])}
                            className="w-full [&>span:first-child]:h-2 [&>span>span]:bg-teal-500 [&>span:first-child]:bg-gray-700"
                        />
                    </div>
                    {/* Output Layer Control */}
                     <div className="space-y-1">
                        <Label htmlFor="numOutputs" className="text-sm font-medium text-gray-400 flex items-center gap-1">
                            <Target size={14} /> Output Neurons: <span className="font-bold text-teal-400">{numOutputs}</span>
                        </Label>
                        <Slider
                            id="numOutputs" min={1} max={MAX_OUTPUTS} step={1}
                            value={[numOutputs]}
                            onValueChange={(val) => setNumOutputs(val[0])}
                             className="w-full [&>span:first-child]:h-2 [&>span>span]:bg-teal-500 [&>span:first-child]:bg-gray-700"
                        />
                    </div>
                </div>

                 {/* Action Buttons & Explanation Toggle */}
                 <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-5">
                    <Button
                        onClick={animateDataFlow}
                        disabled={isAnimating}
                         className="w-full sm:w-auto flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2 disabled:opacity-60"
                    >
                        {isAnimating ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                        {isAnimating ? "Animating..." : "Animate Data Flow"}
                    </Button>
                     <div className="flex items-center space-x-2">
                        <Switch
                            id="showExplanation"
                            checked={showExplanationComponent}
                            onCheckedChange={setShowExplanationComponent}
                            className="data-[state=checked]:bg-teal-600 data-[state=unchecked]:bg-gray-700 [&>span]:bg-gray-300"
                        />
                        <Label htmlFor="showExplanation" className="text-sm text-gray-400 cursor-pointer flex items-center gap-1">
                            <Eye size={14}/> Show Detailed Explanation
                         </Label>
                    </div>
                </div>

                {/* SVG Visualization Area */}
                <div className="bg-black/30 p-2 rounded-lg border border-gray-700/50 min-h-[420px] flex items-center justify-center">
                    <svg ref={svgRef} width="100%" height="400"></svg>
                </div>

                 {/* Hover Explanation Area */}
                <AnimatePresence>
                    {hoverExplanation && (
                        <motion.div
                             className="mt-4 p-3 bg-gray-800 border border-gray-700 rounded-lg text-center"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <p className="text-xs text-gray-300 font-mono">{hoverExplanation}</p>
                        </motion.div>
                    )}
                 </AnimatePresence>
            </CardContent>
        </Card>

        {/* Popup for Layer Explanation */}
        <AnimatePresence>
            {showPopup && (
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                onClick={() => setShowPopup(false)} // Close on backdrop click
            >
                <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    className="bg-gray-800 p-6 rounded-lg max-w-md border border-gray-600 shadow-xl"
                    onClick={e => e.stopPropagation()} // Prevent closing when clicking inside popup
                >
                    <h3 className="text-lg font-semibold mb-2 text-teal-400">Layer {activeLayerInfo.index}: {
                         activeLayerInfo.index === 0 ? "Input Layer" :
                         activeLayerInfo.index === layers.length - 1 ? "Output Layer" :
                         `Hidden Layer ${activeLayerInfo.index}`
                    }</h3>
                    <p className="text-sm text-gray-300 mb-4">{activeLayerInfo.explanation}</p>
                    <Button
                        onClick={() => setShowPopup(false)}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white text-sm"
                        size="sm"
                    >
                        Close
                    </Button>
                </motion.div>
            </motion.div>
            )}
        </AnimatePresence>

         {/* Detailed Explanation Component */}
        {showExplanationComponent && <NeuralNetworkExplanation />}
    </div>
  );
};

export default NeuralNetworkVisualizer;