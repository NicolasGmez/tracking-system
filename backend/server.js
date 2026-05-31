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

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Domiciliarios Kondorito</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
      <style>
        :root {
          --primary: #8b3f0b;
          --accent: #e96b12;
          --pink: #ffd6ea;
          --cream: #fff7d1;
          --text: #273142;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          min-height: 100vh;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: var(--text);
          background:
            radial-gradient(circle at top left, rgba(255, 247, 209, 0.95), transparent 36rem),
            linear-gradient(135deg, #fffdf7 0%, #ffe5f2 52%, #fff8d7 100%);
        }

        .page {
          width: min(100%, 980px);
          margin: 0 auto;
          padding: 28px 16px 36px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 32px;
        }

        .brand-icon {
          width: 54px;
          height: 54px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: #fff8bd;
          color: var(--primary);
          font-size: 26px;
          box-shadow: 0 12px 30px rgba(139, 63, 11, 0.12);
        }

        .brand h1 {
          margin: 0;
          font-family: "Playfair Display", serif;
          color: var(--primary);
          font-size: clamp(28px, 8vw, 46px);
          line-height: 1;
        }

        .brand p {
          margin: 4px 0 0;
          color: #6b7280;
          font-size: 15px;
        }

        .hero {
          margin-bottom: 24px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.76);
          color: var(--accent);
          font-weight: 800;
          box-shadow: 0 10px 24px rgba(139, 63, 11, 0.08);
        }

        .hero h2 {
          margin: 18px 0 10px;
          color: var(--primary);
          font-size: clamp(30px, 9vw, 58px);
          line-height: 1.02;
          letter-spacing: 0;
        }

        .hero p {
          margin: 0;
          max-width: 680px;
          color: #4b5563;
          font-size: clamp(16px, 4vw, 20px);
          line-height: 1.55;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
          margin-top: 26px;
        }

        .card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          min-height: 118px;
          padding: 18px;
          border: 1px solid rgba(233, 107, 18, 0.14);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.86);
          box-shadow: 0 16px 40px rgba(139, 63, 11, 0.12);
          text-decoration: none;
          color: inherit;
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        }

        .card:active {
          transform: scale(0.985);
        }

        .avatar {
          width: 58px;
          height: 58px;
          flex: 0 0 auto;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, var(--cream), var(--pink));
          color: var(--primary);
          font-size: 26px;
          font-weight: 800;
        }

        .info {
          flex: 1;
          min-width: 0;
        }

        .info h3 {
          margin: 0;
          color: var(--primary);
          font-size: 22px;
        }

        .info p {
          margin: 5px 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        .action {
          flex: 0 0 auto;
          padding: 11px 14px;
          border-radius: 999px;
          background: var(--accent);
          color: white;
          font-weight: 800;
          font-size: 14px;
        }

        .footer {
          margin-top: 24px;
          color: #6b7280;
          font-size: 13px;
          text-align: center;
        }

        @media (min-width: 720px) {
          .page {
            padding: 44px 28px 52px;
          }

          .grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 18px;
          }

          .card {
            min-height: 230px;
            flex-direction: column;
            align-items: flex-start;
          }

          .action {
            width: 100%;
            text-align: center;
          }
        }
      </style>
    </head>
    <body>
      <main class="page">
        <header class="brand">
          <div class="brand-icon">🎂</div>
          <div>
            <h1>Kondorito</h1>
            <p>Postres y Pasteles</p>
          </div>
        </header>

        <section class="hero">
          <div class="eyebrow">🛵 Acceso domiciliarios</div>
          <h2>Domiciliarios Kondorito</h2>
          <p>Selecciona tu perfil para conectarte a la PWA de entregas y recibir pedidos en tiempo real.</p>
        </section>

        <section class="grid" aria-label="Seleccionar domiciliario">
          <a class="card" href="/pwa/?domiciliario_id=1">
            <div class="avatar">P</div>
            <div class="info">
              <h3>Jaider</h3>
              <p>Domiciliario ID 1</p>
            </div>
            <div class="action">Conectar</div>
          </a>

          <a class="card" href="/pwa/?domiciliario_id=2">
            <div class="avatar">F</div>
            <div class="info">
              <h3>Nicolás</h3>
              <p>Domiciliario ID 2</p>
            </div>
            <div class="action">Conectar</div>
          </a>

          <a class="card" href="/pwa/?domiciliario_id=3">
            <div class="avatar">D</div>
            <div class="info">
              <h3>Diego</h3>
              <p>Domiciliario ID 3</p>
            </div>
            <div class="action">Conectar</div>
          </a>
        </section>

        <p class="footer">Sistema de tracking en tiempo real para entregas de Kondorito.</p>
      </main>
    </body>
    </html>
  `);
});

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
