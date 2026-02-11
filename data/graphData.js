

const cities = [
  { id: "Karachi", lat: 24.8607, lon: 67.0011 },
  { id: "Hyderabad", lat: 25.3960, lon: 68.3578 },
  { id: "Sukkur", lat: 27.7052, lon: 68.8574 },
  { id: "Quetta", lat: 30.1798, lon: 66.9750 },

  { id: "Multan", lat: 30.1575, lon: 71.5249 },
  { id: "Bahawalpur", lat: 29.3544, lon: 71.6911 },
  { id: "Lahore", lat: 31.5204, lon: 74.3587 },
  { id: "Faisalabad", lat: 31.4180, lon: 73.0790 },

  { id: "Gujranwala", lat: 32.1877, lon: 74.1945 },
  { id: "Gujrat", lat: 32.5731, lon: 74.0750 },
  { id: "Sialkot", lat: 32.4945, lon: 74.5229 },
  { id: "Jhelum", lat: 32.9331, lon: 73.7264 },
  { id: "Sargodha", lat: 32.0836, lon: 72.6711 },

  { id: "Islamabad", lat: 33.6844, lon: 73.0479 },
  { id: "Rawalpindi", lat: 33.5651, lon: 73.0169 },
  { id: "Peshawar", lat: 34.0151, lon: 71.5249 },
  { id: "Mardan", lat: 34.1986, lon: 72.0404 },
  { id: "Abbottabad", lat: 34.1688, lon: 73.2215 },

  { id: "Muzaffarabad", lat: 34.3700, lon: 73.4700 },
  { id: "Gilgit", lat: 35.9208, lon: 74.3080 },
];



function haversineDistanceKm(a, b) {
  const R = 6371; // Earth radius in km

  const toRad = deg => deg * Math.PI / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}



function projectCitiesToSvg() {
  const lats = cities.map(c => c.lat);
  const lons = cities.map(c => c.lon);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const width = 1000;
  const height = 600;

  // Padding so nodes don't touch edges
  const padX = 60;
  const padY = 50;

  const points = {};

  cities.forEach(city => {
    const x =
      padX +
      ((city.lon - minLon) / (maxLon - minLon)) *
      (width - 2 * padX);

    // invert Y axis for SVG coordinate system
    const y =
      padY +
      (1 - (city.lat - minLat) / (maxLat - minLat)) *
      (height - 2 * padY);

    points[city.id] = { x, y };
  });

  return points;
}



const roads = [
  // Sindh
  ["Karachi", "Hyderabad"],
  ["Hyderabad", "Sukkur"],

  // Balochistan
  ["Karachi", "Quetta"],
  ["Sukkur", "Quetta"],

  // Punjab
  ["Sukkur", "Multan"],
  ["Multan", "Bahawalpur"],
  ["Bahawalpur", "Lahore"],
  ["Multan", "Faisalabad"],
  ["Faisalabad", "Lahore"],

  ["Lahore", "Gujranwala"],
  ["Gujranwala", "Gujrat"],
  ["Gujranwala", "Sialkot"],
  ["Gujrat", "Jhelum"],

  // Capital / North
  ["Islamabad", "Rawalpindi"],
  ["Rawalpindi", "Jhelum"],
  ["Islamabad", "Abbottabad"],
  ["Abbottabad", "Muzaffarabad"],
  ["Muzaffarabad", "Gilgit"],

  // KP
  ["Islamabad", "Peshawar"],
  ["Peshawar", "Mardan"],
  ["Mardan", "Abbottabad"],

  // Extra connectivity
  ["Sargodha", "Faisalabad"],
  ["Sargodha", "Jhelum"],
  ["Sargodha", "Islamabad"],
];



function buildGraph() {
  const cityById = Object.fromEntries(
    cities.map(c => [c.id, c])
  );

  const graph = {};
  cities.forEach(c => graph[c.id] = []);

  roads.forEach(([a, b]) => {
    const distance = haversineDistanceKm(
      cityById[a],
      cityById[b]
    );

    const cost = Math.max(1, Math.round(distance));

    graph[a].push({ to: b, cost });
    graph[b].push({ to: a, cost });
  });

  // Ensure deterministic traversal order
  Object.keys(graph).forEach(city => {
    graph[city].sort((x, y) =>
      x.to.localeCompare(y.to)
    );
  });

  return graph;
}
