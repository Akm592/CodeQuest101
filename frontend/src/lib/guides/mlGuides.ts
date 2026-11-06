// "How it works" for the Machine Learning & AI pages.
//
// Each guide's stages line up one-to-one with its step generator's `phase`, so
// the stage mapping is just the phase. guides.test.ts runs the pages' default
// inputs through the generators to prove every stage is reached.

import type { AttentionStep } from "../ml/attention";
import type { GdStep } from "../ml/gradientDescent";
import type { KMeansStep } from "../ml/kMeans";
import type { LrStep } from "../ml/linearRegression";
import type { MlpStep } from "../ml/mlp";
import type { SamplingStep } from "../ml/sampling";
import gradientDescentPy from "./python/gradient_descent.py?raw";
import kMeansPy from "./python/k_means.py?raw";
import linearRegressionPy from "./python/linear_regression.py?raw";
import samplingPy from "./python/sampling.py?raw";
import selfAttentionPy from "./python/self_attention.py?raw";
import tinyMlpPy from "./python/tiny_mlp.py?raw";
import type { AlgorithmGuide } from "./types";

const ML_HEADING = "Where you'll meet it";

export const gradientDescentGuide: AlgorithmGuide = {
  title: "Gradient Descent",
  whenToUseHeading: ML_HEADING,
  idea: [
    "Training a model means finding the settings (weights) that make its error as small as possible. Picture the error as a landscape: every point is one choice of weights, and the height is how wrong the model is there. We want the lowest point.",
    "We can't see the whole landscape, only the slope under our feet. That slope is the gradient: it points uphill, so we step the opposite way. Repeat, and we walk down into a valley.",
    "The learning rate is the step size. Too small and training crawls; too big and each step jumps past the valley floor and lands higher up the other side, until it flies off completely. Momentum keeps a running velocity so steps build up along a gentle slope and cancel out when they zigzag.",
  ],
  whenToUse: [
    "Training almost every model: linear and logistic regression, neural networks, and large language models all learn by some form of gradient descent.",
    "Variants you'll hear about: stochastic (SGD, one mini-batch at a time), momentum, and Adam, which adapts the step size per weight.",
    "Interview favourites: “why is my loss going up?” (learning rate too high), “why does training stall?” (too low, a flat region, or a local minimum).",
  ],
  stages: [
    { id: "start", title: "Pick a starting point", detail: "Models start from random weights. Here you can click the map to choose where to drop the ball.", pseudo: "w = initial_guess" },
    { id: "slope", title: "Measure the slope", detail: "The gradient says how fast the loss grows in each direction. The arrow points the way we'll move: straight downhill, against the gradient.", pseudo: "g = grad(loss, w)" },
    { id: "move", title: "Step downhill", detail: "Move by learning rate × gradient. With momentum, add most of the previous move too, so the ball keeps rolling.", pseudo: "w = w - lr * g" },
    { id: "stop", title: "Stop when it's flat (or out of steps)", detail: "Near a minimum the slope is close to zero, so steps shrink on their own. We stop when they're tiny or we hit the step limit.", pseudo: "if norm(g) < tol: break" },
    { id: "diverged", title: "Or: it blew up", detail: "Each step overshot so far that the loss grew instead of shrinking. The fix is a smaller learning rate.", pseudo: "loss → ∞  (lr too big)" },
  ],
  legend: [
    { tone: "current", label: "Current position" },
    { tone: "compare", label: "Downhill direction" },
    { tone: "visited", label: "Path so far" },
    { tone: "found", label: "Minimum" },
  ],
  complexity: {
    time: "O(steps × cost of one gradient)",
    space: "O(number of weights)",
    why: "Each step needs one gradient computation. For a neural network that's one forward and one backward pass over the data (or a mini-batch of it).",
  },
  pitfalls: [
    "A learning rate that works on one problem can blow up on another: the safe limit depends on how steep the steepest direction is (here, 2 ÷ curvature).",
    "A falling loss doesn't mean you found the best answer. On “Two valleys” the default start settles in the shallower one: a local minimum.",
    "Features on very different scales make a narrow valley. Standardising inputs (as the regression page does) rounds it out so plain descent works.",
  ],
  tryThis: [
    "On “Round bowl”, raise the learning rate past 1.0 and watch it diverge.",
    "On “Narrow valley”, compare Plain and Momentum at the same learning rate: count the steps.",
    "On “Two valleys”, click the left half of the map to start there instead. It finds the deeper valley.",
  ],
  python: gradientDescentPy,
};

