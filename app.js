// graphData.js is loaded before this file via a script tag



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

/* ── Populate dropdowns ─────────────────────────────── */
const startSelect = document.getElementById("startSelect");
const goalSelect = document.getElementById("goalSelect");

cities.forEach(c => {
  startSelect.add(new Option(c.id, c.id));
  goalSelect.add(new Option(c.id, c.id));
});

// Set sensible defaults
startSelect.value = "Karachi";
goalSelect.value = "Islamabad";

/* ── Algorithm toggle buttons ───────────────────────── */
let selectedAlgo = "DFS";
const algoBtns = document.querySelectorAll(".seg-btn");

algoBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    algoBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedAlgo = btn.dataset.algo;
    document.getElementById("outAlgo").textContent = selectedAlgo;
    updateNote();
  });
});

/* ── Algorithm descriptions ─────────────────────────── */
const notes = {
  BFS: "BFS explores level by level and guarantees the shortest path in unweighted graphs.",
  DFS: "DFS explores depth-first and does not guarantee the shortest path.",
  UCS: "UCS expands the lowest-cost node first and guarantees the optimal (least-cost) path."
};

function updateNote() {
  document.getElementById("outNote").textContent = notes[selectedAlgo];
}

/* ── Visualization helpers ──────────────────────────── */
function resetStyles() {
  nodes.forEach(circle => {
    circle.removeAttribute("style");
    circle.setAttribute("r", 10);
  });
  edges.forEach(line => {
    line.classList.remove("active-path");
    line.removeAttribute("style");
  });
}

async function animateResult(result) {
  const delay = parseInt(document.getElementById("delayInput").value, 10) || 500;
  const mode = document.getElementById("modeSelect").value;

  resetStyles();

  /* 1. Animate visited nodes (unless pathOnly mode) */
  if (mode === "visited") {
    for (const cityId of result.visitedOrder) {
      const circle = nodes.get(cityId);
      if (circle) {
        circle.style.fill = "#FFA500";   // orange = visited
        circle.setAttribute("r", 13);
      }
      await pause(delay);
    }
  }

  /* 2. Animate path edges one-by-one with glow */
  for (let i = 0; i < result.path.length - 1; i++) {
    const a = result.path[i];
    const b = result.path[i + 1];
    const key1 = `${a}__${b}`;
    const key2 = `${b}__${a}`;
    const line = edges.get(key1) || edges.get(key2);
    if (line) {
      line.classList.add("active-path");
    }
    await pause(delay);
  }

  /* 3. Highlight final path nodes */
  result.path.forEach(cityId => {
    const circle = nodes.get(cityId);
    if (circle) {
      circle.style.fill = "#00f5ff";
      circle.setAttribute("r", 14);
    }
  });

  /* Mark start and goal with distinct colours */
  const startCircle = nodes.get(result.path[0]);
  const goalCircle = nodes.get(result.path[result.path.length - 1]);
  if (startCircle) startCircle.style.fill = "#00cc44";   // green
  if (goalCircle) goalCircle.style.fill = "#cc0000";   // red
}

/* ── Find-path handler ──────────────────────────────── */
document.getElementById("findBtn").addEventListener("click", async () => {
  const start = startSelect.value;
  const goal = goalSelect.value;

  if (start === goal) {
    alert("Start and goal are the same city!");
    return;
  }

  let result;
  switch (selectedAlgo) {
    case "BFS": result = breadthFirst(graph, start, goal); break;
    case "DFS": result = depthFirst(graph, start, goal); break;
    case "UCS": result = uniformCost(graph, start, goal); break;
  }

  /* Update output panel */
  document.getElementById("outAlgo").textContent = result.algorithm;
  document.getElementById("outSteps").textContent = result.steps;
  document.getElementById("outCost").textContent = result.cost === Infinity ? "∞" : result.cost;
  document.getElementById("outPath").textContent = result.path.length
    ? result.path.join(" → ")
    : "No path found";

  updateNote();
  await animateResult(result);
});

/* ── Reset handler ──────────────────────────────────── */
document.getElementById("resetBtn").addEventListener("click", () => {
  resetStyles();
  document.getElementById("outSteps").textContent = "0";
  document.getElementById("outCost").textContent = "0";
  document.getElementById("outPath").textContent = "—";
});

/* ── Initial render ─────────────────────────────────── */
renderGraph();
