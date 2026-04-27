const db = require('../../config/db');

/**
 * Obtiene mecánicos cercanos simulando la distancia basada en 
 * la ubicación del cliente o una ubicación por defecto en Manizales.
 */
const getNearbyMechanics = async (req, res) => {
    try {
        // 1. Coordenadas base (Mariana). 
        // Intentamos obtenerlas de la query string, si no, usamos Manizales Centro.
        const latCliente = parseFloat(req.query.lat) || 5.067;
        const lngCliente = parseFloat(req.query.lng) || -75.517;

        console.log(`=== SIMULACIÓN DISTANCIA (MECHIN-71) ===`);
        console.log(`Ubicación cliente: ${latCliente}, ${lngCliente}`);

        // 2. Consulta a la base de datos siguiendo tu esquema
        const query = `
            SELECT 
                u.nombre_completo, 
                u.latitud, 
                u.longitud,
                pm.id as mecanico_id,
                pm.promedio_rating,
                (SELECT e.nombre FROM especialidades e 
                 JOIN mecanico_especialidades me ON e.id = me.especialidad_id 
                 WHERE me.perfil_mecanico_id = pm.id LIMIT 1) as especialidad
            FROM usuarios u
            JOIN perfiles_mecanico pm ON u.id = pm.usuario_id
            WHERE pm.disponible = true 
              AND pm.estado_validacion IN ('aprobado', 'pendiente')
        `;
        
        const result = await db.query(query);

        // 3. Procesamiento y cálculo de distancia simulada
        const mechanics = result.rows.map(m => {
            // Si el mecánico no tiene coordenadas en DB, generamos unas cerca de Manizales
            // Usamos una variación pequeña para que parezcan "vecinos"
            const mLat = m.latitud ? parseFloat(m.latitud) : (5.065 + (Math.random() - 0.5) * 0.02);
            const mLng = m.longitud ? parseFloat(m.longitud) : (-75.510 + (Math.random() - 0.5) * 0.02);

            // Fórmula de distancia euclidiana simplificada para simulación (Pitágoras)
            // Multiplicamos por 111 para convertir la diferencia de grados a kilómetros aprox.
            const difLat = mLat - latCliente;
            const difLng = mLng - lngCliente;
            const distKm = Math.sqrt(difLat * difLat + difLng * difLng) * 111;

            return {
                ...m,
                lat: mLat,
                lng: mLng,
                // Redondeamos a 1 decimal para que en la UI se vea como "0.6 km"
                distancia: parseFloat(distKm.toFixed(1)) 
            };
        });

        // 4. ORDENAR POR CERCANÍA (Requerimiento clave de MECHIN-71)
        // El mecánico más cercano aparecerá primero en el array
        mechanics.sort((a, b) => a.distancia - b.distancia);

        console.log(`Mecánicos procesados y ordenados: ${mechanics.length}`);
        
        res.status(200).json({
            ok: true,
            mechanics
        });

    } catch (error) {
        console.error("❌ Error en getNearbyMechanics:", error.message);
        res.status(500).json({ 
            ok: false, 
            message: "Error al obtener mecánicos cercanos" 
        });
    }
};

// --- RUTAS MECÁNICO (PERFIL Y DISPONIBILIDAD) ---

const getProfile = async (req, res) => {
    const { userId } = req.params;
    try {
        const query = `
            SELECT pm.*, u.nombre_completo, u.correo, u.telefono, u.direccion 
            FROM perfiles_mecanico pm
            JOIN usuarios u ON pm.usuario_id = u.id
            WHERE pm.usuario_id = $1
        `;
        const result = await db.query(query, [userId]);
        if (result.rows.length === 0) return res.status(404).json({ ok: false, message: "Perfil no encontrado" });
        res.json({ ok: true, profile: result.rows[0] });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

const updateProfile = async (req, res) => {
    const { userId } = req.params;
    // Ahora también recibimos "especialidades" (un arreglo de IDs, ej: [1, 3, 5])
    const { biografia, telefono, direccion, especialidades } = req.body;
    
    try {
        // INICIAMOS TRANSACCIÓN (Para que si algo falla, no se guarde a medias)
        await db.query('BEGIN');

        // 1. Actualizar tabla usuarios (datos básicos)
        await db.query(`
            UPDATE usuarios SET telefono = $1, direccion = $2 WHERE id = $3
        `, [telefono, direccion, userId]);

        // 2. Actualizar tabla perfiles_mecanico (biografía) y OBTENER su ID interno
        const perfilResult = await db.query(`
            UPDATE perfiles_mecanico SET biografia = $1 WHERE usuario_id = $2
            RETURNING id
        `, [biografia, userId]);

        // Verificamos que el perfil exista
        if (perfilResult.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ ok: false, message: "Perfil de mecánico no encontrado" });
        }

        const perfilMecanicoId = perfilResult.rows[0].id;

        // 3. Gestionar Especialidades (Si vienen en la petición)
        if (Array.isArray(especialidades)) {
            // A. Borramos las especialidades viejas de este mecánico
            await db.query(`
                DELETE FROM mecanico_especialidades WHERE perfil_mecanico_id = $1
            `, [perfilMecanicoId]);

            // B. Insertamos las nuevas especialidades marcadas
            if (especialidades.length > 0) {
                // Iteramos sobre los IDs y los insertamos uno por uno
                for (let especialidadId of especialidades) {
                    await db.query(`
                        INSERT INTO mecanico_especialidades (perfil_mecanico_id, especialidad_id)
                        VALUES ($1, $2)
                    `, [perfilMecanicoId, especialidadId]);
                }
            }
        }

        // CONFIRMAMOS TRANSACCIÓN
        await db.query('COMMIT');
        res.json({ ok: true, message: "Perfil y especialidades actualizados correctamente" });

    } catch (error) {
        // SI ALGO FALLA, REVERTIMOS TODO
        await db.query('ROLLBACK');
        console.error("❌ Error en updateProfile:", error);
        res.status(500).json({ ok: false, error: error.message });
    }
};

const toggleAvailability = async (req, res) => {
    const { userId } = req.params;
    const { disponible } = req.body;

    try {
        await db.query(`
            UPDATE perfiles_mecanico SET disponible = $1 WHERE usuario_id = $2
        `, [disponible, userId]);
        
        res.json({ ok: true, message: `Disponibilidad actualizada a ${disponible}` });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

// Obtener lista de todas las especialidades disponibles en el sistema
const getAllSpecialties = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM especialidades ORDER BY nombre ASC');
        res.json({ ok: true, specialties: result.rows });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

// Obtener las especialidades que tiene un mecánico específico
const getMechanicSpecialties = async (req, res) => {
    const { userId } = req.params;
    try {
        const query = `
            SELECT e.* FROM especialidades e
            JOIN mecanico_especialidades me ON e.id = me.especialidad_id
            JOIN perfiles_mecanico pm ON me.perfil_mecanico_id = pm.id
            WHERE pm.usuario_id = $1
        `;
        const result = await db.query(query, [userId]);
        res.json({ ok: true, specialties: result.rows });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

module.exports = { 
    getNearbyMechanics, 
    getProfile, 
    updateProfile, 
    toggleAvailability, 
    getAllSpecialties, 
    getMechanicSpecialties 
};