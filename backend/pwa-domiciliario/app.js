const socket = io("https://callie-solemn-echoingly.ngrok-free.dev", {
  transports: ["websocket"]
});

let map;
let currentMarker;
let pickupMarker;
let deliveryMarker;
let routeLine;

let registrado = false;
let miId = null;

// ICONO DE MOTO
const motoIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1048/1048313.png",
  iconSize: [38, 38],
  iconAnchor: [19, 38]
});


// ============================
// MAPA INICIAL
// ============================

navigator.geolocation.getCurrentPosition((position) => {

  const lat = position.coords.latitude;
  const lng = position.coords.longitude;

  map = L.map('map').setView([lat, lng], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  currentMarker = L.marker([lat, lng], { icon: motoIcon })
    .addTo(map)
    .bindPopup("Mi ubicación");

});


// ============================
// UBICACIÓN EN TIEMPO REAL
// ============================

navigator.geolocation.watchPosition((position) => {

  const lat = position.coords.latitude;
  const lng = position.coords.longitude;

  if (currentMarker) {
    currentMarker.setLatLng([lat, lng]);
  }

  // 🔥 SOLO ENVÍA SI YA ESTÁ REGISTRADO Y TIENE ID
  if (registrado && miId) {
    socket.emit("ubicacion", { lat, lng });
  }

}, (error) => {
  console.error("Error GPS:", error);
}, {
  enableHighAccuracy: true
});


// ============================
// SOCKET CONEXIÓN
// ============================

socket.on("connect", () => {

  console.log("🟢 Conectado al servidor");

  document.getElementById("conexionEstado").innerText = "🟢 Conectado";

  // 🔥 REGISTRO AUTOMÁTICO
  socket.emit("registrar_domiciliario");

});

socket.on("disconnect", () => {

  console.log("🔴 Desconectado");

  document.getElementById("conexionEstado").innerText = "🔴 Desconectado";

  registrado = false;
  miId = null;

});


// ============================
// ID ASIGNADO (ACTIVA TODO)
// ============================

socket.on("id_asignado", (id) => {

  console.log("✅ Mi ID es:", id);

  miId = id;
  registrado = true;

  // 🔥 MOSTRAR EN UI
  document.getElementById("domId").innerText = id;

  document.getElementById("estado").innerText = "🟢 Disponible";

});


// ============================
// RECIBIR PEDIDO
// ============================

socket.on("pedido_asignado", async (pedido) => {

  console.log("📦 Pedido recibido:", pedido);

  document.getElementById("pedidoTexto").innerText =
    pedido.descripcion || "Pedido";

  document.getElementById("direccionTexto").innerText =
    pedido.direccion || "Dirección";

  document.getElementById("estado").innerText = "🚚 En ruta";

  const pickup = [pedido.pickupLat, pedido.pickupLng];
  const delivery = [pedido.deliveryLat, pedido.deliveryLng];

  // LIMPIAR MAPA
  if (pickupMarker) map.removeLayer(pickupMarker);
  if (deliveryMarker) map.removeLayer(deliveryMarker);
  if (routeLine) map.removeLayer(routeLine);

  // MARCADORES
  pickupMarker = L.marker(pickup).addTo(map)
    .bindPopup("Recoger pedido");

  deliveryMarker = L.marker(delivery).addTo(map)
    .bindPopup("Entregar pedido");

  try {

    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${pickup[1]},${pickup[0]};${delivery[1]},${delivery[0]}?overview=full&geometries=geojson`
    );

    const data = await response.json();

    const routeCoords = data.routes[0].geometry.coordinates.map(coord => [
      coord[1], coord[0]
    ]);

    routeLine = L.polyline(routeCoords, {
      color: "blue",
      weight: 5
    }).addTo(map);

    map.fitBounds(routeLine.getBounds());

  } catch (error) {

    console.error("Error ruta:", error);

  }

});


// ============================
// (OPCIONAL FUTURO) ENTREGAR PEDIDO
// ============================

const swipeBtn = document.getElementById("swipeBtn");
const swipeContainer = document.querySelector(".swipe-container");

if (swipeBtn && swipeContainer) {

  let startX = 0;
  let currentX = 0;
  let maxMove = 0;

  swipeBtn.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;

    // 🔥 calcular ancho real disponible
    maxMove = swipeContainer.offsetWidth - swipeBtn.offsetWidth;
  });

  swipeBtn.addEventListener("touchmove", (e) => {

    currentX = e.touches[0].clientX - startX;

    if (currentX < 0) currentX = 0;
    if (currentX > maxMove) currentX = maxMove;

    swipeBtn.style.transform = `translateX(${currentX}px)`;

  });

  swipeBtn.addEventListener("touchend", () => {

    // 🔥 si llegó al final REAL (90% del recorrido)
    if (currentX >= maxMove * 0.9) {

      console.log("✅ Pedido ENTREGADO");

      document.getElementById("estado").innerText = "✅ Entregado";
      document.getElementById("pedidoTexto").innerText = "Sin pedido...";
      document.getElementById("direccionTexto").innerText = "Dirección destino...";

      // 🔥 LIMPIAR MAPA COMPLETAMENTE
      if (pickupMarker) {
        map.removeLayer(pickupMarker);
        pickupMarker = null;
      }

      if (deliveryMarker) {
        map.removeLayer(deliveryMarker);
        deliveryMarker = null;
      }

      if (routeLine) {
        map.removeLayer(routeLine);
        routeLine = null;
      }

      // 🔥 (FUTURO BACKEND)
      // socket.emit("pedido_entregado", { id: miId });

    }

    // 🔁 RESET SIEMPRE
    swipeBtn.style.transition = "0.3s";
    swipeBtn.style.transform = "translateX(0)";

    setTimeout(() => {
      swipeBtn.style.transition = "0s";
    }, 300);

  });

}