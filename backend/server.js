const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const axios = require("axios");
const path = require("path");
const pool = require("./db");

console.log("ðŸ”¥ SERVIDOR INICIANDO");

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
  socket.on("registrar_domiciliario", async ({ domiciliarioId }) => {
    try {
      const resultado = await pool.query(
      "SELECT id, nombre, telefono, estado FROM domiciliarios WHERE id = $1",
      [domiciliarioId]
      );

      if (resultado.rows.length === 0) {
        socket.emit("error_registro", {
          mensaje: "El domiciliario no existe"
        });
        return;
      }

      const domiciliario = resultado.rows[0];
      const idDomiciliario = String(domiciliario.id);

      domiciliarios[idDomiciliario] = {
        socketId: socket.id,
        id: domiciliario.id,
        nombre: domiciliario.nombre,
        telefono: domiciliario.telefono,
        lat: null,
        lng: null
      };

      socket.idDomiciliario = idDomiciliario;

      await pool.query(
        "UPDATE domiciliarios SET estado = $1 WHERE id = $2",
        ["disponible", domiciliario.id]
      );

      console.log("Domiciliario conectado:", domiciliario.nombre);

      socket.emit("domiciliario_registrado", {
        id: domiciliario.id,
        nombre: domiciliario.nombre,
        estado: "disponible"
      });
    } catch (error) {
      console.error("Error registrando domiciliario:", error.message);

      socket.emit("error_registro", {
        mensaje: "No se pudo registrar el domiciliario"
      });
    }
  });

  // Actualiza la ubicacion del domiciliario y la publica al panel.
  socket.on("ubicacion", ({ lat, lng }) => {
    const idDomiciliario = socket.idDomiciliario;

    if (!idDomiciliario) {
      console.log("âš ï¸ UbicaciÃ³n recibida pero el domiciliario no estÃ¡ registrado");
      return;
    }

    if (domiciliarios[idDomiciliario]) {
      domiciliarios[idDomiciliario].lat = lat;
      domiciliarios[idDomiciliario].lng = lng;

      console.log(
        "ðŸ“",
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
  socket.on("pedido_en_camino", async ({ pedidoId, domiciliarioId }) => {
    try {
      if (!pedidoId || !domiciliarioId) {
        return;
      }

      await pool.query(
        `UPDATE pedidos
         SET estado = $1,
             estado_tracking = $2,
             actualizado_en = NOW()
         WHERE id = $3
         AND domiciliario_id = $4`,
        ["en_camino", "en_camino", pedidoId, domiciliarioId]
      );

      await pool.query(
        `UPDATE asignaciones_pedido
         SET estado = $1
         WHERE pedido_id = $2
         AND domiciliario_id = $3`,
        ["en_camino", pedidoId, domiciliarioId]
      );

      await pool.query(
        "UPDATE domiciliarios SET estado = $1 WHERE id = $2",
        ["ocupado", domiciliarioId]
      );

      console.log("Pedido en camino:", pedidoId);
    } catch (error) {
      console.error("Error marcando pedido en camino:", error.message);
    }
  });

  socket.on("pedido_entregado", async ({ pedidoId, domiciliarioId }) => {
    try {
      if (!pedidoId || !domiciliarioId) {
        return;
      }

      await pool.query(
        `UPDATE pedidos
         SET estado = $1,
             estado_tracking = $2,
             actualizado_en = NOW()
         WHERE id = $3
         AND domiciliario_id = $4`,
        ["entregado", "entregado", pedidoId, domiciliarioId]
      );

      await pool.query(
        `UPDATE asignaciones_pedido
         SET estado = $1,
             entregado_en = NOW()
         WHERE pedido_id = $2
         AND domiciliario_id = $3`,
        ["entregado", pedidoId, domiciliarioId]
      );

      await pool.query(
        "UPDATE domiciliarios SET estado = $1 WHERE id = $2",
        ["disponible", domiciliarioId]
      );

      console.log("Pedido entregado:", pedidoId);

      socket.emit("pedido_entregado_confirmado", {
        pedidoId
      });
    } catch (error) {
      console.error("Error marcando pedido entregado:", error.message);
    }
  });
  socket.on("disconnect", async () => {
    if (socket.idDomiciliario) {
      console.log(socket.idDomiciliario, "desconectado");

      try {
        await pool.query(
          "UPDATE domiciliarios SET estado = $1 WHERE id = $2",
          ["desconectado", socket.idDomiciliario]
        );
      } catch (error) {
        console.error("Error actualizando domiciliario desconectado:", error.message);
      }

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
          q,
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
    console.log("Error buscando direcciÃ³n:", error.message);
    res.json([]);
  }
});

// Envia un pedido al domiciliario seleccionado si esta conectado.
app.post("/crear-pedido", async (req, res) => {
  const { idDomiciliario, pickupLat, pickupLng, deliveryLat, deliveryLng } = req.body;

  if (!pickupLat || !deliveryLat) {
    return res.status(400).json({ error: "Coordenadas invÃ¡lidas" });
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

// Asigna un pedido real de Kondorito a un domiciliario registrado.
// La pasteleria es el punto fijo de salida; solo cambia la direccion de entrega.
app.post("/asignar-pedido", async (req, res) => {
  const {
    pedidoId,
    domiciliarioId,
    deliveryLat,
    deliveryLng,
    direccion,
    descripcion
  } = req.body;

  const pickupLat = Number(process.env.PASTELERIA_LAT);
  const pickupLng = Number(process.env.PASTELERIA_LNG);
  const pickupAddress = process.env.PASTELERIA_DIRECCION || "Kondorito";

  if (!pedidoId || !domiciliarioId) {
    return res.status(400).json({
      error: "pedidoId y domiciliarioId son obligatorios"
    });
  }

  if (!deliveryLat || !deliveryLng) {
    return res.status(400).json({
      error: "Las coordenadas de entrega son obligatorias"
    });
  }

  if (!pickupLat || !pickupLng) {
    return res.status(500).json({
      error: "Faltan las coordenadas de la pasteleria en las variables de entorno"
    });
  }

  try {
    const pedidoResultado = await pool.query(
      "SELECT id, estado FROM pedidos WHERE id = $1",
      [pedidoId]
    );

    if (pedidoResultado.rows.length === 0) {
      return res.status(404).json({
        error: "El pedido no existe"
      });
    }

    const domiciliarioResultado = await pool.query(
      "SELECT id, nombre, estado FROM domiciliarios WHERE id = $1",
      [domiciliarioId]
    );

    if (domiciliarioResultado.rows.length === 0) {
      return res.status(404).json({
        error: "El domiciliario no existe"
      });
    }

    await pool.query(
      `UPDATE pedidos
       SET domiciliario_id = $1,
           estado_tracking = $2,
           estado = $3,
           actualizado_en = NOW()
       WHERE id = $4`,
      [domiciliarioId, "asignado", "en_preparacion", pedidoId]
    );

    await pool.query(
      `INSERT INTO asignaciones_pedido (pedido_id, domiciliario_id, estado)
       VALUES ($1, $2, $3)`,
      [pedidoId, domiciliarioId, "asignado"]
    );

    const domiciliarioSocket = domiciliarios[String(domiciliarioId)];

    if (domiciliarioSocket) {
      io.to(domiciliarioSocket.socketId).emit("pedido_asignado", {
        pedidoId,
        pickupLat,
        pickupLng,
        pickupAddress,
        deliveryLat,
        deliveryLng,
        direccion,
        descripcion
      });
    }

    res.json({
      ok: true,
      mensaje: "Pedido asignado correctamente",
      domiciliarioConectado: Boolean(domiciliarioSocket)
    });
  } catch (error) {
    console.error("Error asignando pedido:", error.message);

    res.status(500).json({
      error: "No se pudo asignar el pedido"
    });
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
