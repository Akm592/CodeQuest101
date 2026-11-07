// "How it works" for the Machine Learning & AI pages.
//
// Each guide's stages line up one-to-one with its step generator's `phase`, so
// the stage mapping is just the phase. guides.test.ts runs the pages' default
// inputs through the generators to prove every stage is reached.

import type { AttentionStep } from "../ml/attention";
import type { TreeStep } from "../ml/decisionTree";
import type { Gd1dStep } from "../ml/gd1d";
import type { GdStep } from "../ml/gradientDescent";
import type { BoostStep } from "../ml/gradientBoosting";
import type { KMeansStep } from "../ml/kMeans";
import type { LrStep } from "../ml/linearRegression";
import type { MlpStep } from "../ml/mlp";
import type { NbStep } from "../ml/naiveBayes";
import type { ForestStep } from "../ml/randomForest";
import type { SamplingStep } from "../ml/sampling";
import decisionTreePy from "./python/decision_tree.py?raw";
import gradientBoostingPy from "./python/gradient_boosting.py?raw";
import gradientDescentPy from "./python/gradient_descent.py?raw";
import kMeansPy from "./python/k_means.py?raw";
import linearRegressionPy from "./python/linear_regression.py?raw";
import naiveBayesPy from "./python/naive_bayes.py?raw";
import randomForestPy from "./python/random_forest.py?raw";
import samplingPy from "./python/sampling.py?raw";
import selfAttentionPy from "./python/self_attention.py?raw";
import tinyMlpPy from "./python/tiny_mlp.py?raw";
import type { AlgorithmGuide } from "./types";

const ML_HEADING = "Where you'll meet it";

export const gradientDescentGuide: AlgorithmGuide = {
  title: "Gradient Descent",
  whenToUseHeading: ML_HEADING,
  idea: [
    "A model learns by adjusting its settings, called weights, to make its mistakes smaller. Picture the mistakes as a hilly landscape: each spot is one choice of weights, and the height is how wrong the model is there. Learning means finding a low spot.",
    "Imagine standing on that hill in thick fog. You can't see the bottom, but you can feel which way the ground slopes under your feet. So you take a step downhill, feel again, and repeat. That's gradient descent. The slope is called the gradient, and the size of each step is the learning rate.",
    "The learning rate is the one setting that matters most. Too small and you crawl; too big and you jump past the bottom and land higher up the other side, again and again, until you fly off. Improvements like momentum and Adam change how big each step is and which way it points, but the idea stays the same.",
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
    "A falling loss doesn't mean you found the best answer. On “Two valleys”, plain descent at a small learning rate settles in the shallower valley: a local minimum. The learning rate and momentum both change which valley you end in.",
    "Features on very different scales make a narrow valley. Standardising inputs (as the regression page does) rounds it out so plain descent works.",
  ],
  tryThis: [
    "In the one-weight view, try learning rates 0.5 (one step), 1 (bounces forever) and 1.05 (blows up).",
    "On the map's “Narrow valley”, compare Plain and Momentum at the same learning rate: count the steps.",
    "On “Two valleys”, click the left half of the map to start there instead. It finds the deeper valley.",
    "In the race, pick “Saddle point” and watch which methods pause in the middle.",
  ],
  python: gradientDescentPy,
};

export const gdGuideStepFor = (s: GdStep) => s.phase;

