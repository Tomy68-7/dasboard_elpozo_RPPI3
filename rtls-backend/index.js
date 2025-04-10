require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { parseISO, isValid } = require('date-fns');

const app = express();
app.use(cors());

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
  } else {
    console.log('Conexión exitosa a la base de datos:', res.rows);
  }
});

app.get('/api/trayectoria', async (req, res) => {
    const { device, from, to } = req.query;

    console.log('Parámetros recibidos:', { device, from, to });

    if (!device || !from || !to) {
      return res.status(400).json({ error: 'Faltan parámetros' });
    }

    // Validar y formatear las fechas
    const fromDate = parseISO(from);
    const toDate = parseISO(to);

    if (!isValid(fromDate) || !isValid(toDate)) {
      return res.status(400).json({ error: 'Formato de fecha inválido' });
    }

    try {
      const result = await pool.query(`
        SELECT 
          ST_X(ubicacion) AS x,
          ST_Y(ubicacion) AS y,
          timestamp 
        FROM ubicaciones
        WHERE dispositivos_id = $1 AND timestamp BETWEEN $2 AND $3
        ORDER BY timestamp ASC
      `, [device, from, to]);

      res.json(result.rows);
    } catch (err) {
      console.error('Error en la consulta:', err);
      res.status(500).json({ error: 'Error en el servidor', details: err.message });
    }
});

app.listen(process.env.PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${process.env.PORT}`);
});
