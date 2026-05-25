const pool = require("./db");

async function listarDomiciliarios() {
  try {
    const resultado = await pool.query(`
      SELECT id, nombre, telefono, estado
      FROM domiciliarios
      ORDER BY id ASC
    `);

    console.log("Domiciliarios encontrados:");
    console.table(resultado.rows);
  } catch (error) {
    console.error("Error consultando domiciliarios:", error.message);
  } finally {
    await pool.end();
  }
}

listarDomiciliarios();