/** The one-weight view uses the same stages; "bounce" is a kind of stop. */
export const gd1dGuideStepFor = (s: Gd1dStep) => (s.phase === "bounce" ? "stop" : s.phase);

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
    why: "Each step looks at every point once to compute the error and its gradient. The exact formula is O(n) for one feature too, but it only exists for models that are linear in their weights (which includes the polynomial curves on this page); gradient descent works for any model.",
  },
  pitfalls: [
    "Squaring makes outliers loud: one far-off point can drag the whole line towards it (see the outlier section).",
    "A line can only fit a line. If the points curve, the residuals show a pattern; add curved features (x², x³ …), but not too many, or it overfits.",
    "When training with gradient descent, scale x first, or the slope and intercept learn at very different speeds. This page does that behind the scenes. (scikit-learn's LinearRegression solves for the exact answer directly, so it doesn't need to.)",
    "A high R² on the training data isn't proof of a good model: a degree-15 curve gets a great training score and can still be wildly wrong on new points.",
  ],
  tryThis: [
    "Click the plot to add points and watch the fitted line move.",
    "Set the learning rate to 0.02 and count the steps, then try 0.5.",
    "Try 1.05: the error explodes, because each step overshoots by more than the last.",
    "Add the outlier and compare the two lines, then try degree 15 on the curve section with a few different samples.",
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
    "Softmax turns the scores into shares that add up to 100%, and the word's new meaning is the values blended by those shares. Transformers (GPT, Claude, BERT) stack many of these layers, each with several attention “heads” running side by side. The recipe comes from “Attention Is All You Need” (Vaswani et al., NIPS 2017): Attention(Q, K, V) = softmax(QKᵀ / √d_k) V.",
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
    "Forgetting the √d_k scaling: with long keys the scores spread out by about √d_k, softmax piles nearly all the weight on one word, and its gradient shrinks towards zero (measured on this page).",
    "Decoders (GPT-style models) must mask future words by setting their scores to −∞ before softmax; forgetting it lets the model cheat by reading the answer.",
    "Self-attention on its own ignores word order. Real models add position information to the embeddings first.",
  ],
  tryThis: [
    "Click “it” in each sentence: in the first it picks “cat” over “mat”, in the second “book” over “Maya”.",
    "Click a verb like “sat”: it looks for whoever is doing it.",
    "Click “the”: in this toy, small words have no features, so they spread attention evenly.",
    "In “Why divide by √d_k?”, pick d_k = 512 and compare the two bar charts.",
    "In “Masking”, switch the mask on and off and watch the top-right triangle.",
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
    "A neuron takes some numbers, multiplies each by a weight, adds them up with a bias, and passes the total through an activation function (tanh by default here). On its own, one neuron can only draw a straight line between two classes.",
    "Put a layer of neurons in the middle and their outputs become new features that the output neuron combines. Each hidden neuron responds to one straight-line direction in the input; because the activation bends each response, the output can mix them into a curved boundary. That is how the network solves XOR and the circle.",
    "Training is a loop. Forward: push the data through and get predictions. Loss: score how wrong they are. Backward (backpropagation): use the chain rule to work out every weight's share of the blame. Update: nudge every weight against its blame. A few hundred repeats later, the shaded background shows what the network believes everywhere. The maths section below works through one full step with real numbers.",
  ],
  whenToUse: [
    "Images, speech, text: anywhere the useful features are too complex to design by hand. Large language models are this, scaled up enormously.",
    "On small tabular data, simpler models (trees, logistic regression) are often just as good and easier to explain.",
    "Interview staples: “explain backprop”, “why do we need non-linear activations?”, “what is a vanishing gradient?”.",
  ],
  stages: [
    { id: "forward", title: "Forward pass", detail: "Each hidden neuron computes its weighted sum z = w₁x + w₂y + b and applies the activation; the output neuron combines them and the sigmoid turns that into a probability.", pseudo: "h = act(W1·x + b1);  p = σ(W2·h + b2)" },
    { id: "loss", title: "Measure the loss", detail: "Cross-entropy: −log of the probability given to the right answer. Confident mistakes cost the most.", pseudo: "L = −mean(y·log p + (1−y)·log(1−p))" },
    { id: "backward", title: "Backward pass (backprop)", detail: "Start from the output error, p − y, and pass it back through each weight and each activation's slope with the chain rule.", pseudo: "dW2 = (p−y)·h;  dW1 = (p−y)·W2·act′(z)·x" },
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
    why: "Every training step runs every point forward and backward through every weight. The backward pass costs roughly twice as much as the forward pass, so one training step is about three forward passes' worth of work.",
  },
  pitfalls: [
    "Without a non-linear activation, stacking layers gains nothing: two linear layers merge into one, so the boundary stays a straight line.",
    "One hidden neuron isn't enough for XOR with any activation offered here (tanh, ReLU, Leaky ReLU and sigmoid only ever go up): the output then depends on a single straight-line direction, so its boundary is still a line. Try it with 1 neuron, then 2.",
    "Sigmoid in the hidden layer learns slowly: its slope is at most 0.25, so the blame shrinks on the way back. ReLU can “die”: a neuron stuck with negative input gets a slope of 0 and stops learning.",
    "Too few neurons can't draw the shape; too many, trained too long on too little data, memorise the noise (overfitting).",
    "A learning rate that's too high makes the loss bounce or explode; too low and nothing seems to happen.",
  ],
  tryThis: [
    "Pick XOR with 1 hidden neuron, then 2, then 4.",
    "Try the spiral with 8 neurons: it's much harder, and may still miss some points.",
    "Switch the activation to Sigmoid on the circle and compare the loss curve with Tanh and ReLU.",
    "Drop the learning rate to 0.1 and compare the loss curve with the default.",
  ],
  python: tinyMlpPy,
};

