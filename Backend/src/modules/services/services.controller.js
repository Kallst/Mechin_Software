// ============================================================
// MECHIN — services.controller.js
// ============================================================

const db = require('../../config/db');
const servicesService = require('./services.service');

const createServiceRequest = async (req, res) => {
    const clienteId = req.user.id;
    const { mecanico_id, tipo_servicio, descripcion, direccion_servicio, latitud_servicio, longitud_servicio } = req.body;

    if (!tipo_servicio?.trim() || !descripcion?.trim() || !direccion_servicio?.trim()) {
        return res.status(400).json({ ok: false, message: 'Faltan datos obligatorios: tipo de servicio, descripción y dirección.' });
    }
    if (descripcion.trim().length < 15) {
        return res.status(400).json({ ok: false, message: 'La descripción es muy corta. Explica mejor el problema (mínimo 15 caracteres).' });
    }

    try {
        const hasActive = await servicesService.checkActiveService(clienteId);
        if (hasActive) {
            return res.status(400).json({ ok: false, message: 'Ya tienes una solicitud activa en el sistema.' });
        }
        const newService = await servicesService.createService(
            clienteId, mecanico_id ? parseInt(mecanico_id) : null,
            tipo_servicio, descripcion, direccion_servicio,
            latitud_servicio || 5.067, longitud_servicio || -75.517
        );
        res.status(201).json({ ok: true, data: newService });
    } catch (error) {
        console.error('❌ Error createServiceRequest:', error);
        res.status(500).json({ ok: false, message: error.message });
    }
};

const getActiveServicesCount = async (req, res) => {
    const clienteId = req.user.id;
    try {
        const count = await servicesService.getActiveServicesCount(clienteId);
        res.json({ ok: true, count });
    } catch (error) {
        console.error('❌ Error getActiveServicesCount:', error);
        res.json({ ok: false, count: 0 });
    }
};

const getActiveServiceForClient = async (req, res) => {
    const clienteId = req.user.id;
    console.log('🔍 clienteId desde token:', clienteId);
    try {
        const service = await servicesService.getActiveService(clienteId);
        console.log('🔍 servicio encontrado:', service ? `id=${service.id} estado=${service.estado}` : 'null');
        if (service) {
            res.json({ ok: true, service });
        } else {
            res.json({ ok: false, message: 'No hay servicios activos' });
        }
    } catch (error) {
        console.error('❌ Error getActiveServiceForClient:', error);
        res.status(500).json({ ok: false, message: error.message });
    }
};

const cancelService = async (req, res) => {
    const { serviceId } = req.params;
    const clienteId = req.user.id;
    try {
        const success = await servicesService.cancelService(serviceId, clienteId);
        if (!success) {
            return res.status(404).json({ ok: false, message: 'Servicio no encontrado o no pertenece a este usuario' });
        }
        res.json({ ok: true, message: 'Servicio cancelado exitosamente' });
    } catch (error) {
        console.error('❌ Error cancelService:', error);
        res.status(500).json({ ok: false, message: error.message });
    }
};

const getPendingRequestsForMechanic = async (req, res) => {
    const { mecanicoId } = req.params;
    try {
        const result = await db.query(`
            SELECT s.*, u.nombre_completo AS cliente_nombre, u.telefono AS cliente_telefono
            FROM servicios s
            JOIN usuarios u ON s.cliente_id = u.id
            WHERE (s.mecanico_id = $1 OR s.mecanico_id IS NULL)
            AND s.estado = 'pendiente'
            ORDER BY s.fecha_solicitud DESC
        `, [mecanicoId]);
        res.json({ ok: true, requests: result.rows });
    } catch (error) {
        console.error('❌ Error getPendingRequestsForMechanic:', error);
        res.status(500).json({ ok: false, message: error.message });
    }
};

const getActiveServiceForMechanic = async (req, res) => {
    const { mecanicoId } = req.params;
    try {
        const result = await db.query(`
            SELECT s.*, u.nombre_completo AS cliente_nombre, u.telefono AS cliente_telefono,
                   u.latitud AS cliente_lat, u.longitud AS cliente_lng
            FROM servicios s
            JOIN usuarios u ON s.cliente_id = u.id
            WHERE s.mecanico_id = $1
            AND s.estado IN ('asignado', 'en_camino', 'en_progreso')
            ORDER BY s.fecha_solicitud DESC
            LIMIT 1
        `, [mecanicoId]);
        if (result.rows.length > 0) {
            res.json({ ok: true, service: result.rows[0] });
        } else {
            res.json({ ok: false, message: 'No hay servicios activos' });
        }
    } catch (error) {
        console.error('❌ Error getActiveServiceForMechanic:', error);
        res.status(500).json({ ok: false, message: error.message });
    }
};

