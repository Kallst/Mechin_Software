require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./src/config/db');

// Importación de rutas
const authRoutes = require('./src/modules/auth/auth.routes');
const geolocationRoutes = require('./src/modules/geolocation/geolocation.routes');
const usersRoutes = require('./src/modules/users/users.routes');
const servicesRoutes = require('./src/modules/services/services.routes');
const mechanicRoutes = require('./src/modules/mechanics/mechanics.routes');
const notificationRoutes = require('./src/modules/notifications/notifications.routes');

const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- RUTAS ---
app.use('/api/auth', authRoutes);
app.use('/api/geolocation', geolocationRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/mechanics', mechanicRoutes);
app.use('/api/notifications', notificationRoutes);

// --- SIMULADOR DE MOVIMIENTO DINÁMICO ---
// Variable para crear trayectorias fluidas
let step = 0;

setInterval(async () => {
    step += 0.2; 
    try {
        // Usamos sin() y cos() con el ID del usuario para que cada mecánico 
        // tome una dirección distinta y no se amontonen.
        await db.query(`
            UPDATE usuarios
            SET latitud = latitud + (sin(${step} + id) * 0.0007),
                longitud = longitud + (cos(${step} + id) * 0.0007)
            WHERE id IN (
                SELECT usuario_id 
                FROM perfiles_mecanico 
                WHERE disponible = true
            )
        `);
    } catch (err) {
        console.error("❌ Error en simulador de movimiento:", err.message);
    }
}, 6000); // Actualización cada 6 segundos para equilibrio entre fluidez y rendimiento

// --- PRUEBA DE CONEXIÓN A LA BD ---
app.get('/api/health', async (req, res) => {
    try {
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
    console.log(`🔔 Notifications API: http://localhost:${PORT}/api/notifications`);
    console.log(`💡 Simulador dinámico: ACTIVO (Trayectorias curvas)`);
    console.log(`==========================================`);
});