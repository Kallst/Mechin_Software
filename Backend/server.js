require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importación de rutas
const authRoutes = require('./src/modules/auth/auth.routes');
const geolocationRoutes = require('./src/modules/geolocation/geolocation.routes');
const usersRoutes = require('./src/modules/users/users.routes');
const servicesRoutes = require('./src/modules/services/services.routes');
const mechanicRoutes = require('./src/modules/mechanics/mechanics.routes');

const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- RUTAS ---
app.use('/api/auth', authRoutes);
app.use('/api/geolocation', geolocationRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/mechanics', mechanicRoutes); // <--- Registro de la ruta de mecánicos

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
    console.log(`📍 Mechanics API: http://localhost:${PORT}/api/mechanics/nearby`);
    console.log(`==========================================`);
});