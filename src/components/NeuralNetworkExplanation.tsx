import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"; // Adjust path

const NeuralNetworkExplanation: React.FC = () => {
  return (
    // Dark Card for explanation
    <Card className="mt-8 bg-gray-800 border border-gray-700/50 text-gray-300">
       <CardHeader className="border-b border-gray-700/50 pb-3">
            <CardTitle className="text-xl font-semibold text-gray-100">Understanding Neural Networks</CardTitle>
       </CardHeader>
      <CardContent className="pt-4 text-sm">
        <div className="space-y-5">
          <section>
            <h3 className="text-lg font-semibold text-gray-200 mb-1">What is a Neural Network?</h3>
            <p className="leading-relaxed">
              Inspired by the human brain, a neural network is a machine learning model comprising layers of interconnected nodes (neurons). These networks process input data, identify patterns, and generate outputs like predictions or classifications. They excel at learning from data, improving performance over time on complex tasks (e.g., image recognition, NLP).
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-200 mb-1">Key Components</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Input Layer:</strong> Receives raw input data. Each node typically corresponds to a feature.
              </li>
              <li>
                <strong>Hidden Layers:</strong> One or more intermediate layers where computation occurs. Neurons process weighted inputs, apply biases, and use activation functions to learn complex data representations.
              </li>
              <li>
                <strong>Output Layer:</strong> Produces the final result (e.g., class probability, predicted value). The structure depends on the task.
              </li>
              <li>
                <strong>Weights & Biases:</strong> Learnable parameters adjusted during training. Weights determine the strength of connections; biases shift the activation function's output.
              </li>
              <li>
                <strong>Activation Functions:</strong> Introduce non-linearity (e.g., ReLU, Sigmoid, Tanh), allowing the network to model complex, non-linear relationships.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-200 mb-1">How It Works (Forward Pass)</h3>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Input data enters the Input Layer.</li>
              <li>Data flows to Hidden Layers. Each neuron calculates a weighted sum of its inputs, adds a bias, and applies an activation function.</li>
              <li>The output propagates layer by layer.</li>
              <li>The Output Layer produces the final prediction.</li>
              <li><strong>Training:</strong> The network compares predictions to actual values (using a loss function) and uses backpropagation to adjust weights and biases, minimizing the error.</li>
            </ol>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-200 mb-1">Common Types</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>FNNs (Feedforward):</strong> Simple, unidirectional data flow.</li>
              <li><strong>CNNs (Convolutional):</strong> Excel at spatial hierarchies (images, video). Use convolutional filters.</li>
              <li><strong>RNNs (Recurrent):</strong> Process sequential data (text, time series). Have internal memory loops.</li>
              <li><strong>LSTMs/GRUs:</strong> Advanced RNNs handling long-range dependencies.</li>
              <li><strong>Transformers:</strong> Attention-based models, state-of-the-art in NLP.</li>
              <li><strong>GANs (Generative Adversarial):</strong> Generator vs. Discriminator networks for creating realistic data.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-200 mb-1">Applications</h3>
            <ul className="list-disc pl-5 grid grid-cols-2 gap-x-4 gap-y-1">
              <li>Image Recognition</li>
              <li>Speech Recognition</li>
              <li>Machine Translation</li>
              <li>Recommendation Systems</li>
              <li>Autonomous Driving</li>
              <li>Medical Diagnosis</li>
              <li>Financial Modeling</li>
              <li>Game Playing (AI)</li>
            </ul>
          </section>

          {/* Further Reading - Keep as is, maybe style links */}
           <section>
             <h3 className="text-lg font-semibold text-gray-200 mb-1">Further Reading</h3>
             <ul className="list-disc pl-5 text-xs space-y-1">
                 {/* Example styled link */}
                 <li>Goodfellow, I., et al. (2016). <em>Deep Learning</em>. MIT Press. <a href="https://www.deeplearningbook.org/" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">(Link)</a></li>
                 <li>LeCun, Y., et al. (2015). Deep learning. <em>Nature</em>. <a href="https://www.nature.com/articles/nature14539" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">(Link)</a></li>
                 {/* Add other links similarly */}
                 <li>Schmidhuber, J. (2015). Deep learning overview. <em>Neural Networks</em>. <a href="https://doi.org/10.1016/j.neunet.2014.09.003" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">(Link)</a></li>

             </ul>
           </section>
        </div>
      </CardContent>
    </Card>
  );
};

export default NeuralNetworkExplanation;