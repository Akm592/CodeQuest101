import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import NeuralNetworkExplanation from "./NeuralNetworkExplanation";

const NeuralNetworkVisualizer: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [explanation, setExplanation] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [layers, setLayers] = useState([3, 4, 4, 2]);
  const [numLayers, setNumLayers] = useState(4);
  const [numOutputs, setNumOutputs] = useState(2);
  const [showPopup, setShowPopup] = useState(false);
  const [activeLayer, setActiveLayer] = useState(-1);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    if (svgRef.current) {
      drawNeuralNetwork();
    }
  }, [layers]);

  const drawNeuralNetwork = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const layerSpacing =
      (width - margin.left - margin.right) / (layers.length - 1);
    const neuronSpacing =
      (height - margin.top - margin.bottom) / Math.max(...layers);

    // Draw connections
    layers.forEach((layer, i) => {
      if (i < layers.length - 1) {
        for (let j = 0; j < layer; j++) {
          for (let k = 0; k < layers[i + 1]; k++) {
            svg
              .append("line")
              .attr("x1", margin.left + i * layerSpacing)
              .attr("y1", margin.top + j * neuronSpacing)
              .attr("x2", margin.left + (i + 1) * layerSpacing)
              .attr("y2", margin.top + k * neuronSpacing)
              .attr("stroke", "#e0e0e0")
              .attr("stroke-width", 1)
              .attr("class", `connection layer-${i}-${j} layer-${i + 1}-${k}`);
          }
        }
      }
    });

    // Draw neurons
    layers.forEach((layer, i) => {
      for (let j = 0; j < layer; j++) {
        svg
          .append("circle")
          .attr("cx", margin.left + i * layerSpacing)
          .attr("cy", margin.top + j * neuronSpacing)
          .attr("r", 10)
          .attr("fill", "#ffffff")
          .attr("stroke", "#000000")
          .attr("stroke-width", 2)
          .attr("class", `neuron layer-${i}-${j}`)
          .on("mouseover", () => handleNeuronHover(i, j))
          .on("mouseout", handleNeuronMouseOut)
          .on("click", () => handleLayerClick(i));
      }
    });

    // Animate connections
    svg
      .selectAll("line")
      .attr("stroke-dasharray", function () {
        return (this as SVGLineElement).getTotalLength();
      })
      .attr("stroke-dashoffset", function () {
        return (this as SVGLineElement).getTotalLength();
      })
      .transition()
      .duration(1000)
      .attr("stroke-dashoffset", 0);

    // Animate neurons
    svg
      .selectAll("circle")
      .attr("r", 0)
      .transition()
      .duration(500)
      .attr("r", 10);
  };

  const handleNeuronHover = (layerIndex: number, neuronIndex: number) => {
    setExplanation(getNeuronExplanation(layerIndex, neuronIndex));
  };

  const handleNeuronMouseOut = () => {
    setExplanation("");
  };

  const handleLayerClick = (layerIndex: number) => {
    setActiveLayer(layerIndex);
    setShowPopup(true);
  };

  const getNeuronExplanation = (layerIndex: number, neuronIndex: number) => {
    switch (layerIndex) {
      case 0:
        return `Input Layer, Neuron ${
          neuronIndex + 1
        }: This neuron receives raw input data and passes it to the first hidden layer.`;
      case layers.length - 1:
        return `Output Layer, Neuron ${
          neuronIndex + 1
        }: This neuron produces the final output of the network based on processed information from the hidden layers.`;
      default:
        return `Hidden Layer ${layerIndex}, Neuron ${
          neuronIndex + 1
        }: This neuron processes inputs from the previous layer, applies an activation function, and passes the result to the next layer.`;
    }
  };

  const getLayerExplanation = (layerIndex: number) => {
    switch (layerIndex) {
      case 0:
        return "Input Layer: Receives raw data and standardizes it for the network. Each neuron represents a feature in the input data.";
      case layers.length - 1:
        return "Output Layer: Produces the final results of the network. Each neuron typically represents a class or a continuous value, depending on the problem type (classification or regression).";
      default:
        return `Hidden Layer ${layerIndex}: Processes information from the previous layer. It applies weights to inputs, adds a bias, and uses an activation function to introduce non-linearity. This layer helps the network learn complex patterns in the data.`;
    }
  };

  const animateDataFlow = () => {
    setIsAnimating(true);
    const svg = d3.select(svgRef.current);

    // Animate input layer
    svg
      .selectAll(".neuron.layer-0-0, .neuron.layer-0-1, .neuron.layer-0-2")
      .transition()
      .duration(500)
      .attr("fill", "#000000")
      .transition()
      .duration(500)
      .attr("fill", "#ffffff");

    // Animate hidden layers and connections
    for (let i = 1; i < layers.length; i++) {
      svg
        .selectAll(
          `.connection.layer-${i - 1}-0, .connection.layer-${
            i - 1
          }-1, .connection.layer-${i - 1}-2, .connection.layer-${i - 1}-3`
        )
        .transition()
        .delay(i * 1000)
        .duration(500)
        .attr("stroke", "#000000")
        .transition()
        .duration(500)
        .attr("stroke", "#e0e0e0");

      svg
        .selectAll(
          `.neuron.layer-${i}-0, .neuron.layer-${i}-1, .neuron.layer-${i}-2, .neuron.layer-${i}-3`
        )
        .transition()
        .delay(i * 1000 + 500)
        .duration(500)
        .attr("fill", "#000000")
        .transition()
        .duration(500)
        .attr("fill", "#ffffff");
    }

    // Reset animation state
    setTimeout(() => setIsAnimating(false), layers.length * 1000 + 1000);
  };

  const handleNumLayersChange = (value: number[]) => {
    const newNumLayers = value[0];
    setNumLayers(newNumLayers);
    updateLayers(newNumLayers, numOutputs);
  };

  const handleNumOutputsChange = (value: number[]) => {
    const newNumOutputs = value[0];
    setNumOutputs(newNumOutputs);
    updateLayers(numLayers, newNumOutputs);
  };

  const updateLayers = (newNumLayers: number, newNumOutputs: number) => {
    const newLayers = [3];
    for (let i = 1; i < newNumLayers - 1; i++) {
      newLayers.push(4);
    }
    newLayers.push(newNumOutputs);
    setLayers(newLayers);
  };

  return (
    <div className="bg-white text-black p-6 rounded-lg shadow-lg w-screen">
      <h2 className="text-3xl font-bold mb-6 text-center">
        Neural Network Visualizer
      </h2>
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <Label htmlFor="numLayers" className="mb-2 block">
                Number of Layers: {numLayers}
              </Label>
              <Slider
                id="numLayers"
                min={3}
                max={10}
                step={1}
                value={[numLayers]}
                onValueChange={handleNumLayersChange}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="numOutputs" className="mb-2 block">
                Number of Outputs: {numOutputs}
              </Label>
              <Slider
                id="numOutputs"
                min={1}
                max={5}
                step={1}
                value={[numOutputs]}
                onValueChange={handleNumOutputsChange}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={animateDataFlow}
              disabled={isAnimating}
              className="bg-black text-white hover:bg-gray-800"
            >
              {isAnimating ? "Animating..." : "Animate Data Flow"}
            </Button>
            <div className="flex items-center space-x-2">
              <Switch
                id="showExplanation"
                checked={showExplanation}
                onCheckedChange={setShowExplanation}
              />
              <Label htmlFor="showExplanation">Show Explanation</Label>
            </div>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <svg ref={svgRef} width="100%" height="400"></svg>
          </div>
        </CardContent>
      </Card>
      <AnimatePresence>
        {explanation && (
          <motion.div
            className="mt-4 p-4 bg-gray-100 border border-gray-200 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <p className="text-sm">{explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h3 className="text-xl font-bold mb-2">Layer Explanation</h3>
            <p className="mb-4">{getLayerExplanation(activeLayer)}</p>
            <Button
              onClick={() => setShowPopup(false)}
              className="bg-black text-white hover:bg-gray-800"
            >
              Close
            </Button>
          </div>
        </div>
      )}
      {showExplanation && <NeuralNetworkExplanation />}
    </div>
  );
};

export default NeuralNetworkVisualizer;