export const gdGuideStepFor = (s: GdStep) => s.phase;

export const linearRegressionGuide: AlgorithmGuide = {
  title: "Linear Regression",
  whenToUseHeading: ML_HEADING,
  idea: [
    "Linear regression draws the straight line that best fits a cloud of points, so you can predict y from x. The line is y = w·x + b: w is the slope (how much y rises per unit of x) and b is where it crosses the y-axis.",
    "“Best” needs a number. For each point, measure the vertical gap between the point and the line, square it so misses above and below both count, and average them. That's the mean squared error (MSE), and a smaller one means a better line.",
    "To shrink the error we use gradient descent: work out whether nudging w and b up or down would lower the MSE, nudge them a little that way, and repeat. For a straight line there's also an exact formula, shown dashed, so you can see descent arrive at the same answer.",
  ],
  whenToUse: [
    "Predicting a number: price from size, sales from ad spend, time from distance.",
    "As a baseline before trying anything fancier: if a line already explains the data, a neural network won't help much.",
    "It's the smallest complete example of the training loop (predict, measure error, compute gradient, update) that every larger model repeats.",
  ],
  stages: [
    { id: "predict", title: "Guess a line", detail: "Start with w = 0 and b = 0, a flat line at zero. Every prediction is wrong, which is fine.", pseudo: "w, b = 0, 0" },
    { id: "errors", title: "Measure the misses", detail: "Each red gap is a residual: prediction minus actual. Square them and average to get the MSE.", pseudo: "mse = mean((w*x + b - y)²)" },
    { id: "gradient", title: "Find which way to nudge", detail: "The gradient tells us how the MSE changes as w or b changes. Positive means “decrease it”.", pseudo: "dw = 2·mean(err·x);  db = 2·mean(err)" },
    { id: "update", title: "Nudge and repeat", detail: "Move w and b a learning-rate-sized step against their gradients. The line tilts and lifts into place.", pseudo: "w -= lr*dw;  b -= lr*db" },
    { id: "done", title: "Settled", detail: "The error stops changing, and the line lands on the exact least-squares answer (dashed).", pseudo: "if Δmse < tol: stop" },
    { id: "diverged", title: "Or: it blew up", detail: "Too large a learning rate makes every step overshoot further. Lower it and try again.", pseudo: "mse → ∞  (lr too big)" },
  ],
  legend: [
    { tone: "current", label: "Current line" },
    { tone: "swap", label: "Errors (residuals)" },
    { tone: "idle", label: "Exact best fit (dashed)" },
  ],
  complexity: {
    time: "O(steps × n)",
    space: "O(n)",
    why: "Each step looks at every point once to compute the error and its gradient. The exact formula is O(n) too, but it only exists for linear models; gradient descent works for anything.",
  },
  pitfalls: [
    "Squaring makes outliers loud: one far-off point can drag the whole line towards it. Try clicking a point far from the rest.",
    "A line can only fit a line. If the points curve, the residuals show a pattern (all positive in the middle, negative at the ends).",
    "Without scaling x first, the slope and intercept learn at very different speeds. This page standardises x behind the scenes, like real libraries do.",
  ],
  tryThis: [
    "Click the plot to add points and watch the fitted line move.",
    "Set the learning rate to 0.02 and count the steps, then try 0.5.",
    "Try 1.05: the error explodes, because each step overshoots by more than the last.",
  ],
  python: linearRegressionPy,
};

export const lrGuideStepFor = (s: LrStep) => s.phase;

