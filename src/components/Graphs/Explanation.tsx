import React from "react";

const Explanation: React.FC = () => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg mt-6">
      <h2 className="text-2xl font-bold mb-4">
        Graph Data Structure and Traversals
      </h2>

      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-2">What is a Graph?</h3>
        <p>
          A graph is a collection of nodes (also called vertices) connected by
          edges. Graphs are a fundamental data structure used to represent
          relationships between objects. They are widely used in areas such as
          network analysis, social graphs, web structure, and more. Graphs can
          be:
        </p>
        <ul className="list-disc list-inside mt-2">
          <li>
            <strong>Directed:</strong> Edges have a direction, representing a
            one-way relationship.
          </li>
          <li>
            <strong>Undirected:</strong> Edges are bidirectional, representing a
            mutual relationship.
          </li>
        </ul>
        <p className="mt-2">
          Learn more:
          <a
            href="https://en.wikipedia.org/wiki/Graph_(discrete_mathematics)"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline ml-1"
          >
            Wikipedia: Graph (Discrete Mathematics)
          </a>
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Graph Traversal Methods</h3>
        <p>
          Graph traversal refers to visiting every vertex in a graph in a
          systematic way. There are two primary methods of traversing graphs:
          Breadth-First Search (BFS) and Depth-First Search (DFS). Both methods
          explore nodes starting from a given vertex but differ in how they
          explore neighboring vertices.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">
          Breadth-First Search (BFS)
        </h3>
        <p>
          Breadth-First Search (BFS) explores a graph level by level, visiting
          all neighbors of a node before moving on to the next level of nodes.
          It uses a queue data structure to keep track of nodes to visit next.
        </p>
        <ul className="list-disc list-inside mt-2">
          <li>
            <strong>Time Complexity:</strong> O(V + E), where V is the number of
            vertices and E is the number of edges.
          </li>
          <li>
            <strong>Space Complexity:</strong> O(V) due to the queue.
          </li>
        </ul>
        <p className="mt-2">
          Learn more:
          <a
            href="https://en.wikipedia.org/wiki/Breadth-first_search"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline ml-1"
          >
            Wikipedia: Breadth-First Search
          </a>
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Depth-First Search (DFS)</h3>
        <p>
          Depth-First Search (DFS) explores a graph by going as deep as possible
          along each branch before backtracking. DFS can be implemented using
          either recursion or a stack.
        </p>
        <ul className="list-disc list-inside mt-2">
          <li>
            <strong>Time Complexity:</strong> O(V + E), where V is the number of
            vertices and E is the number of edges.
          </li>
          <li>
            <strong>Space Complexity:</strong> O(V) due to the stack or
            recursion.
          </li>
        </ul>
        <p className="mt-2">
          Learn more:
          <a
            href="https://en.wikipedia.org/wiki/Depth-first_search"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline ml-1"
          >
            Wikipedia: Depth-First Search
          </a>
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">When to Use BFS vs DFS</h3>
        <p>
          BFS and DFS are used in different scenarios depending on the nature of
          the problem:
        </p>
        <ul className="list-disc list-inside mt-2">
          <li>
            <strong>Use BFS</strong> when you need to find the shortest path in
            an unweighted graph, or when you want to explore all nodes at the
            present depth level before moving on.
          </li>
          <li>
            <strong>Use DFS</strong> when you want to explore as far as possible
            down each branch before backtracking, or when searching in trees and
            graphs where you need to traverse deeper paths first.
          </li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">Additional Resources</h3>
        <ul className="list-disc list-inside mt-2">
          <li>
            <a
              href="https://visualgo.net/en/dfsbfs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Visualizing BFS and DFS on VisuAlgo
            </a>
          </li>
          <li>
            <a
              href="https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              GeeksforGeeks: Graph Data Structure and Algorithms
            </a>
          </li>
          <li>
            <a
              href="https://opendsa-server.cs.vt.edu/OpenDSA/Books/CS3/html/GraphTraversal.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              OPEN DSA Notes: Graph Algorithms
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
};

export default Explanation;
