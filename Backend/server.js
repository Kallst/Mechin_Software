require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http'); 
const { Server } = require('socket.io'); 
const db = require('./src/config/db');

// Importación de rutas
const authRoutes = require('./src/modules/auth/auth.routes');
const geolocationRoutes = require('./src/modules/geolocation/geolocation.routes');
const usersRoutes = require('./src/modules/users/users.routes');
const servicesRoutes = require('./src/modules/services/services.routes');
const mechanicRoutes = require('./src/modules/mechanics/mechanics.routes');
const notificationRoutes = require('./src/modules/notifications/notifications.routes');
const paymentsRoutes = require('./src/modules/payments/payments.routes'); // <--- NUEVO: Rutas de pagos

const app = express();

// --- CONFIGURACIÓN DE SERVIDOR Y SOCKETS ---
const server = http.createServer(app); 
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Permite que tu React se conecte
        methods: ["GET", "POST"]
    }
});

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
app.use('/api/payments', paymentsRoutes); // <--- NUEVO: Conexión de pagos

// --- LÓGICA DE CHAT (SOCKETS) ---
io.on('connection', (socket) => {
    console.log('⚡ Nuevo usuario conectado al chat:', socket.id);

    // Unirse a la sala del servicio
    socket.on('join_chat', (serviceId) => {
        socket.join(`room_${serviceId}`);
        console.log(`💬 Usuario unido a sala: room_${serviceId}`);
    });

    // Recibir y retransmitir mensajes
    socket.on('send_message', (data) => {
        console.log('📩 Nuevo mensaje:', data.text);
        io.to(`room_${data.serviceId}`).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log('❌ Usuario desconectado del socket');
    });
});

// --- SIMULADOR DE MOVIMIENTO DINÁMICO ---
let step = 0;
setInterval(async () => {
    step += 0.2; 
    try {
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
}, 6000);

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

server.listen(PORT, () => {
    console.log(`==========================================`);
    console.log(`🚀 Servidor Mechin (Sockets OK) puerto ${PORT}`);
    console.log(`📍 Mechanics API: http://localhost:${PORT}/api/mechanics/nearby`);
    console.log(`💡 Simulador dinámico: ACTIVO`);
    console.log(`💬 Chat en tiempo real: HABILITADO`);
    console.log(`==========================================`);
});