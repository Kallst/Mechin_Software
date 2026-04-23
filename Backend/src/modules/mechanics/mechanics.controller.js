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
              AND pm.estado_validacion = 'aprobado'
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

module.exports = { getNearbyMechanics };