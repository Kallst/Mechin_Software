const servicesService = require('./services.service');

// --- MECHIN-23: CREAR SOLICITUD ---
const createServiceRequest = async (req, res) => {
    console.log("=== INICIO PETICIÓN (VALIDADA) ===");
    
    // EXTRACCIÓN SEGURA: El ID viene del token JWT, no del body
    const final_cliente_id = req.user.id; 

    const { 
        mecanico_id, tipo_servicio, descripcion, 
        direccion_servicio, latitud_servicio, longitud_servicio 
    } = req.body;

    if (!tipo_servicio || tipo_servicio.trim() === "" || 
        !descripcion || descripcion.trim() === "" || 
        !direccion_servicio || direccion_servicio.trim() === "") {
        return res.status(400).json({ 
            ok: false, 
            message: "Faltan datos obligatorios: El tipo de servicio, la descripción y la dirección no pueden estar vacíos." 
        });
    }

    if (descripcion.trim().length < 15) {
        return res.status(400).json({ 
            ok: false, 
            message: "La descripción es muy corta. Por favor explica mejor el problema (mínimo 15 caracteres)." 
        });
    }

    const final_mecanico_id = mecanico_id ? parseInt(mecanico_id) : null;

    try {
        const hasActive = await servicesService.checkActiveService(final_cliente_id);

        if (hasActive) {
            return res.status(400).json({ 
                ok: false, 
                message: "Ya tienes una solicitud activa en el sistema." 
            });
        }

        const newService = await servicesService.createService(
            final_cliente_id, final_mecanico_id, tipo_servicio, descripcion, 
            direccion_servicio, latitud_servicio || 5.067, longitud_servicio || -75.517
        );

        res.status(201).json({ ok: true, data: newService });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

// --- MECHIN-80: OBTENER DETALLE DEL SERVICIO ACTIVO ---
const getActiveService = async (req, res) => {
    // EXTRACCIÓN SEGURA: Del token
    const clienteId = req.user.id; 
    
    try {
        const service = await servicesService.getActiveService(clienteId);

        if (service) {
            res.json({ ok: true, service });
        } else {
            res.json({ ok: false, message: "No hay servicios activos" });
        }
    } catch (error) {
        console.error("Error en getActiveService:", error.message);
        res.status(500).json({ ok: false, error: error.message });
    }
};

// --- MECHIN-80: CANCELAR SERVICIO ---
const cancelService = async (req, res) => {
    const { id } = req.params;
    const clienteId = req.user.id; // Del token

    try {
        const success = await servicesService.cancelService(id, clienteId);
        
        if (!success) {
            return res.status(404).json({ ok: false, message: "No encontrado o no pertenece a este usuario" });
        }

        res.json({ ok: true, message: "Servicio cancelado exitosamente" });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

const getActiveServicesCount = async (req, res) => {
    const clienteId = req.user.id; // Del token
    try {
        const count = await servicesService.getActiveServicesCount(clienteId);
        res.json({ ok: true, count });
    } catch (e) { 
        res.json({ ok: false, count: 0 }); 
    }
};

module.exports = { 
    createServiceRequest, 
    getActiveServicesCount, 
    getActiveService, 
    cancelService 
};