export const mlpGuideStepFor = (s: MlpStep) => s.phase;

export const decisionTreeGuide: AlgorithmGuide = {
  title: "Decision Tree",
  whenToUseHeading: ML_HEADING,
  idea: [
    "A decision tree is a game of 20 questions. Each question looks at one feature and asks yes or no, such as “Is the weight 150 g or less?”. Each answer sends you down a branch to the next question, until you reach a leaf that gives the answer.",
    "To grow one, the computer tries every possible question at every possible cut-off and keeps the one that sorts the points best: each side should be as close as possible to a single class. It measures “mixed-up-ness” with Gini impurity or entropy. Then it does the same again inside each side.",
    "Every question cuts straight across one feature, so on a plot the tree carves the space into rectangles. That makes trees easy to read and explain, but it also means they can keep cutting until every training point has its own box, which is memorising rather than learning.",
  ],
  whenToUse: [
    "When you need to explain a decision: loan approvals, medical triage, any rule a person must be able to follow.",
    "Mixed, messy tabular data: trees need little preparation (no scaling).",
    "As the building block of random forests and boosted trees, which are among the strongest models for tabular data.",
  ],
  stages: [
    { id: "start", title: "Start with every point in one group", detail: "The root holds all the training data. Measure how mixed it is.", pseudo: "node = all points" },
    { id: "consider", title: "Try every question, keep the best", detail: "For each feature and each cut-off between neighbouring values, score the two sides by their size-weighted impurity. The lowest score wins.", pseudo: "best = min over (feature, t) of weighted impurity" },
    { id: "split", title: "Split into yes and no", detail: "Points that answer yes go left, the rest go right. Each side becomes a new, smaller group.", pseudo: "left = x[f] ≤ t;  right = x[f] > t" },
    { id: "leaf", title: "Or stop: make a leaf", detail: "Stop when the group is pure, the depth limit is hit, or no question helps. The leaf predicts its most common class.", pseudo: "leaf.predict = majority class" },
    { id: "done", title: "Repeat inside every branch", detail: "The same steps run inside each side until every branch ends in a leaf. Then a new point just answers the questions from the top.", pseudo: "grow(left); grow(right)" },
  ],
  legend: [
    { tone: "current", label: "Class: teal" },
    { tone: "visited", label: "Class: violet" },
    { tone: "compare", label: "The question being tried" },
  ],
  complexity: {
    time: "about O(features × n log n) per level",
    space: "O(nodes)",
    why: "Each level sorts the points on every feature to try every cut-off. Asking a new point is fast: one question per level, so roughly log(n) questions for a balanced tree.",
  },
  pitfalls: [
    "Overfitting: with no limit, a tree keeps splitting until it gets every training point right, noise included. Limit the depth, require a minimum number of points per leaf, or prune.",
    "Small changes in the data can produce a completely different tree, because one different first question changes everything below it.",
    "Each question looks at one feature, so diagonal borders become staircases, and XOR-like patterns are hard because no single first question helps.",
  ],
  tryThis: [
    "On “Noisy”, raise the depth and watch training accuracy reach 100% while accuracy on new points drops.",
    "On “Diagonal”, see the staircase a tree has to build.",
    "On “Checkerboard”, look at how small the first question's gain is.",
    "Click anywhere on the plot to send a new point down the tree.",
  ],
  python: decisionTreePy,
};

export const decisionTreeGuideStepFor = (s: TreeStep) => s.phase;

