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

// Icono que representa la posicion actual del domiciliario.
const motoIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1048/1048313.png",
  iconSize: [38, 38],
  iconAnchor: [19, 38]
});

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

// Envia la posicion solo despues de recibir un ID del servidor.
navigator.geolocation.watchPosition((position) => {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;

  if (currentMarker) {
    currentMarker.setLatLng([lat, lng]);
  }

  if (registrado && miId) {
    socket.emit("ubicacion", { lat, lng });
  }
}, (error) => {
  console.error("Error GPS:", error);
}, {
  enableHighAccuracy: true
});

socket.on("connect", () => {
  console.log("🟢 Conectado al servidor");

  document.getElementById("conexionEstado").innerText = "🟢 Conectado";

  socket.emit("registrar_domiciliario");
});

socket.on("disconnect", () => {
  console.log("🔴 Desconectado");

  document.getElementById("conexionEstado").innerText = "🔴 Desconectado";

  registrado = false;
  miId = null;
});

socket.on("id_asignado", (id) => {
  console.log("✅ Mi ID es:", id);

  miId = id;
  registrado = true;

  document.getElementById("domId").innerText = id;
  document.getElementById("estado").innerText = "🟢 Disponible";
});

// Muestra el pedido asignado y calcula la ruta entre recogida y entrega.
socket.on("pedido_asignado", async (pedido) => {
  console.log("📦 Pedido recibido:", pedido);

  document.getElementById("pedidoTexto").innerText =
    pedido.descripcion || "Pedido";

  document.getElementById("direccionTexto").innerText =
    pedido.direccion || "Dirección";

  document.getElementById("estado").innerText = "🚚 En ruta";

  const pickup = [pedido.pickupLat, pedido.pickupLng];
  const delivery = [pedido.deliveryLat, pedido.deliveryLng];

  if (pickupMarker) map.removeLayer(pickupMarker);
  if (deliveryMarker) map.removeLayer(deliveryMarker);
  if (routeLine) map.removeLayer(routeLine);

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

const swipeBtn = document.getElementById("swipeBtn");
const swipeContainer = document.querySelector(".swipe-container");

if (swipeBtn && swipeContainer) {
  let startX = 0;
  let currentX = 0;
  let maxMove = 0;

  swipeBtn.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    // Limita el recorrido al ancho real del control.
    maxMove = swipeContainer.offsetWidth - swipeBtn.offsetWidth;
  });

  swipeBtn.addEventListener("touchmove", (e) => {
    currentX = e.touches[0].clientX - startX;

    if (currentX < 0) currentX = 0;
    if (currentX > maxMove) currentX = maxMove;

    swipeBtn.style.transform = `translateX(${currentX}px)`;
  });

  swipeBtn.addEventListener("touchend", () => {
    // El pedido se marca como entregado al completar casi todo el recorrido.
    if (currentX >= maxMove * 0.9) {
      console.log("✅ Pedido ENTREGADO");

      document.getElementById("estado").innerText = "✅ Entregado";
      document.getElementById("pedidoTexto").innerText = "Sin pedido...";
      document.getElementById("direccionTexto").innerText = "Dirección destino...";

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

      // socket.emit("pedido_entregado", { id: miId });
    }

    swipeBtn.style.transition = "0.3s";
    swipeBtn.style.transform = "translateX(0)";

    setTimeout(() => {
      swipeBtn.style.transition = "0s";
    }, 300);
  });
}