export const kMeansGuide: AlgorithmGuide = {
  title: "K-Means Clustering",
  whenToUseHeading: ML_HEADING,
  idea: [
    "K-means splits unlabelled points into k groups, where k is a number you pick. Nobody tells it what the groups are: it finds points that sit close together.",
    "It alternates two simple moves. Assign: every point joins the centre nearest to it. Update: every centre moves to the average position of its points. Then assign again, because some points are now closer to a different centre.",
    "Each move can only reduce the total squared distance from points to their centres, so it always stops. But where it stops depends on where the centres started, which is why k-means++ spreads the first centres out.",
  ],
  whenToUse: [
    "Customer segments, grouping similar documents, compressing an image's colours to a palette of k.",
    "As a quick first look at unlabelled data before deciding how to model it.",
    "When the groups are roughly round and similar in size. For long, curved or nested shapes, use something else (DBSCAN, spectral clustering).",
  ],
  stages: [
    { id: "init", title: "Place k centres", detail: "Random points, or k-means++, which picks each new centre far from the ones already placed.", pseudo: "centres = init(points, k)" },
    { id: "assign", title: "Each point joins its nearest centre", detail: "Measure the distance to every centre and colour the point by the closest one.", pseudo: "label[p] = argmin dist(p, centre)" },
    { id: "update", title: "Move centres to the middle", detail: "Each centre jumps to the mean of the points assigned to it. The arrows show how far it moved.", pseudo: "centre[c] = mean(points in c)" },
    { id: "converged", title: "Stop when nothing changes", detail: "If no point switches cluster, the centres won't move again, so we're done.", pseudo: "if labels unchanged: stop" },
  ],
  legend: [
    { tone: "current", label: "Centre" },
    { tone: "visited", label: "Points, coloured by cluster" },
    { tone: "compare", label: "How far a centre moved" },
  ],
  complexity: {
    time: "O(rounds × n × k)",
    space: "O(n + k)",
    why: "Each assign step compares every point with every centre. It usually settles within a handful of rounds.",
  },
  pitfalls: [
    "You have to choose k. Plot inertia for k = 1, 2, 3… and look for the “elbow” where adding clusters stops helping much.",
    "Bad starting centres give bad clusters: two centres in one blob, none in another. Re-run with a new seed, or use k-means++.",
    "It uses straight-line distance, so features need similar scales, and it can't find non-round shapes.",
  ],
  tryThis: [
    "Set k to 2 or 5 on three obvious groups and see what it does.",
    "Switch to Random start and press “New start” a few times: some runs split a group in two.",
    "Click the plot to add points between two groups and watch them get pulled to one side.",
  ],
  python: kMeansPy,
};

export const kMeansGuideStepFor = (s: KMeansStep) => s.phase;

export const attentionGuide: AlgorithmGuide = {
  title: "Self-Attention",
  whenToUseHeading: ML_HEADING,
  idea: [
    "In “The cat sat on the mat because it was tired”, you know “it” means the cat. A language model has to work that out too. Self-attention is how each word looks at the other words and pulls in the ones that matter for its meaning.",
    "Every word makes three vectors from its embedding. A query: what am I looking for? A key: what can I be found by? A value: what do I pass on if chosen? A word compares its query with every key; a good match gives a high score.",
    "Softmax turns the scores into shares that add up to 100%, and the word's new meaning is the values blended by those shares. Transformers (GPT, Claude, BERT) stack many of these layers, each with several attention “heads” running side by side.",
    "The numbers on this page are a toy: each word has five named features and the query matrix is set by hand, so you can follow the arithmetic. A real model learns hundreds of unnamed dimensions, but the computation is the same.",
  ],
  whenToUse: [
    "Inside every transformer: language models, translation, and vision transformers that treat image patches like words.",
    "Interview classics: “what are Q, K and V?”, “why divide by √d?”, “why is attention O(n²)?”.",
    "Attention maps (the grid here) are a common, if rough, way to peek at what a model connects.",
  ],
  stages: [
    { id: "embed", title: "Start from each word's embedding", detail: "A vector of numbers standing for the word. Here its five features are named so you can read them.", pseudo: "e = embedding[word]" },
    { id: "query", title: "Make the query", detail: "Multiply the embedding by Wq to get what this word is looking for. “it” looks for a thing, ideally an animal, not a person.", pseudo: "q = e · Wq" },
    { id: "keys", title: "Every word offers a key", detail: "Keys describe what each word can be found by. In this toy, Wk is the identity, so a key is just the word's features.", pseudo: "k_j = e_j · Wk" },
    { id: "scores", title: "Score every word", detail: "The dot product of the query with each key. It's large when they point the same way.", pseudo: "s_j = q · k_j" },
    { id: "scale", title: "Scale down by √d", detail: "Long vectors give big dot products, which would make softmax pick one word and ignore the rest. Dividing by √d keeps scores in a sensible range.", pseudo: "s_j = s_j / √d" },
    { id: "softmax", title: "Turn scores into shares", detail: "Softmax makes every score positive and the shares add up to 1. These are the attention weights.", pseudo: "a = softmax(s)" },
    { id: "blend", title: "Blend the values", detail: "The word's new vector is the values mixed by the weights. “it” now carries “animal” from “cat”.", pseudo: "out = Σ a_j · v_j" },
  ],
  legend: [
    { tone: "current", label: "The word doing the looking" },
    { tone: "found", label: "Attention weight (brighter is more)" },
    { tone: "visited", label: "Query" },
    { tone: "pointer", label: "Keys" },
  ],
  complexity: {
    time: "O(n² · d)",
    space: "O(n²)",
    why: "Every word scores every other word, so doubling the text length quadruples the work. That's why long context windows are expensive.",
  },
  pitfalls: [
    "Attention weights show where a word looked, not why the model made its final prediction. Treat attention maps as hints.",
    "Forgetting the √d scaling makes softmax nearly one-hot early in training, and gradients vanish.",
    "Self-attention on its own ignores word order. Real models add position information to the embeddings first.",
  ],
  tryThis: [
    "Click “it” in each sentence: in the first it picks “cat” over “mat”, in the second “book” over “Maya”.",
    "Click a verb like “sat”: it looks for whoever is doing it.",
    "Click “the”: in this toy, small words have no features, so they spread attention evenly.",
  ],
  python: selfAttentionPy,
};

