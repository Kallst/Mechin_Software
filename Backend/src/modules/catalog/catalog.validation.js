// ─── MECHIN-48: Validación de datos de repuestos ────────────

const validarRepuesto = (req, res, next) => {
    const { nombre, precio, categoria_id, stock } = req.body;
    const errores = [];

    if (!nombre || nombre.trim().length < 2) {
        errores.push('El nombre del repuesto es obligatorio (mínimo 2 caracteres)');
    }
    if (nombre && nombre.trim().length > 200) {
        errores.push('El nombre no puede superar 200 caracteres');
    }
    if (!precio || isNaN(precio) || parseFloat(precio) < 0) {
        errores.push('El precio es obligatorio y debe ser un número mayor o igual a 0');
    }
    if (!categoria_id || isNaN(categoria_id)) {
        errores.push('La categoría es obligatoria');
    }
    if (stock !== undefined && (isNaN(stock) || parseInt(stock) < 0)) {
        errores.push('El stock debe ser un número mayor o igual a 0');
    }

    if (errores.length > 0) {
        return res.status(400).json({ ok: false, message: 'Datos inválidos', errores });
    }

    next();
};

const validarEstado = (req, res, next) => {
    const { estado } = req.body;
    const estadosValidos = ['disponible', 'agotado', 'descontinuado'];

    if (!estado || !estadosValidos.includes(estado)) {
        return res.status(400).json({
            ok: false,
            message: `Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`
        });
    }

    next();
};

module.exports = { validarRepuesto, validarEstado };