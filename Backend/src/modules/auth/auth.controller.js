const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../../config/db');

// ============================================================
// MECHIN-4 — Registro de usuario
// ============================================================
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { firstName, lastName, email, phone, city, password, role, specialties } = req.body;

  // Combinamos nombre completo para la BD
  const nombreCompleto = `${firstName} ${lastName}`;

  // Mapeamos el rol del frontend al nombre en la BD
  const rolMap = { client: 'cliente', mechanic: 'mecanico', store: 'tienda' };
  const rolNombre = rolMap[role] || role;

  try {
    // Verificar si el correo ya existe
    const existe = await db.query('SELECT id FROM usuarios WHERE correo = $1', [email]);
    if (existe.rows.length > 0) {
      return res.status(409).json({ msg: 'El correo ya está registrado' });
    }

    // Obtener el id del rol
    const rolResult = await db.query('SELECT id FROM roles WHERE nombre = $1', [rolNombre]);
    if (rolResult.rows.length === 0) {
      return res.status(400).json({ msg: 'Rol inválido' });
    }
    const rolId = rolResult.rows[0].id;

    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(password, salt);

    // Insertar el usuario
    const nuevoUsuario = await db.query(
      `INSERT INTO usuarios (nombre_completo, correo, telefono, contrasena_hash)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [nombreCompleto, email, phone || null, contrasenaHash]
    );
    const usuarioId = nuevoUsuario.rows[0].id;

    // Asignar el rol en usuarios_roles (relación muchos a muchos)
    await db.query(
      'INSERT INTO usuarios_roles (usuario_id, rol_id) VALUES ($1, $2)',
      [usuarioId, rolId]
    );

    // Si es mecánico, crear perfil y asignar especialidades
    if (rolNombre === 'mecanico') {
      const perfilResult = await db.query(
        `INSERT INTO perfiles_mecanico (usuario_id, ciudad) VALUES ($1, $2) RETURNING id`,
        [usuarioId, city || null]
      );
      const perfilId = perfilResult.rows[0].id;

      // Asignar especialidades si vienen en el registro
      if (specialties && specialties.length > 0) {
        for (const nombreEspecialidad of specialties) {
          const espResult = await db.query(
            'SELECT id FROM especialidades WHERE nombre = $1',
            [nombreEspecialidad]
          );
          if (espResult.rows.length > 0) {
            await db.query(
              'INSERT INTO mecanico_especialidades (perfil_mecanico_id, especialidad_id) VALUES ($1, $2)',
              [perfilId, espResult.rows[0].id]
            );
          }
        }
      }
    }

    // Si es tienda, crear perfil de tienda
    if (rolNombre === 'tienda') {
      await db.query(
        `INSERT INTO tiendas (usuario_id, nombre) VALUES ($1, $2)`,
        [usuarioId, nombreCompleto]
      );
    }

    // Generar JWT
    const payload = { user: { id: usuarioId, role: rolNombre } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.status(201).json({
        token,
        user: { id: usuarioId, nombreCompleto, email, role: rolNombre }
      });
    });

  } catch (err) {
    console.error('ERROR REGISTRO:', err);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// ============================================================
// MECHIN-12 — Inicio de sesión
// ============================================================
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    // Buscar usuario con su rol mediante JOIN
    const result = await db.query(
      `SELECT u.id, u.nombre_completo, u.correo, u.contrasena_hash, u.esta_activo,
              r.nombre AS rol
       FROM usuarios u
       JOIN usuarios_roles ur ON u.id = ur.usuario_id
       JOIN roles r ON ur.rol_id = r.id
       WHERE u.correo = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    const usuario = result.rows[0];

    // Verificar que la cuenta esté activa
    if (!usuario.esta_activo) {
      return res.status(403).json({ msg: 'Cuenta desactivada. Contacta al administrador' });
    }

    // Verificar contraseña
    const coincide = await bcrypt.compare(password, usuario.contrasena_hash);
    if (!coincide) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    // Generar JWT
    const payload = { user: { id: usuario.id, role: usuario.rol } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.json({
        token,
        user: {
          id: usuario.id,
          nombreCompleto: usuario.nombre_completo,
          email: usuario.correo,
          role: usuario.rol
        }
      });
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// ============================================================
// MECHIN-30 — Obtener usuario autenticado
// ============================================================
exports.getUser = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.nombre_completo, u.correo, u.telefono, u.esta_activo,
              r.nombre AS rol
       FROM usuarios u
       JOIN usuarios_roles ur ON u.id = ur.usuario_id
       JOIN roles r ON ur.rol_id = r.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// ============================================================
// MECHIN-22 — Cierre de sesión
// ============================================================
exports.logout = (req, res) => {
  // El token se invalida en el cliente eliminándolo del almacenamiento local
  res.json({ msg: 'Sesión cerrada exitosamente' });
};

// ============================================================
// MECHIN-28 — Recuperación de contraseña (fase 1: solicitud)
// ============================================================
exports.forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email } = req.body;

  try {
    const result = await db.query('SELECT id FROM usuarios WHERE correo = $1', [email]);

    // Respuesta genérica por seguridad (no revelar si el correo existe)
    if (result.rows.length === 0) {
      return res.json({ msg: 'Si el correo existe, recibirás un código de recuperación' });
    }

    const usuarioId = result.rows[0].id;

    // Generar código de 6 dígitos como token
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiraEn = new Date(Date.now() + 15 * 60000); // 15 minutos

    // Eliminar tokens anteriores del mismo usuario
    await db.query('DELETE FROM recuperacion_contrasena WHERE usuario_id = $1', [usuarioId]);

    // Insertar nuevo token con los campos correctos de la BD
    await db.query(
      'INSERT INTO recuperacion_contrasena (usuario_id, token, expira_en) VALUES ($1, $2, $3)',
      [usuarioId, token, expiraEn]
    );

    // Simulación de envío de correo (en desarrollo)
    console.log('\n========================================');
    console.log(`📧 SIMULACIÓN DE CORREO — ${email}`);
    console.log(`🔑 CÓDIGO: ${token}`);
    console.log('========================================\n');

    res.json({ msg: 'Si el correo existe, recibirás un código de recuperación' });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// ============================================================
// MECHIN-28 — Recuperación de contraseña (fase 2: verificación)
// ============================================================
exports.verifyCode = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, code, newPassword } = req.body;

  try {
    // Buscar el usuario por correo
    const userResult = await db.query('SELECT id FROM usuarios WHERE correo = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ msg: 'Código inválido o expirado' });
    }
    const usuarioId = userResult.rows[0].id;

    // Verificar el token: debe existir, no estar usado y no haber expirado
    const tokenResult = await db.query(
      `SELECT id FROM recuperacion_contrasena
       WHERE usuario_id = $1 AND token = $2
       AND expira_en > NOW() AND usado = FALSE`,
      [usuarioId, code]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ msg: 'Código inválido o expirado' });
    }

    // Hash de la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const nuevaHash = await bcrypt.hash(newPassword, salt);

    // Actualizar contraseña del usuario
    await db.query(
      'UPDATE usuarios SET contrasena_hash = $1 WHERE id = $2',
      [nuevaHash, usuarioId]
    );

    // Marcar el token como usado (no eliminarlo, para auditoría)
    await db.query(
      'UPDATE recuperacion_contrasena SET usado = TRUE WHERE id = $1',
      [tokenResult.rows[0].id]
    );

    res.json({ msg: 'Contraseña actualizada correctamente' });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};