const acceptService = async (req, res) => {
    const { serviceId } = req.params;
    const mecanicoId = req.user.id;
    try {
        const perfilResult = await db.query('SELECT id FROM perfiles_mecanico WHERE usuario_id = $1', [mecanicoId]);
        if (perfilResult.rows.length === 0) {
            return res.status(404).json({ ok: false, message: 'Perfil de mecánico no encontrado' });
        }
        const perfilId = perfilResult.rows[0].id;
        const current = await db.query('SELECT estado, cliente_id FROM servicios WHERE id = $1', [serviceId]);
        if (current.rows.length === 0) return res.status(404).json({ ok: false, message: 'Servicio no encontrado' });
        if (current.rows[0].estado !== 'pendiente') return res.status(400).json({ ok: false, message: 'El servicio ya no está disponible' });
        const clienteId = current.rows[0].cliente_id;
        await db.query(`UPDATE servicios SET estado = 'asignado', mecanico_id = $1, fecha_asignacion = NOW(), actualizado_en = NOW() WHERE id = $2`, [perfilId, serviceId]);
        await db.query(`INSERT INTO estados_servicio (servicio_id, usuario_id, estado_anterior, estado_nuevo, observacion) VALUES ($1, $2, 'pendiente', 'asignado', 'Servicio aceptado por el mecánico')`, [serviceId, mecanicoId]);
        await db.query(`INSERT INTO notificaciones (usuario_id, servicio_id, tipo, mensaje) VALUES ($1, $2, 'servicio_aceptado', 'Un mecánico ha aceptado tu solicitud de servicio.')`, [clienteId, serviceId]);
        res.json({ ok: true, message: 'Servicio aceptado' });
    } catch (error) {
        console.error('❌ Error acceptService:', error);
        res.status(500).json({ ok: false, message: error.message });
    }
};

const rejectService = async (req, res) => {
    const { serviceId } = req.params;
    const mecanicoId = req.user.id;
    try {
        const current = await db.query('SELECT estado, cliente_id FROM servicios WHERE id = $1', [serviceId]);
        if (current.rows.length === 0) return res.status(404).json({ ok: false, message: 'Servicio no encontrado' });
        await db.query('UPDATE servicios SET mecanico_id = NULL, actualizado_en = NOW() WHERE id = $1', [serviceId]);
        await db.query(`INSERT INTO estados_servicio (servicio_id, usuario_id, estado_anterior, estado_nuevo, observacion) VALUES ($1, $2, 'pendiente', 'pendiente', 'Servicio rechazado por el mecánico')`, [serviceId, mecanicoId]);
        res.json({ ok: true, message: 'Servicio rechazado y devuelto a pendientes' });
    } catch (error) {
        console.error('❌ Error rejectService:', error);
        res.status(500).json({ ok: false, message: error.message });
    }
};

const updateServiceStatus = async (req, res) => {
    const { serviceId } = req.params;
    const { status } = req.body;
    const mecanicoUserId = req.user.id;
    const estadosValidos = ['en_camino', 'en_progreso', 'finalizado'];
    if (!estadosValidos.includes(status)) {
        return res.status(400).json({ ok: false, message: `Estado inválido. Usa: ${estadosValidos.join(', ')}` });
    }
    try {
        const current = await db.query('SELECT estado, cliente_id FROM servicios WHERE id = $1', [serviceId]);
        if (current.rows.length === 0) return res.status(404).json({ ok: false, message: 'Servicio no encontrado' });
        const estadoAnterior = current.rows[0].estado;
        const clienteId = current.rows[0].cliente_id;
        let updateQuery = 'UPDATE servicios SET estado = $1, actualizado_en = NOW()';
        if (status === 'finalizado') updateQuery += ', fecha_finalizacion = NOW()';
        updateQuery += ' WHERE id = $2';
        await db.query(updateQuery, [status, serviceId]);
        await db.query(`INSERT INTO estados_servicio (servicio_id, usuario_id, estado_anterior, estado_nuevo, observacion) VALUES ($1, $2, $3, $4, 'Estado actualizado por el mecánico')`, [serviceId, mecanicoUserId, estadoAnterior, status]);
        const mensajes = {
            en_camino:  { tipo: 'servicio_en_camino',  msg: 'El mecánico está en camino a tu ubicación.' },
            finalizado: { tipo: 'servicio_finalizado', msg: 'Tu servicio ha finalizado. ¡No olvides calificar al mecánico!' }
        };
        if (mensajes[status]) {
            await db.query(`INSERT INTO notificaciones (usuario_id, servicio_id, tipo, mensaje) VALUES ($1, $2, $3, $4)`, [clienteId, serviceId, mensajes[status].tipo, mensajes[status].msg]);
        }
        res.json({ ok: true, message: `Servicio actualizado a ${status}` });
    } catch (error) {
        console.error('❌ Error updateServiceStatus:', error);
        res.status(500).json({ ok: false, message: error.message });
    }
};

module.exports = {
    createServiceRequest,
    getActiveServicesCount,
    getActiveServiceForClient,
    cancelService,
    getPendingRequestsForMechanic,
    getActiveServiceForMechanic,
    acceptService,
    rejectService,
    updateServiceStatus
};