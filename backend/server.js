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

// Domiciliarios activos en memoria, indexados por el ID asignado.
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

  // Registra un domiciliario nuevo y le asigna el primer ID disponible.
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

  // Actualiza la ubicacion del domiciliario y la publica al panel.
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

// Consulta sugerencias de direccion usando Nominatim.
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

// Envia un pedido al domiciliario seleccionado si esta conectado.
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
      descripcion: req.body.descripcion,
      direccion: req.body.deliveryAddress
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
