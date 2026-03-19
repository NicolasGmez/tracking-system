const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const axios = require("axios");
const path = require("path");

console.log("🔥 SERVIDOR INICIANDO");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/pwa", express.static(path.join(__dirname, "pwa-domiciliario")));
app.use(express.static("public"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

// 🔥 DOMICILIARIOS CONECTADOS
const domiciliarios = {};

function obtenerIdDisponible() {

  let numero = 1;

  while (domiciliarios["domiciliario_" + numero]) {
    numero++;
  }

  return "domiciliario_" + numero;
}

io.on("connection", (socket) => {

  console.log("Cliente conectado:", socket.id);

  // 🔵 REGISTRAR DOMICILIARIO
  socket.on("registrar_domiciliario", () => {

    const idDomiciliario = obtenerIdDisponible();

    domiciliarios[idDomiciliario] = {
      socketId: socket.id,
      lat: null,
      lng: null
    };

    socket.idDomiciliario = idDomiciliario;

    console.log("Nuevo domiciliario:", idDomiciliario);

    socket.emit("id_asignado", idDomiciliario);

  });


  // 🔵 RECIBIR UBICACIÓN
  socket.on("ubicacion", ({ lat, lng }) => {

    const idDomiciliario = socket.idDomiciliario;

    if (!idDomiciliario) {
      console.log("⚠️ Ubicación recibida pero el domiciliario no está registrado");
      return;
    }

    if (domiciliarios[idDomiciliario]) {

      domiciliarios[idDomiciliario].lat = lat;
      domiciliarios[idDomiciliario].lng = lng;

      console.log(
        "📍",
        idDomiciliario,
        "-> LAT:",
        lat,
        "LNG:",
        lng
      );

      io.emit("ubicacion_domiciliario", {
        id: idDomiciliario,
        lat: lat,
        lng: lng
      });

    }

  });


  socket.on("disconnect", () => {

    if (socket.idDomiciliario) {

      console.log(socket.idDomiciliario, "desconectado");

      delete domiciliarios[socket.idDomiciliario];

    } else {

      console.log("Cliente desconectado:", socket.id);

    }

  });

});


// 🔵 AUTOCOMPLETADO DE DIRECCIONES (OpenStreetMap)
app.get("/buscar-direccion", async (req, res) => {

  const q = req.query.q;

  if (!q || q.length < 3) {
    return res.json([]);
  }

  try {

    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: q + ", Bucaramanga, Colombia",
          format: "json",
          limit: 5,
          addressdetails: 1
        },
        headers: {
          "User-Agent": "kondorito-app"
        }
      }
    );

    res.json(response.data);

  } catch (error) {

    console.log("Error buscando dirección:", error.message);
    res.json([]);

  }

});


// 🔵 CREAR PEDIDO
app.post("/crear-pedido", async (req, res) => {

  const { idDomiciliario, pickupLat, pickupLng, deliveryLat, deliveryLng } = req.body;

  if (!pickupLat || !deliveryLat) {
    return res.status(400).json({ error: "Coordenadas inválidas" });
  }

  const domiciliario = domiciliarios[idDomiciliario];

  if (domiciliario) {

    io.to(domiciliario.socketId).emit("pedido_asignado", {
      pickupLat,
      pickupLng,
      deliveryLat,
      deliveryLng,
    });

    console.log("Pedido enviado a:", idDomiciliario);

  } else {

    console.log("Domiciliario no conectado");

  }

  res.json({
    ok: true,
    pickupLat,
    pickupLng,
    deliveryLat,
    deliveryLng
  });

});


server.listen(3000, () => {
  console.log("Servidor corriendo en puerto 3000");
});