const db = require('../../config/db');
const {
    crearRepuesto,
    editarRepuesto,
    eliminarRepuesto,
    obtenerCatalogo,
    obtenerRepuestoPorId,
    cambiarEstadoRepuesto,
    obtenerCategorias,
    obtenerTiendaPorUsuario,
    crearTienda
} = require('./catalog.queries');

// ─── MECHIN-40: Registrar repuesto ──────────────────────────
const registrarRepuesto = async (req, res) => {
    try {
        const usuario_id = req.user.id;
        let tienda = await obtenerTiendaPorUsuario(usuario_id);

        // Si el usuario tienda aún no tiene tienda creada, la creamos automáticamente
        if (!tienda) {
            tienda = await crearTienda({
                usuario_id,
                nombre: req.body.tienda_nombre || 'Mi Tienda',
                direccion: req.body.tienda_direccion || '',
                telefono: req.body.tienda_telefono || ''
            });
        }

        const { categoria_id, nombre, descripcion, marca, referencia, precio, stock, imagen_url } = req.body;

        if (!categoria_id || !nombre || !precio) {
            return res.status(400).json({ ok: false, message: 'categoria_id, nombre y precio son obligatorios' });
        }

        const repuesto = await crearRepuesto({
            tienda_id: tienda.id,
            categoria_id, nombre, descripcion, marca, referencia,
            precio, stock: stock || 0, imagen_url
        });

        res.status(201).json({ ok: true, message: 'Repuesto registrado exitosamente', repuesto });
    } catch (error) {
        console.error('❌ Error registrando repuesto:', error.message);
        res.status(500).json({ ok: false, message: error.message });
    }
};

// ─── MECHIN-41: Editar repuesto ──────────────────────────────
const actualizarRepuesto = async (req, res) => {
    try {
        const { id } = req.params;
        const repuesto = await editarRepuesto(id, req.body);

        if (!repuesto) {
            return res.status(404).json({ ok: false, message: 'Repuesto no encontrado' });
        }

        res.status(200).json({ ok: true, message: 'Repuesto actualizado', repuesto });
    } catch (error) {
        console.error('❌ Error actualizando repuesto:', error.message);
        res.status(500).json({ ok: false, message: error.message });
    }
};

// ─── MECHIN-42: Eliminar repuesto ───────────────────────────
const borrarRepuesto = async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await eliminarRepuesto(id);

        if (!resultado) {
            return res.status(404).json({ ok: false, message: 'Repuesto no encontrado' });
        }

        res.status(200).json({ ok: true, message: 'Repuesto eliminado correctamente' });
    } catch (error) {
        console.error('❌ Error eliminando repuesto:', error.message);
        res.status(500).json({ ok: false, message: error.message });
    }
};

// ─── MECHIN-43 + 46 + 47: Catálogo con búsqueda y filtros ───
const listarCatalogo = async (req, res) => {
    try {
        const { nombre, categoria_id, marca, estado, tienda_id, page, limit } = req.query;
        const resultado = await obtenerCatalogo({ nombre, categoria_id, marca, estado, tienda_id, page, limit });
        res.status(200).json({ ok: true, ...resultado });
    } catch (error) {
        console.error('❌ Error listando catálogo:', error.message);
        res.status(500).json({ ok: false, message: error.message });
    }
};

// ─── MECHIN-44: Detalle de repuesto ─────────────────────────
const detalleRepuesto = async (req, res) => {
    try {
        const { id } = req.params;
        const repuesto = await obtenerRepuestoPorId(id);

        if (!repuesto) {
            return res.status(404).json({ ok: false, message: 'Repuesto no encontrado' });
        }

        res.status(200).json({ ok: true, repuesto });
    } catch (error) {
        console.error('❌ Error obteniendo repuesto:', error.message);
        res.status(500).json({ ok: false, message: error.message });
    }
};

// ─── MECHIN-49: Cambiar estado del producto ──────────────────
const actualizarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const estadosValidos = ['disponible', 'agotado', 'descontinuado'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ ok: false, message: `Estado inválido. Use: ${estadosValidos.join(', ')}` });
        }

        const repuesto = await cambiarEstadoRepuesto(id, estado);
        if (!repuesto) {
            return res.status(404).json({ ok: false, message: 'Repuesto no encontrado' });
        }

        res.status(200).json({ ok: true, message: 'Estado actualizado', repuesto });
    } catch (error) {
        console.error('❌ Error actualizando estado:', error.message);
        res.status(500).json({ ok: false, message: error.message });
    }
};

// ─── Categorías ──────────────────────────────────────────────
const listarCategorias = async (req, res) => {
    try {
        const categorias = await obtenerCategorias();
        res.status(200).json({ ok: true, categorias });
    } catch (error) {
        console.error('❌ Error listando categorías:', error.message);
        res.status(500).json({ ok: false, message: error.message });
    }
};

module.exports = {
    registrarRepuesto,
    actualizarRepuesto,
    borrarRepuesto,
    listarCatalogo,
    detalleRepuesto,
    actualizarEstado,
    listarCategorias
};