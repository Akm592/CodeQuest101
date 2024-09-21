import React from "react";
import { Card, CardContent } from "./ui/card";

const NeuralNetworkExplanation: React.FC = () => {
  return (
    <Card className="mt-8">
      <CardContent>
        <h2 className="text-2xl font-bold mb-4">Neural Network Explanation</h2>
        <div className="space-y-4">
          <section>
            <h3 className="text-xl font-semibold">What is a Neural Network?</h3>
            <p>
              A neural network is a type of machine learning model inspired by
              the structure and functioning of the human brain. It consists of
              layers of interconnected nodes (neurons) that process input data,
              recognize patterns, and make decisions or predictions. Neural
              networks are capable of learning from data and improving their
              performance over time, making them suitable for complex tasks such
              as image recognition, natural language processing, and game
              playing.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Key Components</h3>
            <ul className="list-disc pl-5">
              <li>
                <strong>Input Layer:</strong> The initial layer that receives
                the raw input data and passes it to the next layer.
              </li>
              <li>
                <strong>Hidden Layers:</strong> Intermediate layers where
                neurons process the input through weighted connections. These
                layers extract features and learn representations from the data.
              </li>
              <li>
                <strong>Output Layer:</strong> The final layer that produces the
                network's prediction or decision, such as classifying an image
                or generating text.
              </li>
              <li>
                <strong>Weights and Biases:</strong> Parameters that the network
                optimizes during training. Weights control the influence of
                input data, while biases adjust the output along with the
                weighted sum.
              </li>
              <li>
                <strong>Activation Functions:</strong> Functions applied to
                neurons' output to introduce non-linearity, enabling the network
                to model complex relationships in the data. Common activation
                functions include ReLU, sigmoid, and tanh.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold">How It Works</h3>
            <ol className="list-decimal pl-5">
              <li>
                Input data is fed into the network through the input layer.
              </li>
              <li>
                Each neuron in the hidden layers receives inputs, multiplies
                them by corresponding weights, adds a bias, and then applies an
                activation function to produce an output.
              </li>
              <li>
                The output of each neuron is passed to the neurons in the next
                layer, allowing the network to learn complex hierarchical
                representations.
              </li>
              <li>
                This process continues through all the hidden layers until the
                output layer generates the final result, such as a
                classification label or a predicted value.
              </li>
              <li>
                During training, the network uses an algorithm like
                backpropagation to adjust its weights and biases. This is done
                by minimizing a loss function, which quantifies the difference
                between the predicted and actual outcomes.
              </li>
            </ol>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Types of Neural Networks</h3>
            <ul className="list-disc pl-5">
              <li>
                <strong>Feedforward Neural Networks (FNNs):</strong> The
                simplest form of neural networks where connections between nodes
                do not form a cycle. Information flows in one direction from
                input to output.
              </li>
              <li>
                <strong>Convolutional Neural Networks (CNNs):</strong> Primarily
                used for image and video analysis, CNNs employ convolutional
                layers to capture spatial hierarchies and features like edges,
                textures, and shapes.
              </li>
              <li>
                <strong>Recurrent Neural Networks (RNNs):</strong> Designed for
                sequential data, RNNs have connections that form directed
                cycles, enabling them to maintain a memory of previous inputs,
                making them effective for tasks like language modeling and time
                series prediction.
              </li>
              <li>
                <strong>Long Short-Term Memory (LSTM) Networks:</strong> A
                specialized type of RNN that can learn long-term dependencies in
                data. LSTMs are particularly useful for tasks where context over
                long sequences is critical, such as speech recognition and
                translation.
              </li>
              <li>
                <strong>Generative Adversarial Networks (GANs):</strong> Consist
                of two networks, a generator and a discriminator, that compete
                with each other to create realistic synthetic data. GANs are
                widely used in image generation and style transfer.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Applications</h3>
            <ul className="list-disc pl-5">
              <li>Image and Speech Recognition</li>
              <li>Natural Language Processing (NLP)</li>
              <li>Autonomous Vehicles</li>
              <li>Financial Forecasting and Algorithmic Trading</li>
              <li>Medical Diagnosis and Drug Discovery</li>
              <li>Recommendation Systems (e.g., Netflix, Amazon)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold">
              Further Reading and References
            </h3>
            <ul className="list-disc pl-5">
              <li>
                Goodfellow, I., Bengio, Y., & Courville, A. (2016).{" "}
                <em>Deep Learning</em>. MIT Press. [Link to
                book](https://www.deeplearningbook.org/)
              </li>
              <li>
                LeCun, Y., Bengio, Y., & Hinton, G. (2015). Deep learning.{" "}
                <em>Nature</em>, 521(7553), 436-444. [Link to
                paper](https://www.nature.com/articles/nature14539)
              </li>
              <li>
                Schmidhuber, J. (2015). Deep learning in neural networks: An
                overview. <em>Neural Networks</em>, 61, 85-117. [Link to
                paper](https://doi.org/10.1016/j.neunet.2014.09.003)
              </li>
              <li>
                Chollet, F. (2018). <em>Deep Learning with Python</em>. Manning
                Publications. [Link to
                book](https://www.manning.com/books/deep-learning-with-python)
              </li>
              <li>
                Goodfellow, I., Pouget-Abadie, J., Mirza, M., Xu, B.,
                Warde-Farley, D., Ozair, S., ... & Bengio, Y. (2014). Generative
                adversarial nets. In{" "}
                <em>Advances in neural information processing systems</em> (pp.
                2672-2680). [Link to
                paper](https://papers.nips.cc/paper/5423-generative-adversarial-nets)
              </li>
            </ul>
          </section>
        </div>
      </CardContent>
    </Card>
  );
};

export default NeuralNetworkExplanation;