export const attentionGuideStepFor = (s: AttentionStep) => s.phase;

export const samplingGuide: AlgorithmGuide = {
  title: "Next-Token Sampling",
  whenToUseHeading: ML_HEADING,
  idea: [
    "A language model writes one token (roughly, one word or word-piece) at a time. For each step it gives every token in its vocabulary a score, called a logit. It doesn't “know” the next word: it has a ranking of how likely each one is.",
    "Softmax turns the scores into probabilities. Temperature reshapes them first: below 1 the favourite gets even more likely (focused, repetitive), above 1 the long tail gets a bigger share (varied, sometimes odd).",
    "Top-k and top-p cut the unlikely tail before picking, so a high temperature can't pick nonsense. Top-k keeps a fixed number of words; top-p keeps however many it takes to cover p of the probability. Then the model rolls the dice over what's left.",
    "The candidate words and their scores here are written by hand for each prompt; a real model scores tens of thousands of tokens. Everything after the scores works exactly as in real decoders.",
  ],
  whenToUse: [
    "The temperature, top_k and top_p settings in every LLM API and chat playground.",
    "Low temperature (0–0.3) for code and facts; around 0.7–1 for writing; higher only for brainstorming.",
    "Interview questions: “why does the same prompt give different answers?”, “what does temperature 0 do?”, “top-k vs top-p?”.",
  ],
  stages: [
    { id: "logits", title: "Score every candidate", detail: "The model's final layer outputs one raw score per token.", pseudo: "logits = model(prompt)" },
    { id: "temperature", title: "Apply temperature", detail: "Divide every score by T. Small T stretches the gaps, large T squeezes them.", pseudo: "logits = logits / T" },
    { id: "softmax", title: "Softmax to probabilities", detail: "Exponentiate and normalise, so every probability is positive and they add up to 1.", pseudo: "p = exp(logits) / Σ exp(logits)" },
    { id: "topk", title: "Top-k: keep the k likeliest", detail: "Everything below the k-th word is dropped. Off by default.", pseudo: "keep = top k of p" },
    { id: "topp", title: "Top-p: keep until the total reaches p", detail: "Take words from most to least likely until their probabilities add up to p. Also called nucleus sampling.", pseudo: "keep = smallest set with Σp ≥ P" },
    { id: "renormalise", title: "Rescale what's left", detail: "Divide the surviving probabilities by their total so they add up to 1 again.", pseudo: "p = p[keep] / Σ p[keep]" },
    { id: "sample", title: "Roll the dice", detail: "Pick one word at random, weighted by its probability. Then append it to the text and do it all again for the next word.", pseudo: "next = random.choice(p)" },
  ],
  legend: [
    { tone: "current", label: "Probability" },
    { tone: "idle", label: "Filtered out" },
    { tone: "found", label: "Picked word" },
  ],
  complexity: {
    time: "O(V log V)",
    space: "O(V)",
    why: "V is the vocabulary size. Softmax is O(V); top-k and top-p need the probabilities in order, which is a sort (or a partial sort for top-k).",
  },
  pitfalls: [
    "Temperature 0 isn't a real division by zero: APIs treat it as “always take the top word” (greedy decoding).",
    "Greedy decoding tends to loop and repeat itself in longer text. A little randomness usually reads better.",
    "Top-p adapts: when the model is confident it keeps one or two words, when it's unsure it keeps many. Top-k always keeps k, even when only one makes sense.",
  ],
  tryThis: [
    "On “The capital of France is”, drag temperature to 2: watch “Berlin” become possible, then set top-p to 0.9 to rule it out again.",
    "On the story prompt, set temperature to 0.2 and press “Sample 20×”: nearly always the same word.",
    "Set top-k to 1: that's greedy decoding.",
  ],
  python: samplingPy,
};

