require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./src/config/db');


// Importación de rutas
const authRoutes         = require('./src/modules/auth/auth.routes');
const geolocationRoutes  = require('./src/modules/geolocation/geolocation.routes');
const usersRoutes        = require('./src/modules/users/users.routes');
const servicesRoutes     = require('./src/modules/services/services.routes');
const mechanicRoutes     = require('./src/modules/mechanics/mechanics.routes');
const notificationRoutes = require('./src/modules/notifications/notifications.routes');
const paymentsRoutes     = require('./src/modules/payments/payments.routes');
const chatRoutes         = require('./src/modules/chat/chat.routes'); // ← NUEVO
const reputationRoutes = require('./src/modules/reputation/reputation.routes');
const catalogRoutes = require('./src/modules/catalog/catalog.routes');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- RUTAS ---
app.use('/api/auth',          authRoutes);
app.use('/api/geolocation',   geolocationRoutes);
app.use('/api/users',         usersRoutes);
app.use('/api/services',      servicesRoutes);
app.use('/api/mechanics',     mechanicRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments',      paymentsRoutes);
app.use('/api/chat',          chatRoutes); // ← NUEVO
app.use('/api/reputation',    reputationRoutes); // ← NUEVO
app.use('/api/catalog', catalogRoutes);

// --- LÓGICA DE CHAT (SOCKETS) ---
io.on('connection', (socket) => {
    console.log('⚡ Nuevo usuario conectado al chat:', socket.id);

    // El cliente se une a la sala de su servicio
    socket.on('join_chat', (serviceId) => {
        socket.join(`room_${serviceId}`);
        console.log(`💬 Usuario unido a sala: room_${serviceId}`);
    });

    // Recibir mensaje → guardar en BD → retransmitir a la sala
    socket.on('send_message', async (data) => {
        try {
            // Guardar en la base de datos para persistencia
            const result = await db.query(
                `INSERT INTO chat_mensajes (servicio_id, emisor_id, emisor_nombre, texto)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, enviado_en`,
                [data.serviceId, data.senderId, data.senderName, data.text]
            );

            // Construir el mensaje enriquecido con id y timestamp real de BD
            const savedMessage = {
                ...data,
                id: result.rows[0].id,
                time: new Date(result.rows[0].enviado_en).toLocaleTimeString(
                    'es-CO',
                    { hour: '2-digit', minute: '2-digit' }
                )
            };

            // Emitir a todos en la sala (incluido el emisor)
            io.to(`room_${data.serviceId}`).emit('receive_message', savedMessage);
            console.log(`📩 Mensaje guardado y emitido en room_${data.serviceId}`);

        } catch (err) {
            console.error('❌ Error guardando mensaje:', err.message);
            // Si falla el guardado, igual emitir para no bloquear el chat
            io.to(`room_${data.serviceId}`).emit('receive_message', data);
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ Usuario desconectado del socket:', socket.id);
    });
});

// --- SIMULADOR DE MOVIMIENTO DINÁMICO ---
let step = 0;
setInterval(async () => {
    step += 0.2;
    try {
        await db.query(`
            UPDATE usuarios
            SET latitud  = latitud  + (sin(${step} + id) * 0.0007),
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

// --- HEALTH CHECK ---
app.get('/api/health', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW() as tiempo, current_database() as bd');
        res.json({
            status: '✅ Conexión exitosa',
            base_de_datos: result.rows[0].bd,
            hora_servidor: result.rows[0].tiempo
        });
    } catch (err) {
        res.status(500).json({ status: '❌ Conexión fallida', error: err.message });
    }
});

// --- LANZAMIENTO ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`==========================================`);
    console.log(`🚀 Servidor Mechin (Sockets OK) puerto ${PORT}`);
    console.log(`📍 Mechanics API: http://localhost:${PORT}/api/mechanics/nearby`);
    console.log(`💬 Chat API:      http://localhost:${PORT}/api/chat/:serviceId`);
    console.log(`💡 Simulador dinámico: ACTIVO`);
    console.log(`==========================================`);
});