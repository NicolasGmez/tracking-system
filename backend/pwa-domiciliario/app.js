const socket = io("https://callie-solemn-echoingly.ngrok-free.dev", {
  transports: ["websocket"]
});

let map;
let currentMarker;
let pickupMarker;
let deliveryMarker;
let routeLine;

// ICONO DE MOTO
const motoIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1048/1048313.png",
  iconSize: [38, 38],
  iconAnchor: [19, 38]
});


// Obtener ubicación inicial
navigator.geolocation.getCurrentPosition((position) => {

  const lat = position.coords.latitude;
  const lng = position.coords.longitude;

  map = L.map('map').setView([lat, lng], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  currentMarker = L.marker([lat, lng], { icon: motoIcon }).addTo(map)
    .bindPopup("Mi ubicación");

});


// Actualizar ubicación constantemente
navigator.geolocation.watchPosition((position) => {

  const lat = position.coords.latitude;
  const lng = position.coords.longitude;

  if (currentMarker) {
    currentMarker.setLatLng([lat, lng]);
  }

  socket.emit("ubicacion", { lat, lng });

}, console.error, {
  enableHighAccuracy: true
});


// Conexión al servidor
socket.on("connect", () => {

  console.log("Conectado al servidor");

  document.getElementById("conexionEstado").innerText = "🟢 Conectado";

  socket.emit("registrar_domiciliario");

});

socket.on("disconnect", () => {
  document.getElementById("conexionEstado").innerText = "🔴 Desconectado";
});


// Recibir ID del domiciliario
socket.on("id_asignado", (id) => {

  console.log("Mi ID es:", id);

  document.getElementById("domId").innerText = id;

});


// Recibir pedido
socket.on("pedido_asignado", async (pedido) => {

  document.getElementById("estado").innerText = "🚚 En ruta hacia el pedido";

  const pickup = [pedido.pickupLat, pedido.pickupLng];
  const delivery = [pedido.deliveryLat, pedido.deliveryLng];

  // Borrar marcadores anteriores
  if (pickupMarker) {
    map.removeLayer(pickupMarker);
  }

  if (deliveryMarker) {
    map.removeLayer(deliveryMarker);
  }

  // Borrar ruta anterior
  if (routeLine) {
    map.removeLayer(routeLine);
  }

  // Crear nuevos marcadores
  pickupMarker = L.marker(pickup).addTo(map)
    .bindPopup("Recoger pedido");

  deliveryMarker = L.marker(delivery).addTo(map)
    .bindPopup("Entregar pedido");

  // Pedir ruta al servidor OSRM
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${pickup[1]},${pickup[0]};${delivery[1]},${delivery[0]}?overview=full&geometries=geojson`
  );

  const data = await response.json();

  const routeCoords = data.routes[0].geometry.coordinates.map(coord => [
    coord[1], coord[0]
  ]);

  // Dibujar nueva ruta
  routeLine = L.polyline(routeCoords, {
    color: "blue",
    weight: 5
  }).addTo(map);

  // Ajustar mapa a la ruta
  map.fitBounds(routeLine.getBounds());

});