export const samplingGuideStepFor = (s: SamplingStep) => s.phase;

export const neuralNetworkGuide: AlgorithmGuide = {
  title: "Neural Network",
  whenToUseHeading: ML_HEADING,
  idea: [
    "A neuron takes some numbers, multiplies each by a weight, adds them up with a bias, and squashes the total through an activation function (here tanh). On its own that can only draw a straight line between two classes.",
    "Put a layer of neurons in the middle and their outputs become new features the final neuron combines. Each hidden neuron draws one line; the output bends and mixes them into curves, which is how the network solves XOR and the circle.",
    "Training is a loop. Forward: push the data through and get predictions. Loss: score how wrong they are. Backward (backpropagation): use the chain rule to work out every weight's share of the blame. Update: nudge every weight against its blame. Thousands of repeats later, the shaded background shows what the network believes everywhere.",
  ],
  whenToUse: [
    "Images, speech, text: anywhere the useful features are too complex to design by hand. Large language models are this, scaled up enormously.",
    "On small tabular data, simpler models (trees, logistic regression) are often just as good and easier to explain.",
    "Interview staples: “explain backprop”, “why do we need non-linear activations?”, “what is a vanishing gradient?”.",
  ],
  stages: [
    { id: "forward", title: "Forward pass", detail: "Each hidden neuron computes tanh(w₁x + w₂y + b); the output neuron combines them and the sigmoid turns that into a probability.", pseudo: "h = tanh(W1·x + b1);  p = σ(W2·h + b2)" },
    { id: "loss", title: "Measure the loss", detail: "Cross-entropy: −log of the probability given to the right answer. Confident mistakes cost the most.", pseudo: "L = −mean(y·log p + (1−y)·log(1−p))" },
    { id: "backward", title: "Backward pass (backprop)", detail: "Start from the output error, p − y, and pass it back through each weight and activation with the chain rule.", pseudo: "dW2 = (p−y)·h;  dW1 = (p−y)·W2·(1−h²)·x" },
    { id: "update", title: "Update every weight", detail: "Subtract learning rate × gradient from each weight. That's one training step.", pseudo: "W -= lr * dW" },
    { id: "train", title: "Repeat", detail: "Forward, loss, backward, update, over and over. Watch the boundary bend and the loss fall.", pseudo: "for epoch in range(N): ..." },
    { id: "done", title: "Trained", detail: "The background shading is the network's prediction at every spot, including places it never saw a point.", pseudo: "predict(x) = p ≥ 0.5" },
  ],
  legend: [
    { tone: "current", label: "Class A (teal)" },
    { tone: "visited", label: "Class B (violet)" },
    { tone: "compare", label: "Gradient (blame)" },
    { tone: "swap", label: "Negative weight" },
  ],
  complexity: {
    time: "O(epochs × n × weights)",
    space: "O(weights)",
    why: "Every training step runs every point forward and backward through every weight. Backprop costs about twice a forward pass, which is what makes training big networks possible at all.",
  },
  pitfalls: [
    "Without a non-linear activation, stacking layers is still a straight line. Try XOR with 1 hidden neuron: it can't solve it.",
    "Too few neurons can't draw the shape; too many, trained too long on too little data, memorise the noise (overfitting).",
    "A learning rate that's too high makes the loss bounce or explode; too low and nothing seems to happen.",
  ],
  tryThis: [
    "Pick XOR with 1 hidden neuron, then 2, then 4.",
    "Try the spiral with 8 neurons: it's much harder, and needs every one of them.",
    "Drop the learning rate to 0.1 and compare the loss curve with the default.",
  ],
  python: tinyMlpPy,
};

export const mlpGuideStepFor = (s: MlpStep) => s.phase;