export const naiveBayesGuide: AlgorithmGuide = {
  title: "Naive Bayes",
  whenToUseHeading: ML_HEADING,
  idea: [
    "Naive Bayes guesses a class by weighing evidence. For an email it asks: how common is spam in general, and how much more often does each of these words show up in spam than in normal email? Each word nudges the guess one way or the other.",
    "Those word chances come straight from counting the training data: “free” appeared 4 times among the 26 spam words, so it's common in spam. Smoothing adds a pretend count of 1 to every word, so a word that never appeared in one class doesn't make that class impossible.",
    "It's called naive because it treats every word as separate evidence, as if “free” and “money” had nothing to do with each other. That's clearly not true, yet the method still sorts emails surprisingly well, which is why it became a classic method for spam filtering.",
  ],
  whenToUse: [
    "Text: spam filters, sorting support tickets, sentiment, language detection.",
    "When you have little training data, or need something fast to train and explain.",
    "As a quick baseline to beat before trying heavier models.",
  ],
  stages: [
    { id: "prior", title: "Start from the prior", detail: "Before reading anything, the guess is just how common each class was in training.", pseudo: "score[c] = log P(c)" },
    { id: "word", title: "Add each word's evidence", detail: "Look up how likely the word is in each class (counted from training, plus smoothing) and multiply it in, or add its log.", pseudo: "score[c] += log P(word | c)" },
    { id: "skip", title: "Skip words it never saw", detail: "A word that never appeared in training carries no evidence either way, so it's ignored.", pseudo: "if word not in vocab: continue" },
    { id: "normalise", title: "Turn scores into chances", detail: "Divide each score by the total so the two add up to 100%. Both classes share the same divisor, P(email), so it never changes the winner.", pseudo: "P(c | email) = score[c] / Σ score" },
    { id: "decide", title: "Pick the bigger one", detail: "The class with the higher chance wins.", pseudo: "predict = argmax_c score[c]" },
  ],
  legend: [
    { tone: "swap", label: "Pushes towards spam" },
    { tone: "current", label: "Pushes towards not spam" },
    { tone: "idle", label: "Ignored (never seen)" },
  ],
  complexity: {
    time: "O(words) to classify",
    space: "O(classes × vocabulary)",
    why: "Training is a single pass of counting. Classifying an email is one table look-up per word per class.",
  },
  pitfalls: [
    "Forgetting smoothing: one word that never appeared in a class sets that class's chance to exactly 0, whatever the other words say.",
    "Multiplying many small probabilities underflows to 0 on a computer. Add logs instead.",
    "Don't trust the percentages: scikit-learn calls Naive Bayes “a decent classifier” but “a bad estimator” of probabilities. Because repeated or related words are counted as separate evidence, it is often far more confident than it should be.",
  ],
  tryThis: [
    "Pick “free offer today meeting” and switch smoothing off: “meeting” never appears in spam, so spam becomes impossible.",
    "Type “free free free free” and watch the confidence shoot towards 100%.",
    "Type a word the filter has never seen and see it skipped.",
  ],
  python: naiveBayesPy,
};

export const naiveBayesGuideStepFor = (s: NbStep) => s.phase;

export const randomForestGuide: AlgorithmGuide = {
  title: "Random Forest",
  whenToUseHeading: ML_HEADING,
  idea: [
    "One decision tree is jumpy: change the data a little and you get a very different tree. A random forest grows many trees and averages their answers. Their individual mistakes point in different directions, so averaging cancels much of them out, like asking a crowd instead of one person.",
    "Averaging only helps if the trees disagree. Two tricks make them different. Each tree learns from a bootstrap sample: rows picked at random with replacement, so some rows appear twice and about a third are left out. And at every question, each tree may only look at a random few of the features.",
    "The left-out rows are a free test. Each tree never saw about a third of the data, so you can check the forest on those rows (the out-of-bag estimate) without keeping a separate test set.",
  ],
  whenToUse: [
    "Tabular data (spreadsheets, databases) where you want strong accuracy with very little tuning.",
    "When one decision tree overfits or keeps changing with the data.",
    "As a strong baseline. Gradient boosting is the other top choice for tabular data; it needs more tuning.",
  ],
  stages: [
    { id: "one", title: "Grow one tree on a bootstrap sample", detail: "Draw n rows with replacement. Grow a full tree on them, looking at only a random subset of features at each question.", pseudo: "sample = random rows, with replacement" },
    { id: "add", title: "Add more trees, each different", detail: "Every new tree gets its own random sample and its own random questions. The forest's answer is the average of all their probabilities.", pseudo: "p(x) = mean over trees of tree.probs(x)" },
    { id: "done", title: "Predict with the average, check with out-of-bag", detail: "The class with the highest average probability wins. Each row can be tested by the trees that never saw it.", pseudo: "predict = argmax p(x)" },
  ],
  legend: [
    { tone: "current", label: "Class: teal" },
    { tone: "visited", label: "Class: violet" },
    { tone: "idle", label: "Left out of a tree's sample" },
  ],
  complexity: {
    time: "trees × (one tree's cost)",
    space: "trees × (one tree's size)",
    why: "Each tree is grown exactly like a decision tree, just on a resampled copy of the data, and the trees are independent, so they can be grown in parallel.",
  },
  pitfalls: [
    "More trees never make it overfit, but they do make it slower: once the accuracy curve flattens, extra trees just cost time.",
    "The individual trees can still overfit noise; the forest averages that away only partly. Limiting depth or leaf size can still help on very noisy data.",
    "It's much harder to read than a single tree: you can't follow 50 trees by hand. Feature importances help, but scikit-learn warns the default ones favour features with many distinct values.",
  ],
  tryThis: [
    "On “Noisy”, compare one tree with the forest on new points, then watch the forest boundary smooth out as trees are added.",
    "Look at the four sample trees: each one is different, and none is as good as the average.",
    "Check that the out-of-bag estimate lands close to the accuracy on new points.",
  ],
  python: randomForestPy,
};

