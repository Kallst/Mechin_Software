require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// los middlewares 
app.use(cors());
app.use(express.json());

// Rutes
app.use('/api/auth', require('./src/modules/auth/auth.routes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
// Ruta de prueba de conexión a la BD
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
