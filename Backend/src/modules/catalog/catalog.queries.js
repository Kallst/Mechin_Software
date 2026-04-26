const db = require('../../config/db');

// ─── MECHIN-40: Registro de repuesto ────────────────────────
const crearRepuesto = async ({ tienda_id, categoria_id, nombre, descripcion, marca, referencia, precio, stock, imagen_url }) => {
    const result = await db.query(
        `INSERT INTO repuestos 
            (tienda_id, categoria_id, nombre, descripcion, marca, referencia, precio, stock, imagen_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [tienda_id, categoria_id, nombre, descripcion, marca, referencia, precio, stock, imagen_url]
    );
    return result.rows[0];
};

// ─── MECHIN-41: Edición de repuesto ─────────────────────────
const editarRepuesto = async (id, { categoria_id, nombre, descripcion, marca, referencia, precio, stock, imagen_url }) => {
    const result = await db.query(
        `UPDATE repuestos
         SET categoria_id = $1, nombre = $2, descripcion = $3, marca = $4,
             referencia = $5, precio = $6, stock = $7, imagen_url = $8,
             actualizado_en = NOW()
         WHERE id = $9 AND esta_activo = TRUE
         RETURNING *`,
        [categoria_id, nombre, descripcion, marca, referencia, precio, stock, imagen_url, id]
    );
    return result.rows[0];
};

// ─── MECHIN-42: Eliminación lógica ──────────────────────────
const eliminarRepuesto = async (id) => {
    const result = await db.query(
        `UPDATE repuestos SET esta_activo = FALSE, actualizado_en = NOW()
         WHERE id = $1 RETURNING id`,
        [id]
    );
    return result.rows[0];
};

// ─── MECHIN-43: Catálogo con búsqueda y filtros ─────────────
const obtenerCatalogo = async ({ nombre, categoria_id, marca, estado, tienda_id, page = 1, limit = 12 }) => {
    const offset = (page - 1) * limit;
    const condiciones = ['r.esta_activo = TRUE'];
    const valores = [];
    let idx = 1;

    if (nombre) {
        condiciones.push(`(r.nombre ILIKE $${idx} OR r.marca ILIKE $${idx})`);
        valores.push(`%${nombre}%`); idx++;
    }
    if (categoria_id) {
        condiciones.push(`r.categoria_id = $${idx}`);
        valores.push(categoria_id); idx++;
    }
    if (marca) {
        condiciones.push(`r.marca ILIKE $${idx}`);
        valores.push(`%${marca}%`); idx++;
    }
    if (estado) {
        condiciones.push(`r.estado = $${idx}`);
        valores.push(estado); idx++;
    }
    if (tienda_id) {
        condiciones.push(`r.tienda_id = $${idx}`);
        valores.push(tienda_id); idx++;
    }

    const where = condiciones.join(' AND ');

    const dataResult = await db.query(
        `SELECT r.*, c.nombre AS categoria_nombre, t.nombre AS tienda_nombre
         FROM repuestos r
         JOIN categorias_repuesto c ON r.categoria_id = c.id
         JOIN tiendas t ON r.tienda_id = t.id
         WHERE ${where}
         ORDER BY r.creado_en DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...valores, limit, offset]
    );

    const countResult = await db.query(
        `SELECT COUNT(*) FROM repuestos r WHERE ${where}`,
        valores
    );

    return {
        repuestos: dataResult.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    };
};

// ─── MECHIN-44: Detalle de un repuesto ──────────────────────
const obtenerRepuestoPorId = async (id) => {
    const result = await db.query(
        `SELECT r.*, c.nombre AS categoria_nombre, t.nombre AS tienda_nombre,
                t.telefono AS tienda_telefono, t.direccion AS tienda_direccion
         FROM repuestos r
         JOIN categorias_repuesto c ON r.categoria_id = c.id
         JOIN tiendas t ON r.tienda_id = t.id
         WHERE r.id = $1 AND r.esta_activo = TRUE`,
        [id]
    );
    return result.rows[0];
};

// ─── MECHIN-49: Estado del producto ─────────────────────────
const cambiarEstadoRepuesto = async (id, estado) => {
    const result = await db.query(
        `UPDATE repuestos SET estado = $1, actualizado_en = NOW()
         WHERE id = $2 AND esta_activo = TRUE RETURNING *`,
        [estado, id]
    );
    return result.rows[0];
};

// ─── Todas las categorías ────────────────────────────────────
const obtenerCategorias = async () => {
    const result = await db.query(`SELECT * FROM categorias_repuesto ORDER BY nombre`);
    return result.rows;
};

// ─── Tienda por usuario_id ───────────────────────────────────
const obtenerTiendaPorUsuario = async (usuario_id) => {
    const result = await db.query(
        `SELECT * FROM tiendas WHERE usuario_id = $1 AND esta_activa = TRUE`,
        [usuario_id]
    );
    return result.rows[0];
};

// ─── Crear tienda si no existe ───────────────────────────────
const crearTienda = async ({ usuario_id, nombre, direccion, telefono }) => {
    const result = await db.query(
        `INSERT INTO tiendas (usuario_id, nombre, direccion, telefono)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [usuario_id, nombre, direccion, telefono]
    );
    return result.rows[0];
};

module.exports = {
    crearRepuesto,
    editarRepuesto,
    eliminarRepuesto,
    obtenerCatalogo,
    obtenerRepuestoPorId,
    cambiarEstadoRepuesto,
    obtenerCategorias,
    obtenerTiendaPorUsuario,
    crearTienda
};