/** Stage for the forest frames: the first tree, adding trees, the finished forest. */
export const randomForestGuideStepFor = (s: ForestStep) => (s.k === 1 ? "one" : s.done ? "done" : "add");

export const gradientBoostingGuide: AlgorithmGuide = {
  title: "Gradient Boosting",
  whenToUseHeading: ML_HEADING,
  idea: [
    "A random forest grows many trees side by side and averages them. Boosting grows them one after another, and each new tree has one job: fix what the trees so far still get wrong.",
    "It starts with a very simple guess, the average. Then it measures the leftover errors (the residuals: true value minus prediction), fits a small tree to those errors, and adds a little of that tree to the model. Repeat, and the model creeps towards the data, one small correction at a time.",
    "“Gradient” comes from gradient descent: for squared error, the residual is exactly the downhill direction for each prediction, so each tree is a step downhill. The learning rate shrinks every step, which needs more trees but usually generalises better.",
  ],
  whenToUse: [
    "Tabular data (spreadsheets, databases): scikit-learn calls it “an excellent model” for exactly this. XGBoost, LightGBM, CatBoost and scikit-learn's HistGradientBoosting are the popular tools.",
    "Regression and classification alike; only the loss, and so the “residual” each tree fits, changes.",
    "When you can spend a little time tuning the learning rate, tree depth and number of trees.",
  ],
  stages: [
    { id: "start", title: "Start from the average", detail: "The first model predicts the mean of y everywhere.", pseudo: "F₀(x) = mean(y)" },
    { id: "residuals", title: "Measure what's still wrong", detail: "For every point, the residual is the true value minus the current prediction.", pseudo: "rᵢ = yᵢ − F(xᵢ)" },
    { id: "fit", title: "Fit a small tree to the residuals", detail: "Not to y: to the errors. The tree learns where the model is too low or too high.", pseudo: "h = small_tree(x, r)" },
    { id: "add", title: "Add a little of it", detail: "Move the model towards the fix, scaled down by the learning rate.", pseudo: "F ← F + lr · h" },
    { id: "done", title: "Stop at the right number of trees", detail: "Keep the number of trees where the error on new data was lowest; past that it starts fitting noise.", pseudo: "pick n_trees by validation error" },
  ],
  legend: [
    { tone: "current", label: "The model so far" },
    { tone: "swap", label: "Residuals (what's still wrong)" },
    { tone: "compare", label: "The new tree" },
  ],
  complexity: {
    time: "trees × (one small tree's cost)",
    space: "trees × (one small tree's size)",
    why: "Each tree is small, but they have to be grown one after another, because each depends on the errors left by all the ones before it.",
  },
  pitfalls: [
    "Too many trees overfit: training error keeps falling towards 0 while error on new data turns back up. Use a validation set (scikit-learn turns on early stopping by default for large datasets).",
    "A big learning rate with deep trees memorises the data within a few trees. Smaller steps with more trees usually do better.",
    "Unlike a random forest, the trees can't be grown in parallel, and the result is hard to read.",
  ],
  tryThis: [
    "Set the learning rate to 1 and depth to 4: watch it memorise the points within a few trees.",
    "With 0.1 and depth 2, find where the error on new points is lowest, then watch it creep up as more trees are added.",
    "Compare depth 1 (stumps) with depth 3 at the same learning rate.",
  ],
  python: gradientBoostingPy,
};

export const gradientBoostingGuideStepFor = (s: BoostStep) => s.phase;
