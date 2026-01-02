import { buildGraph, cities, projectCitiesToSvg } from "./data/graphData.js";



const pause = ms => new Promise(r => setTimeout(r, ms));

function tracePath(parents, source, target) {
  const result = [];
  let current = target;

  while (current !== null && current !== undefined) {
    result.push(current);
    current = parents[current];
  }

  result.reverse();
  return result[0] === source ? result : [];
}

function calculateCost(graph, path) {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const edge = graph[path[i]].find(e => e.to === path[i + 1]);
    if (!edge) return Infinity;
    total += edge.cost;
  }
  return total;
}

function pathEdges(path) {
  const set = new Set();
  for (let i = 0; i < path.length - 1; i++) {
    set.add(`${path[i]}__${path[i + 1]}`);
    set.add(`${path[i + 1]}__${path[i]}`);
  }
  return set;
}



function breadthFirst(graph, start, goal) {
  const queue = [start];
  const visited = new Set([start]);
  const parent = { [start]: null };
  const order = [];

  while (queue.length) {
    const node = queue.shift();
    order.push(node);

    if (node === goal) break;

    for (const n of graph[node]) {
      if (!visited.has(n.to)) {
        visited.add(n.to);
        parent[n.to] = node;
        queue.push(n.to);
      }
    }
  }

  const path = tracePath(parent, start, goal);
  return {
    algorithm: "BFS",
    visitedOrder: order,
    path,
    steps: order.length,
    cost: calculateCost(graph, path)
  };
}

function depthFirst(graph, start, goal) {
  const stack = [start];
  const visited = new Set();
  const parent = { [start]: null };
  const order = [];

  while (stack.length) {
    const node = stack.pop();
    if (visited.has(node)) continue;

    visited.add(node);
    order.push(node);
    if (node === goal) break;

    [...graph[node]].reverse().forEach(n => {
      if (!visited.has(n.to)) {
        if (parent[n.to] === undefined) parent[n.to] = node;
        stack.push(n.to);
      }
    });
  }

  const path = tracePath(parent, start, goal);
  return {
    algorithm: "DFS",
    visitedOrder: order,
    path,
    steps: order.length,
    cost: calculateCost(graph, path)
  };
}

function uniformCost(graph, start, goal) {
  const distance = {};
  const parent = {};
  const visited = new Set();
  const order = [];

  Object.keys(graph).forEach(k => distance[k] = Infinity);
  distance[start] = 0;
  parent[start] = null;

  const pq = [{ node: start, cost: 0 }];

  while (pq.length) {
    pq.sort((a, b) => a.cost - b.cost);
    const { node } = pq.shift();
    if (visited.has(node)) continue;

    visited.add(node);
    order.push(node);
    if (node === goal) break;

    for (const n of graph[node]) {
      const alt = distance[node] + n.cost;
      if (alt < distance[n.to]) {
        distance[n.to] = alt;
        parent[n.to] = node;
        pq.push({ node: n.to, cost: alt });
      }
    }
  }

  const path = tracePath(parent, start, goal);
  return {
    algorithm: "UCS",
    visitedOrder: order,
    path,
    steps: order.length,
    cost: path.length ? distance[goal] : Infinity
  };
}



const graph = buildGraph();
const coords = projectCitiesToSvg();
const svg = document.getElementById("mapSvg");

const nodes = new Map();
const edges = new Map();

function svgNode(tag, attrs) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

function renderGraph() {
  svg.innerHTML = "";
  nodes.clear();
  edges.clear();

  const drawn = new Set();

  Object.keys(graph).forEach(a => {
    graph[a].forEach(b => {
      const key = a < b.to ? `${a}__${b.to}` : `${b.to}__${a}`;
      if (drawn.has(key)) return;
      drawn.add(key);

      const p1 = coords[a], p2 = coords[b.to];
      const line = svgNode("line", {
        x1: p1.x, y1: p1.y,
        x2: p2.x, y2: p2.y
      });
      svg.appendChild(line);
      edges.set(`${a}__${b.to}`, line);
      edges.set(`${b.to}__${a}`, line);
    });
  });

  cities.forEach(c => {
    const { x, y } = coords[c.id];
    const circle = svgNode("circle", { cx: x, cy: y, r: 10 });
    const label = svgNode("text", { x: x + 14, y: y + 4 });
    label.textContent = c.id;
    svg.appendChild(circle);
    svg.appendChild(label);
    nodes.set(c.id, circle);
  });
}
