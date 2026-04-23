require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- RUTAS ---

// Ruta de Autenticación (Login, Registro, OTP)
app.use('/api/auth', require('./src/modules/auth/auth.routes'));

// RUTA DE GEOLOCALIZACIÓN (MECHIN-69)
// Esta es la línea que faltaba para que el 404 desaparezca
app.use('/api/geolocation', require('./src/modules/geolocation/geolocation.routes'));

// --- PRUEBA DE CONEXIÓN A LA BD ---
app.get('/api/health', async (req, res) => {
  try {
    const db = require('./src/config/db');
    const result = await db.query('SELECT NOW() as tiempo, current_database() as bd');
    res.json({
      status: '✅ Conexión exitosa',
      base_de_datos: result.rows[0].bd,
      hora_servidor: result.rows[0].tiempo
    });
  } catch (err) {
    res.status(500).json({
      status: '❌ Conexión fallida',
      error: err.message
    });
  }
});

// --- LANZAMIENTO DEL SERVIDOR ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`==========================================`);
  console.log(`🚀 Servidor Mechin corriendo en puerto ${PORT}`);
  console.log(`📍 Geolocation API: http://localhost:${PORT}/api/geolocation/update`);
  console.log(`==========================================`);
});