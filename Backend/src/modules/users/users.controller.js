const db = require('../../config/db');
const bcrypt = require('bcrypt');

const getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        // CORRECCIÓN 1: Agregamos 'telefono' al SELECT
        const query = 'SELECT id, nombre_completo, correo, telefono, foto_perfil FROM usuarios WHERE id = $1';
        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
        }

        res.status(200).json({
            ok: true,
            user: result.rows[0]
        });
    } catch (error) {
        console.error("❌ Error real en DB:", error.message);
        res.status(500).json({ ok: false, message: error.message });
    }
};

const updateProfile = async (req, res) => {
    const { id } = req.params; 
    // CORRECCIÓN 2: Extraemos el 'telefono' del req.body
    const { nombre_completo, correo, telefono, password } = req.body;

    try {
        // CORRECCIÓN 3: Agregamos 'telefono = $3' a la consulta y a los values
        let query = 'UPDATE usuarios SET nombre_completo = $1, correo = $2, telefono = $3';
        let values = [nombre_completo, correo, telefono];
        let paramIndex = 4; // Ajustamos el índice porque ahora hay 3 valores fijos al inicio

        if (password && password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            query += `, contrasena = $${paramIndex}`; // Ajusta 'contrasena' si tu columna se llama 'password'
            values.push(hashedPassword);
            paramIndex++;
        }

        // CORRECCIÓN 4: Agregamos 'telefono' al RETURNING para que React lo reciba de vuelta
        query += ` WHERE id = $${paramIndex} RETURNING id, nombre_completo, correo, telefono, foto_perfil`;
        values.push(id);

        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
        }

        res.status(200).json({ ok: true, message: "Perfil actualizado", user: result.rows[0] });
    } catch (error) {
        console.error("❌ Error al actualizar perfil:", error.message);
        if (error.code === '23505') return res.status(400).json({ ok: false, message: "El correo ya está en uso." });
        res.status(500).json({ ok: false, message: "Error del servidor" });
    }
};

const deleteAccount = async (req, res) => {
    const { id } = req.params;
    try {
        const query = 'DELETE FROM usuarios WHERE id = $1 RETURNING id';
        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
        }

        res.status(200).json({ ok: true, message: "Cuenta eliminada correctamente" });
    } catch (error) {
        console.error("❌ Error al eliminar cuenta:", error.message);
        res.status(500).json({ ok: false, message: "Error al eliminar la cuenta. Es posible que tengas registros pendientes." });
    }
};

module.exports = { getUserById, updateProfile, deleteAccount };